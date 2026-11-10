import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomSyncState {
  room: string;
  updatedAt: string;
  connectedPeers: number;
  clipboard: {
    text: string;
    sourceDevice: 'phone-a' | 'phone-b';
    timestamp: string;
  };
  activeCall: {
    callId: string;
    originDevice: 'phone-a' | 'phone-b';
    callerName: string;
    callerNumber: string;
    status: 'idle' | 'ringing' | 'active-on-origin' | 'active-bthfp-routed' | 'rejected' | 'ended';
    actionTakenBy?: 'phone-a' | 'phone-b';
    timestamp: string;
  };
  notifications: Array<{
    id: string;
    originDevice: 'phone-a' | 'phone-b';
    appName: string;
    title: string;
    content: string;
    timestamp: string;
    dismissed: boolean;
    repliedText?: string;
  }>;
  relayedCiphertexts: Array<{
    id: string;
    ciphertext: string;
    timestamp: string;
  }>;
}

const rooms = new Map<string, RoomSyncState>();
const sseClients = new Map<string, Set<express.Response>>();

function getOrCreateRoom(roomCode: string): RoomSyncState {
  const normalized = (roomCode || '482-910').trim();
  let state = rooms.get(normalized);
  if (!state) {
    state = {
      room: normalized,
      updatedAt: new Date().toTimeString().slice(0, 8),
      connectedPeers: 0,
      clipboard: {
        text: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIContinuumSyncKey2026',
        sourceDevice: 'phone-a',
        timestamp: '21:51:45',
      },
      activeCall: {
        callId: 'call-init',
        originDevice: 'phone-a',
        callerName: 'Elena Vance (Lead Architect)',
        callerNumber: '+1 (415) 890-4312',
        status: 'idle',
        timestamp: '21:51:00',
      },
      notifications: [
        {
          id: 'live-notif-1',
          originDevice: 'phone-a',
          appName: 'Signal',
          title: 'Marcus Chen',
          content: 'Just landed at Terminal 2. Are you near the pickup zone?',
          timestamp: '21:48:10',
          dismissed: false,
        },
      ],
      relayedCiphertexts: [],
    };
    rooms.set(normalized, state);
  }
  return state;
}

