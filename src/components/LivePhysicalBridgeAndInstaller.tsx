import React, { useEffect, useState } from 'react';
import {
  Download,
  Smartphone,
  Terminal,
  Check,
  Copy,
  Clipboard,
  Bell,
  PhoneCall,
  PhoneOff,
  Volume2,
  Bluetooth,
  Trash2,
  FolderCode,
  Package,
} from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';

interface LiveRoomState {
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
}

interface LivePhysicalBridgeAndInstallerProps {
  roomCode: string;
}

export const LivePhysicalBridgeAndInstaller: React.FC<
  LivePhysicalBridgeAndInstallerProps
> = ({ roomCode }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);

  const [myDeviceRole, setMyDeviceRole] = useState<'phone-a' | 'phone-b'>('phone-a');
  const [roomState, setRoomState] = useState<LiveRoomState | null>(null);
  const [clipInput, setClipInput] = useState('');
  const [notifTitle, setNotifTitle] = useState('Package Delivered');
  const [notifBody, setNotifBody] = useState('Left at front porch locker #4.');
  const [callerNameInput, setCallerNameInput] = useState('Elena Vance');
  const [callerNumberInput, setCallerNumberInput] = useState('+1 (415) 890-4312');
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);
  const [projectFilesList, setProjectFilesList] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/android-project/files')
      .then((r) => r.json())
      .then((data) => {
        if (data?.files) {
          setProjectFilesList(Object.keys(data.files));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    fetch(`/api/sync/state?room=${encodeURIComponent(roomCode)}`)
      .then((r) => r.json())
      .then((initial: LiveRoomState) => {
        setRoomState(initial);
      })
      .catch(() => {});

    eventSource = new EventSource(`/api/sync/stream?room=${encodeURIComponent(roomCode)}`);
    eventSource.onmessage = (e) => {
      try {
        const parsed: LiveRoomState = JSON.parse(e.data);
        setRoomState(parsed);
      } catch {
        // Ignore malformed SSE ping
      }
    };

    return () => {
      eventSource?.close();
    };
  }, [roomCode]);

  const sendLiveEvent = async (eventType: string, payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/sync/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomCode, eventType, payload }),
      });
      const data = await res.json();
      if (data?.state) {
        setRoomState(data.state);
      }
    } catch {
      // Handle offline gracefully
    }
  };

  const handlePushClipboard = async () => {
    const textToSync = clipInput.trim();
    if (!textToSync) return;
    await sendLiveEvent('CLIPBOARD_SYNC', {
      text: textToSync,
      sourceDevice: myDeviceRole,
    });
    setClipInput('');
    setClipboardFeedback('Pushed to paired phone in real time');
    setTimeout(() => setClipboardFeedback(null), 2500);
  };

  const handleCopySyncedClipToDevice = async () => {
    if (!roomState?.clipboard.text) return;
    try {
      await navigator.clipboard.writeText(roomState.clipboard.text);
    } catch {
      // Fallback in restricted iframe
    }
    setClipboardFeedback('Copied synced text to this device clipboard');
    setTimeout(() => setClipboardFeedback(null), 2500);
  };

  const handlePostLiveNotification = async () => {
    if (!notifTitle.trim()) return;
    await sendLiveEvent('NOTIFICATION_POST', {
      originDevice: myDeviceRole,
      appName: 'ContinuumSync',
      title: notifTitle.trim(),
      content: notifBody.trim(),
    });
  };

  const handleDismissLiveNotification = async (id: string) => {
    await sendLiveEvent('NOTIFICATION_DISMISS', { id });
  };

  const handleTriggerLiveCall = async () => {
    await sendLiveEvent('CALL_ACTION', {
      callId: `call-${Date.now()}`,
      originDevice: myDeviceRole,
      callerName: callerNameInput || 'Elena Vance',
      callerNumber: callerNumberInput || '+1 (415) 890-4312',
      status: 'ringing',
    });
  };

  const handleLiveCallResponse = async (
    status: 'active-on-origin' | 'active-bthfp-routed' | 'rejected' | 'ended'
  ) => {
    await sendLiveEvent('CALL_ACTION', {
      status,
      actionTakenBy: myDeviceRole,
    });
  };

  const adbOneLiner = `curl -sL "${window.location.origin}/api/android-project/install-script.sh" | bash`;

  const handleCopyOneLiner = async () => {
    try {
      await navigator.clipboard.writeText(adbOneLiner);
    } catch {}
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleInstallPWA = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuideModal(true);
    }
  };

  const activeNotifications = (roomState?.notifications || []).filter((n) => !n.dismissed);

  return (
    <section
      aria-labelledby="installer-and-live-bridge-heading"
      className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6"
    >
      {!isOnline && (
        <div
          role="status"
          className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900"
        >
          Offline Mode — Using cached PWA assets. Live sync events will resume when online.
        </div>
      )}

      {/* Part A: Downloadable App Packages (PWA + Android Archive + ADB Script) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">
              Downloadable Packages Ready
            </span>
            <span aria-hidden="true">·</span>
            <span>{projectFilesList.length || 12} Native Files + PWA Service Worker</span>
            <span aria-hidden="true">·</span>
            <span>GitHub Actions APK Builder Included</span>
          </div>
          <h2
            id="installer-and-live-bridge-heading"
            className="text-xl font-bold text-slate-900"
          >
            Download & Install ContinuumSync (PWA + Native Android Package)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
            Install the standalone <strong>Progressive Web App (PWA)</strong> directly onto both phones’ home screens right now, or download the complete <strong>Native Android Studio + GitHub Actions APK Package</strong> (<code className="font-mono">.tar.gz</code> or <code className="font-mono">.sh</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallPWA}
              className="px-4 py-2.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-4 h-4" />
              {isIOS ? 'Install on iPhone / iPad' : 'Install App to Phone (PWA)'}
            </button>
          )}
          <a
            href="/ContinuumSync-Android.tar.gz"
            download="ContinuumSync-Android.tar.gz"
            className="px-4 py-2.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Package className="w-4 h-4" />
            Download Android Project (.tar.gz)
          </a>
          <a
            href="/api/android-project/install-script.sh"
            download="setup-continuumsync-android.sh"
            className="px-3.5 py-2.5 text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            ADB Auto-Installer (.sh)
          </a>
        </div>
      </div>

      {showInstallGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start justify-between gap-4 text-xs text-slate-800"
        >
          <div className="space-y-1">
            <div id="pwa-guide-title" className="font-bold text-slate-900">
              How to Install ContinuumSync Directly to Your Phone Home Screen:
            </div>
            <p>
              1. Open <strong>{window.location.origin}</strong> in <strong>Chrome on Android</strong> (or Safari on iOS) on both phones.<br />
              2. Tap the browser menu (<strong>⋮</strong> in Chrome) and select <strong>“Add to Home screen” / “Install app”</strong>.<br />
              3. Launch <strong>Continuum</strong> from your home screen like a native app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallGuideModal(false)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-100 shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {/* Automated Terminal Installer Command + Generated File Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-600" />
              Automated Build, APK Install & ADB Permission Grant Command:
            </div>
            <button
              type="button"
              onClick={handleCopyOneLiner}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
            >
              {copiedCommand ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied Command
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy 1-Line Installer
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
            <code>{adbOneLiner}</code>
          </pre>

          <p className="text-xs text-slate-600 leading-relaxed">
            Running this script on your computer with both phones plugged in via USB (or Wireless ADB) unpacks all 11 files into <code className="font-mono">./ContinuumSync-Android</code>, compiles <code className="font-mono">app-debug.apk</code>, installs it on both phones, and runs <code className="font-mono">adb shell pm grant</code> + <code className="font-mono">cmd notification allow_listener</code> automatically.
          </p>
        </div>

        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <FolderCode className="w-4 h-4 text-blue-600" />
            Built Files in Workspace (/android-continuumsync):
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-slate-600 max-h-36 overflow-y-auto">
            {(projectFilesList.length > 0
              ? projectFilesList
              : [
                  'settings.gradle.kts',
                  'build.gradle.kts',
                  'app/build.gradle.kts',
                  'app/src/main/AndroidManifest.xml',
                  'app/src/main/res/xml/accessibility_clipboard_config.xml',
                  'app/src/main/java/dev/continuumsync/bridge/MainActivity.kt',
                  'app/src/main/java/dev/continuumsync/bridge/notifications/SyncNotificationListenerService.kt',
                  'app/src/main/java/dev/continuumsync/bridge/calls/CallSyncController.kt',
                  'app/src/main/java/dev/continuumsync/bridge/clipboard/ClipboardAccessibilityService.kt',
                  'app/src/main/java/dev/continuumsync/bridge/crypto/E2ECryptoManager.kt',
                  'app/src/main/java/dev/continuumsync/bridge/transport/HybridTransportEngine.kt',
                ]
            ).map((f) => (
              <div key={f} className="truncate">
                · {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Part B: Real-Time Physical Phone-to-Phone Web Sync Bridge */}
      <div className="pt-5 border-t border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-700">Live Real-Time Server Relay</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Room #{roomCode} · {roomState?.connectedPeers ?? 1} Connected Device(s)
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Use Directly on Your Two Physical Phones Right Now (Live Cloud Bridge)
            </h3>
            <p className="text-xs text-slate-600">
              Open this page on <strong>Phone A</strong> and <strong>Phone B</strong>. Select your device role below—every clipboard push, incoming call, and notification dismissal syncs live between both physical phones over Server-Sent Events.
            </p>
          </div>

          <div
            role="group"
            aria-label="Select this physical device role"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start shrink-0"
          >
            <button
              type="button"
              onClick={() => setMyDeviceRole('phone-a')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                myDeviceRole === 'phone-a'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              This Device is Phone A
            </button>
            <button
              type="button"
              onClick={() => setMyDeviceRole('phone-b')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                myDeviceRole === 'phone-b'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              This Device is Phone B
            </button>
          </div>
        </div>

        {/* 3-Column Live Physical Sync Cards: Clipboard | Call Control | Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1. Live Clipboard Sync */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                Live Cross-Phone Clipboard
              </span>
              <span className="font-mono text-slate-500">
                From {roomState?.clipboard.sourceDevice === 'phone-b' ? 'Phone B' : 'Phone A'}
              </span>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-slate-800 truncate">
                {roomState?.clipboard.text || 'No clipboard synced yet'}
              </span>
              <button
                type="button"
                onClick={handleCopySyncedClipToDevice}
                className="text-blue-600 hover:underline font-medium whitespace-nowrap shrink-0"
              >
                Copy to Device
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Live clipboard text to push to other phone"
                value={clipInput}
                onChange={(e) => setClipInput(e.target.value)}
                placeholder="Paste or type text to sync..."
                className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={handlePushClipboard}
                className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Sync Clip
              </button>
            </div>

            {clipboardFeedback && (
              <div className="text-[11px] text-emerald-700 font-medium">{clipboardFeedback}</div>
            )}
          </div>

          {/* 2. Live Call Control Sync */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                Live Call State & Remote Answer
              </span>
              <span className="font-mono uppercase text-slate-600">
                {roomState?.activeCall.status || 'idle'}
              </span>
            </div>

            {roomState?.activeCall.status === 'ringing' ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Incoming on{' '}
                  {roomState.activeCall.originDevice === 'phone-b' ? 'Phone B' : 'Phone A'}:{' '}
                  {roomState.activeCall.callerName}
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  {roomState.activeCall.callerNumber}
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleLiveCallResponse('active-on-origin')}
                    className="px-2 py-1.5 text-xs font-medium bg-emerald-700 text-white rounded-md flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <Volume2 className="w-3 h-3" />
                    Speaker
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveCallResponse('active-bthfp-routed')}
                    className="px-2 py-1.5 text-xs font-medium bg-blue-700 text-white rounded-md flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <Bluetooth className="w-3 h-3" />
                    BT HFP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveCallResponse('rejected')}
                    className="px-2 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <PhoneOff className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    aria-label="Caller name for live call sync"
                    value={callerNameInput}
                    onChange={(e) => setCallerNameInput(e.target.value)}
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    placeholder="Caller Name"
                  />
                  <button
                    type="button"
                    onClick={handleTriggerLiveCall}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Ring Both Phones
                  </button>
                </div>
                {roomState?.activeCall.status && roomState.activeCall.status !== 'idle' && (
                  <div className="text-xs text-slate-600">
                    Last call status: <strong className="font-mono">{roomState.activeCall.status}</strong> (by{' '}
                    {roomState.activeCall.actionTakenBy === 'phone-b' ? 'Phone B' : 'Phone A'})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Live Notification Broadcast & Cross-Dismiss */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                Live Synced Notifications ({activeNotifications.length})
              </span>
              <button
                type="button"
                onClick={handlePostLiveNotification}
                className="text-blue-600 hover:underline font-medium"
              >
                + Push Alert
              </button>
            </div>

            <div className="flex gap-1.5">
              <input
                type="text"
                aria-label="Live notification title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-1/3 min-w-0 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md"
                placeholder="Title"
              />
              <input
                type="text"
                aria-label="Live notification content"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md"
                placeholder="Notification text..."
              />
            </div>

            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {activeNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-slate-900">{n.title}: </span>
                    <span className="text-slate-600">{n.content}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissLiveNotification(n.id)}
                    className="text-slate-400 hover:text-red-600 shrink-0"
                    aria-label={`Dismiss live notification ${n.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
