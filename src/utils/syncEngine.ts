export type DeviceId = 'phone-a' | 'phone-b';

export type TransportChannel = 'lan-tls' | 'ble-gatt' | 'wan-fcm';

export type ClipboardCaptureMethod =
  | 'quick-tile'
  | 'accessibility-hook'
  | 'floating-overlay'
  | 'background-blocked';

export interface SyncNotificationItem {
  id: string;
  sbnKey: string;
  originDevice: DeviceId;
  packageName: string;
  appName: string;
  appCategory: 'messaging' | 'email' | 'finance' | 'security' | 'system';
  title: string;
  content: string;
  timestamp: string;
  dismissedOnOrigin: boolean;
  dismissedOnPeer: boolean;
  repliedText?: string;
}

export type CallLifecycleStatus =
  | 'idle'
  | 'ringing'
  | 'active-on-origin'
  | 'active-bthfp-routed'
  | 'rejected'
  | 'ended';

export interface CallSessionState {
  callId: string;
  originDevice: DeviceId;
  callerName: string;
  callerNumber: string;
  status: CallLifecycleStatus;
  actionTakenBy?: DeviceId;
  androidApiUsed: string;
  audioRoutingNote: string;
  startedAt: string;
}

export interface ClipboardState {
  phoneA: string;
  phoneB: string;
  lastSyncedFrom: DeviceId | null;
  lastMethod: ClipboardCaptureMethod;
  lastSyncedAt: string;
  blockedWarning: string | null;
}

export interface EncryptedFrame {
  frameId: string;
  type: 'NOTIFICATION_POST' | 'NOTIFICATION_CANCEL' | 'NOTIFICATION_REPLY' | 'CALL_STATE' | 'CALL_COMMAND' | 'CLIPBOARD_PUSH';
  source: DeviceId;
  target: DeviceId;
  transport: TransportChannel;
  nonceHex: string;
  ciphertextPreview: string;
  authTagHex: string;
  payloadBytes: number;
  latencyMs: number;
  timestamp: string;
  summary: string;
}

export interface ResourceImpactEstimate {
  batteryPercentPerHour: number;
  dailyDataMegabytes: number;
  avgLatencyMs: number;
  wakeLocksPerHour: number;
}

function deterministicHex(seed: string, length: number): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let out = '';
  let current = hash >>> 0;
  while (out.length < length) {
    current = (Math.imul(current, 1664525) + 1013904223) >>> 0;
    out += current.toString(16).padStart(8, '0');
  }
  return out.slice(0, length).toUpperCase();
}

export function createEncryptedFrame(params: {
  type: EncryptedFrame['type'];
  source: DeviceId;
  transport: TransportChannel;
  plaintextJson: string;
  summary: string;
  timestamp?: string;
}): EncryptedFrame {
  const target: DeviceId = params.source === 'phone-a' ? 'phone-b' : 'phone-a';
  const seed = `${params.type}:${params.source}:${params.plaintextJson}`;
  const nonceHex = deterministicHex(`nonce:${seed}`, 24);
  const cipherHex = deterministicHex(`cipher:${seed}`, 32);
  const authTagHex = deterministicHex(`tag:${seed}`, 32);
  const payloadBytes = new TextEncoder().encode(params.plaintextJson).length + 28; // +12B nonce +16B Poly1305 tag

  const baseLatency =
    params.transport === 'lan-tls'
      ? 9
      : params.transport === 'ble-gatt'
      ? 38
      : 145;

  return {
    frameId: `pkt-${deterministicHex(seed + (params.timestamp || ''), 8).toLowerCase()}`,
    type: params.type,
    source: params.source,
    target,
    transport: params.transport,
    nonceHex,
    ciphertextPreview: `${cipherHex.slice(0, 16)}…${cipherHex.slice(-8)}`,
    authTagHex: authTagHex.slice(0, 16),
    payloadBytes,
    latencyMs: baseLatency,
    timestamp: params.timestamp || '21:52:14',
    summary: params.summary,
  };
}

export function postNotificationToSyncState(
  list: SyncNotificationItem[],
  item: Omit<SyncNotificationItem, 'dismissedOnOrigin' | 'dismissedOnPeer'>
): SyncNotificationItem[] {
  const created: SyncNotificationItem = {
    ...item,
    dismissedOnOrigin: false,
    dismissedOnPeer: false,
  };
  return [created, ...list];
}

export function dismissSyncedNotification(
  list: SyncNotificationItem[],
  notificationId: string
): SyncNotificationItem[] {
  return list.map((item) =>
    item.id === notificationId
      ? {
          ...item,
          dismissedOnOrigin: true,
          dismissedOnPeer: true,
        }
      : item
  );
}

export function replyToSyncedNotification(
  list: SyncNotificationItem[],
  notificationId: string,
  replyText: string
): SyncNotificationItem[] {
  const trimmed = replyText.trim();
  if (!trimmed) return list;
  return list.map((item) =>
    item.id === notificationId
      ? {
          ...item,
          repliedText: trimmed,
        }
      : item
  );
}