function broadcastRoomState(roomCode: string) {
  const state = getOrCreateRoom(roomCode);
  const clients = sseClients.get(state.room);
  state.connectedPeers = clients ? clients.size : 0;
  if (!clients) return;
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

function collectAndroidProjectFiles(dirPath: string, baseDir: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(dirPath)) return result;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      Object.assign(result, collectAndroidProjectFiles(fullPath, baseDir));
    } else {
      result[relPath] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
  return result;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Real-Time SSE Stream for Physical Phone-to-Phone Live Sync
  app.get('/api/sync/stream', (req, res) => {
    const room = String(req.query.room || '482-910').trim();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!sseClients.has(room)) {
      sseClients.set(room, new Set());
    }
    const roomSet = sseClients.get(room)!;
    roomSet.add(res);

    const state = getOrCreateRoom(room);
    state.connectedPeers = roomSet.size;
    broadcastRoomState(room);

    req.on('close', () => {
      roomSet.delete(res);
      state.connectedPeers = roomSet.size;
      broadcastRoomState(room);
    });
  });

  // 2. Get Current Room Sync State
  app.get('/api/sync/state', (req, res) => {
    const room = String(req.query.room || '482-910').trim();
    const state = getOrCreateRoom(room);
    res.json(state);
  });

  // 3. Mutate Room Sync State (Clipboard, Notifications, Call Answer/Reject)
  app.post('/api/sync/event', (req, res) => {
    const { room = '482-910', eventType, payload } = req.body || {};
    const state = getOrCreateRoom(String(room));
    const now = new Date().toTimeString().slice(0, 8);
    state.updatedAt = now;

    if (eventType === 'CLIPBOARD_SYNC' && payload?.text) {
      state.clipboard = {
        text: String(payload.text),
        sourceDevice: payload.sourceDevice === 'phone-b' ? 'phone-b' : 'phone-a',
        timestamp: now,
      };
    } else if (eventType === 'NOTIFICATION_POST' && payload?.title) {
      const id = String(payload.id || `live-notif-${Date.now()}`);
      if (!state.notifications.some((n) => n.id === id)) {
        state.notifications.unshift({
          id,
          originDevice: payload.originDevice === 'phone-b' ? 'phone-b' : 'phone-a',
          appName: String(payload.appName || 'Signal'),
          title: String(payload.title),
          content: String(payload.content || ''),
          timestamp: now,
          dismissed: false,
        });
      }
    } else if (eventType === 'NOTIFICATION_DISMISS' && payload?.id) {
      state.notifications = state.notifications.map((n) =>
        n.id === payload.id ? { ...n, dismissed: true } : n
      );
    } else if (eventType === 'NOTIFICATION_REPLY' && payload?.id && payload?.replyText) {
      state.notifications = state.notifications.map((n) =>
        n.id === payload.id ? { ...n, repliedText: String(payload.replyText) } : n
      );
    } else if (eventType === 'CALL_ACTION' && payload?.status) {
      state.activeCall = {
        callId: String(payload.callId || state.activeCall.callId || `call-${Date.now()}`),
        originDevice: payload.originDevice || state.activeCall.originDevice || 'phone-a',
        callerName: String(payload.callerName || state.activeCall.callerName),
        callerNumber: String(payload.callerNumber || state.activeCall.callerNumber),
        status: payload.status,
        actionTakenBy: payload.actionTakenBy,
        timestamp: now,
      };
    }

    broadcastRoomState(state.room);
    res.json({ ok: true, state });
  });

  // 4. Native Android APK Encrypted Relay Endpoint (used by HybridTransportEngine.kt)
  app.post('/api/sync/relay', (req, res) => {
    const { room = '482-910', ciphertext } = req.body || {};
    const state = getOrCreateRoom(String(room));
    const now = new Date().toTimeString().slice(0, 8);
    if (ciphertext) {
      state.relayedCiphertexts.unshift({
        id: `relay-${Date.now()}`,
        ciphertext: String(ciphertext).slice(0, 120),
        timestamp: now,
      });
      state.relayedCiphertexts = state.relayedCiphertexts.slice(0, 10);
      broadcastRoomState(state.room);
    }
    res.json({ ok: true });
  });

  // 5. Return All Pre-Built Android Studio Project Files as JSON or Self-Extracting Script
  app.get('/api/android-project/files', (_req, res) => {
    const androidDir = path.resolve(__dirname, 'android-continuumsync');
    const files = collectAndroidProjectFiles(androidDir, androidDir);
    res.json({ projectRoot: 'ContinuumSync-Android', fileCount: Object.keys(files).length, files });
  });

  app.get('/api/android-project/install-script.sh', (_req, res) => {
    const androidDir = path.resolve(__dirname, 'android-continuumsync');
    const files = collectAndroidProjectFiles(androidDir, androidDir);

    const lines: string[] = [
      '#!/usr/bin/env bash',
      '# ============================================================================',
      '# ContinuumSync — Self-Extracting Android Studio Project & ADB Installer',
      '# Unpacks the complete custom Android 10-15 project and installs on connected phones',
      '# ============================================================================',
      'set -e',
      'mkdir -p ContinuumSync-Android',
      'cd ContinuumSync-Android',
      'echo "Unpacking ContinuumSync Android Studio project files..."',
    ];

    for (const [relPath, content] of Object.entries(files)) {
      const dir = path.posix.dirname(relPath);
      if (dir && dir !== '.') {
        lines.push(`mkdir -p "${dir}"`);
      }
      lines.push(`cat << 'EOF_CONTINUUM_FILE' > "${relPath}"`);
      lines.push(content);
      lines.push('EOF_CONTINUUM_FILE');
    }

    lines.push('echo "All 11 Android Studio project files extracted into ./ContinuumSync-Android"');
    lines.push('if command -v gradle >/dev/null 2>&1; then');
    lines.push('  echo "Building debug APK with Gradle..."');
    lines.push('  gradle assembleDebug');
    lines.push('  if command -v adb >/dev/null 2>&1; then');
    lines.push('    for SERIAL in $(adb devices | awk "NR>1 && \\$2==\\"device\\" {print \\$1}"); do');
    lines.push('      echo "Installing APK and granting permissions on device $SERIAL..."');
    lines.push('      adb -s "$SERIAL" install -r app/build/outputs/apk/debug/app-debug.apk');
    lines.push('      adb -s "$SERIAL" shell pm grant dev.continuumsync.bridge android.permission.READ_PHONE_STATE || true');
    lines.push('      adb -s "$SERIAL" shell pm grant dev.continuumsync.bridge android.permission.READ_CALL_LOG || true');
    lines.push('      adb -s "$SERIAL" shell pm grant dev.continuumsync.bridge android.permission.READ_CONTACTS || true');
    lines.push('      adb -s "$SERIAL" shell pm grant dev.continuumsync.bridge android.permission.ANSWER_PHONE_CALLS || true');
    lines.push('      adb -s "$SERIAL" shell cmd notification allow_listener dev.continuumsync.bridge/dev.continuumsync.bridge.notifications.SyncNotificationListenerService || true');
    lines.push('    done');
    lines.push('  fi');
    lines.push('else');
    lines.push('  echo "Open ./ContinuumSync-Android in Android Studio and click Run (Shift+F10) to install on both phones."');
    lines.push('fi');

    res.setHeader('Content-Type', 'text/x-shellscript; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="setup-continuumsync-android.sh"'
    );
    res.send(lines.join('\n'));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ContinuumSync server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