export function transitionCallState(
  current: CallSessionState,
  action: 'incoming' | 'answer-remote-telecom' | 'answer-bthfp' | 'reject' | 'end',
  actorDevice: DeviceId,
  callerInfo?: { name: string; number: string; timestamp?: string }
): CallSessionState {
  const now = callerInfo?.timestamp || current.startedAt || '21:52:20';

  if (action === 'incoming') {
    return {
      callId: `call-${deterministicHex(callerInfo?.number || '555', 6).toLowerCase()}`,
      originDevice: actorDevice,
      callerName: callerInfo?.name || 'Elena Vance',
      callerNumber: callerInfo?.number || '+1 (415) 890-4312',
      status: 'ringing',
      actionTakenBy: undefined,
      androidApiUsed: 'TelephonyCallback.CallStateListener + InCallService',
      audioRoutingNote:
        'Incoming call state and Caller ID broadcast to paired peer over encrypted socket.',
      startedAt: now,
    };
  }

  if (current.status !== 'ringing' && action !== 'end') {
    return current;
  }

  if (action === 'answer-remote-telecom') {
    return {
      ...current,
      status: 'active-on-origin',
      actionTakenBy: actorDevice,
      androidApiUsed: 'TelecomManager.acceptRingingCall() + Speakerphone Auto-Route',
      audioRoutingNote:
        'Call answered remotely via TelecomManager on Origin Phone. Standard Android does not expose cellular uplink audio streams to third-party apps; speakerphone is automatically enabled on Origin Phone.',
    };
  }

  if (action === 'answer-bthfp') {
    return {
      ...current,
      status: 'active-bthfp-routed',
      actionTakenBy: actorDevice,
      androidApiUsed: 'BluetoothHeadsetHandsfree (HFP Sink Profile) + TelecomManager',
      audioRoutingNote:
        'Call answered and live voice audio bridged via Bluetooth Hands-Free Profile (HFP AG/HF role) between both phones.',
    };
  }

  if (action === 'reject') {
    return {
      ...current,
      status: 'rejected',
      actionTakenBy: actorDevice,
      androidApiUsed: 'TelecomManager.endCall() (Requires ANSWER_PHONE_CALLS)',
      audioRoutingNote:
        'Call rejected remotely from paired phone; TelecomManager.endCall() invoked on ringing phone.',
    };
  }

  return {
    ...current,
    status: 'ended',
    actionTakenBy: actorDevice,
    androidApiUsed: 'TelecomManager.endCall()',
    audioRoutingNote: 'Call session terminated and synchronized across both devices.',
  };
}

export function syncClipboardContent(
  current: ClipboardState,
  source: DeviceId,
  newText: string,
  method: ClipboardCaptureMethod,
  timestamp = '21:52:30'
): ClipboardState {
  if (!newText.trim()) {
    return current;
  }

  if (method === 'background-blocked') {
    return {
      ...current,
      phoneA: source === 'phone-a' ? newText : current.phoneA,
      phoneB: source === 'phone-b' ? newText : current.phoneB,
      blockedWarning:
        'Android 10+ (API 29) blocks background apps from reading ClipboardManager unless the app has input focus (IME) or is triggered via an AccessibilityEvent, Quick Settings Tile, or Foreground Overlay.',
    };
  }

  return {
    phoneA: newText,
    phoneB: newText,
    lastSyncedFrom: source,
    lastMethod: method,
    lastSyncedAt: timestamp,
    blockedWarning: null,
  };
}

export function estimateResourceImpact(params: {
  transport: TransportChannel;
  notificationsPerHour: number;
  clipboardSyncsPerHour: number;
  keepAliveStrategy: 'fcm-high-priority' | 'persistent-lan-socket' | 'aggressive-polling';
}): ResourceImpactEstimate {
  const baseBattery =
    params.keepAliveStrategy === 'fcm-high-priority'
      ? 0.35
      : params.keepAliveStrategy === 'persistent-lan-socket'
      ? 0.75
      : 3.4;

  const transportMultiplier =
    params.transport === 'lan-tls'
      ? 1.0
      : params.transport === 'ble-gatt'
      ? 0.85
      : 1.25;

  const eventLoad =
    params.notificationsPerHour * 0.008 + params.clipboardSyncsPerHour * 0.005;

  const batteryPercentPerHour = Number(
    ((baseBattery + eventLoad) * transportMultiplier).toFixed(2)
  );

  const avgPacketKB = 1.8;
  const totalEventsPerDay =
    (params.notificationsPerHour + params.clipboardSyncsPerHour) * 16;
  const keepAliveKBPerDay =
    params.keepAliveStrategy === 'aggressive-polling' ? 8500 : 420;

  const dailyDataMegabytes = Number(
    ((totalEventsPerDay * avgPacketKB + keepAliveKBPerDay) / 1024).toFixed(2)
  );

  const avgLatencyMs =
    params.transport === 'lan-tls'
      ? 11
      : params.transport === 'ble-gatt'
      ? 42
      : 165;

  const wakeLocksPerHour =
    params.keepAliveStrategy === 'fcm-high-priority'
      ? Math.ceil((params.notificationsPerHour + params.clipboardSyncsPerHour) * 0.6)
      : params.keepAliveStrategy === 'persistent-lan-socket'
      ? 12
      : 120;

  return {
    batteryPercentPerHour,
    dailyDataMegabytes,
    avgLatencyMs,
    wakeLocksPerHour,
  };
}
