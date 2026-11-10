import React, { useState } from 'react';
import {
  Bell,
  PhoneCall,
  PhoneOff,
  Clipboard,
  Send,
  Trash2,
  ShieldCheck,
  Wifi,
  Bluetooth,
  Globe,
  Volume2,
  Check,
  AlertTriangle,
  CornerDownRight,
} from 'lucide-react';
import {
  type DeviceId,
  type TransportChannel,
  type ClipboardCaptureMethod,
  type SyncNotificationItem,
  type CallSessionState,
  type ClipboardState,
  type EncryptedFrame,
  createEncryptedFrame,
  postNotificationToSyncState,
  dismissSyncedNotification,
  replyToSyncedNotification,
  transitionCallState,
  syncClipboardContent,
  estimateResourceImpact,
} from '../utils/syncEngine';

interface DualPhoneSimulatorProps {
  onOpenPairingModal: () => void;
  pairedSasCode: string;
}

const PRESET_NOTIFICATIONS: Array<{
  appName: string;
  packageName: string;
  appCategory: SyncNotificationItem['appCategory'];
  title: string;
  content: string;
}> = [
  {
    appName: 'Signal',
    packageName: 'org.thoughtcrime.securesms',
    appCategory: 'messaging',
    title: 'Maya Lin',
    content: 'Gate changed to B14. Grabbing espresso—want a flat white?',
  },
  {
    appName: 'Proton Mail',
    packageName: 'ch.protonmail.android',
    appCategory: 'email',
    title: 'Hardware Security Team',
    content: 'Production signing key rotation scheduled for 18:00 UTC.',
  },
  {
    appName: 'Revolut',
    packageName: 'com.revolut.revolut',
    appCategory: 'finance',
    title: 'Card Payment Authorized',
    content: '€42.80 at Blue Bottle Coffee Tokyo. Tap to view receipt.',
  },
];

const PRESET_CALLERS = [
  { name: 'Elena Vance (Lead Architect)', number: '+1 (415) 890-4312' },
  { name: 'Liam O’Connor (Courier)', number: '+1 (650) 319-7740' },
];

export const DualPhoneSimulator: React.FC<DualPhoneSimulatorProps> = ({
  onOpenPairingModal,
  pairedSasCode,
}) => {
  const [transport, setTransport] = useState<TransportChannel>('lan-tls');
  const [keepAliveStrategy, setKeepAliveStrategy] = useState<
    'fcm-high-priority' | 'persistent-lan-socket' | 'aggressive-polling'
  >('fcm-high-priority');

  const [notifications, setNotifications] = useState<SyncNotificationItem[]>([
    {
      id: 'notif-seed-1',
      sbnKey: '0|org.thoughtcrime.securesms|101|null|10145',
      originDevice: 'phone-a',
      packageName: 'org.thoughtcrime.securesms',
      appName: 'Signal',
      appCategory: 'messaging',
      title: 'Marcus Chen',
      content: 'Just landed at Terminal 2. Are you near the pickup zone?',
      timestamp: '21:48:10',
      dismissedOnOrigin: false,
      dismissedOnPeer: false,
    },
    {
      id: 'notif-seed-2',
      sbnKey: '0|com.google.android.gm|204|null|10089',
      originDevice: 'phone-b',
      packageName: 'com.google.android.gm',
      appName: 'Work Mail',
      appCategory: 'email',
      title: 'Q4 Infrastructure Audit',
      content: 'Signed off on the ChaCha20-Poly1305 key exchange spec.',
      timestamp: '21:50:04',
      dismissedOnOrigin: false,
      dismissedOnPeer: false,
    },
  ]);

  const [callState, setCallState] = useState<CallSessionState>({
    callId: 'call-8f92a1',
    originDevice: 'phone-a',
    callerName: 'Elena Vance (Lead Architect)',
    callerNumber: '+1 (415) 890-4312',
    status: 'idle',
    androidApiUsed: 'TelephonyCallback.CallStateListener (Idle)',
    audioRoutingNote: 'Trigger an incoming call on Phone A or Phone B to test synchronized call control.',
    startedAt: '21:51:00',
  });

  const [clipboardState, setClipboardState] = useState<ClipboardState>({
    phoneA: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIContinuumSyncKey2026',
    phoneB: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIContinuumSyncKey2026',
    lastSyncedFrom: 'phone-a',
    lastMethod: 'accessibility-hook',
    lastSyncedAt: '21:51:45',
    blockedWarning: null,
  });

  const [clipboardMethod, setClipboardMethod] =
    useState<ClipboardCaptureMethod>('accessibility-hook');
  const [phoneAClipDraft, setPhoneAClipDraft] = useState(
    'https://continuumsync.dev/pair?token=9941-X25519'
  );
  const [phoneBClipDraft, setPhoneBClipDraft] = useState(
    'OTP Verification Code: 739-204 (Valid for 5m)'
  );
  const [pastedPreviewA, setPastedPreviewA] = useState<string>('');
  const [pastedPreviewB, setPastedPreviewB] = useState<string>('');

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [presetIndex, setPresetIndex] = useState(0);

  const [frames, setFrames] = useState<EncryptedFrame[]>([
    createEncryptedFrame({
      type: 'CLIPBOARD_PUSH',
      source: 'phone-a',
      transport: 'lan-tls',
      plaintextJson: '{"clip":"ssh-ed25519 AAAAC3Nza..."}',
      summary: 'Synced SSH public key from Phone A → Phone B',
      timestamp: '21:51:45',
    }),
    createEncryptedFrame({
      type: 'NOTIFICATION_POST',
      source: 'phone-a',
      transport: 'lan-tls',
      plaintextJson: '{"app":"Signal","title":"Marcus Chen"}',
      summary: 'Mirrored Signal notification (0|org.thoughtcrime...)',
      timestamp: '21:48:10',
    }),
  ]);

  const appendFrame = (
    type: EncryptedFrame['type'],
    source: DeviceId,
    plaintextJson: string,
    summary: string
  ) => {
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8);
    const frame = createEncryptedFrame({
      type,
      source,
      transport,
      plaintextJson,
      summary,
      timestamp: ts,
    });
    setFrames((prev) => [frame, ...prev.slice(0, 7)]);
  };

  const handleTriggerNotification = (origin: DeviceId) => {
    const preset = PRESET_NOTIFICATIONS[presetIndex % PRESET_NOTIFICATIONS.length];
    setPresetIndex((i) => i + 1);
    const now = new Date().toTimeString().slice(0, 8);
    const id = `notif-${Date.now()}`;
    const sbnKey = `0|${preset.packageName}|${100 + presetIndex}|null|10145`;

    setNotifications((prev) =>
      postNotificationToSyncState(prev, {
        id,
        sbnKey,
        originDevice: origin,
        packageName: preset.packageName,
        appName: preset.appName,
        appCategory: preset.appCategory,
        title: preset.title,
        content: preset.content,
        timestamp: now,
      })
    );

    appendFrame(
      'NOTIFICATION_POST',
      origin,
      JSON.stringify({ sbnKey, app: preset.appName, title: preset.title }),
      `Mirrored ${preset.appName} alert ("${preset.title}") from ${
        origin === 'phone-a' ? 'Phone A' : 'Phone B'
      }`
    );
  };

  const handleDismissNotification = (notif: SyncNotificationItem, actor: DeviceId) => {
    setNotifications((prev) => dismissSyncedNotification(prev, notif.id));
    appendFrame(
      'NOTIFICATION_CANCEL',
      actor,
      JSON.stringify({ action: 'cancelNotification', sbnKey: notif.sbnKey }),
      `Dismissed ${notif.appName} notification on both phones via cancelNotification()`
    );
  };

  const handleReplyNotification = (notif: SyncNotificationItem, actor: DeviceId) => {
    const text = replyDrafts[notif.id] || 'Got it, on my way!';
    setNotifications((prev) => replyToSyncedNotification(prev, notif.id, text));
    setReplyDrafts((prev) => ({ ...prev, [notif.id]: '' }));
    appendFrame(
      'NOTIFICATION_REPLY',
      actor,
      JSON.stringify({ sbnKey: notif.sbnKey, RemoteInput: text }),
      `Executed inline RemoteInput reply ("${text}") on ${
        notif.originDevice === 'phone-a' ? 'Phone A' : 'Phone B'
      }`
    );
  };

  const handleIncomingCall = (origin: DeviceId) => {
    const caller = origin === 'phone-a' ? PRESET_CALLERS[0] : PRESET_CALLERS[1];
    const now = new Date().toTimeString().slice(0, 8);
    const next = transitionCallState(callState, 'incoming', origin, {
      name: caller.name,
      number: caller.number,
      timestamp: now,
    });
    setCallState(next);
    appendFrame(
      'CALL_STATE',
      origin,
      JSON.stringify({ state: 'RINGING', caller: caller.number }),
      `Incoming call on ${origin === 'phone-a' ? 'Phone A' : 'Phone B'} (${caller.name})`
    );
  };

  const handleCallControl = (
    action: 'answer-remote-telecom' | 'answer-bthfp' | 'reject' | 'end',
    actor: DeviceId
  ) => {
    const next = transitionCallState(callState, action, actor);
    setCallState(next);
    appendFrame(
      'CALL_COMMAND',
      actor,
      JSON.stringify({ command: action, callId: callState.callId }),
      `Call ${action} invoked by ${actor === 'phone-a' ? 'Phone A' : 'Phone B'}`
    );
  };

  const handleCopyFromPhone = (source: DeviceId) => {
    const text = source === 'phone-a' ? phoneAClipDraft : phoneBClipDraft;
    const now = new Date().toTimeString().slice(0, 8);
    const next = syncClipboardContent(clipboardState, source, text, clipboardMethod, now);
    setClipboardState(next);

    if (clipboardMethod !== 'background-blocked' && text.trim()) {
      appendFrame(
        'CLIPBOARD_PUSH',
        source,
        JSON.stringify({ clip: text.slice(0, 32), method: clipboardMethod }),
        `Synced clipboard (${text.length} chars) via ${clipboardMethod}`
      );
    }
  };

  const activeNotifications = notifications.filter(
    (n) => !n.dismissedOnOrigin && !n.dismissedOnPeer
  );

  const resourceImpact = estimateResourceImpact({
    transport,
    notificationsPerHour: 18,
    clipboardSyncsPerHour: 12,
    keepAliveStrategy,
  });

  return (
    <section aria-labelledby="simulator-heading" className="space-y-6">
      {/* Top Control Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Real-Time Hardware & OS Sandbox</span>
            <span aria-hidden="true">·</span>
            <span>X25519 + ChaCha20-Poly1305 AEAD</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">SAS #{pairedSasCode}</span>
          </div>
          <h2 id="simulator-heading" className="text-xl font-bold text-slate-900">
            Dual-Phone Live Synchronization Studio
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Trigger notifications, incoming calls, and clipboard copies on either phone below to inspect exact Android OS behavior and cross-device dismissal.
          </p>
        </div>

        {/* Transport & Clipboard Mode Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Active wireless transport channel"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              onClick={() => setTransport('lan-tls')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                transport === 'lan-tls'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              Wi-Fi LAN (mDNS TLS 1.3)
            </button>
            <button
              type="button"
              onClick={() => setTransport('ble-gatt')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                transport === 'ble-gatt'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
              BLE + RFCOMM
            </button>
            <button
              type="button"
              onClick={() => setTransport('wan-fcm')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                transport === 'wan-fcm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Internet (FCM E2EE Push)
            </button>
          </div>
        </div>
      </div>

      {/* Shared Call Banner (when ringing, active, or recently rejected) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">2. Call Synchronisation Engine</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{callState.androidApiUsed}</span>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl">{callState.audioRoutingNote}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleIncomingCall('phone-a')}
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Simulate Call to Phone A
            </button>
            <button
              type="button"
              onClick={() => handleIncomingCall('phone-b')}
              className="px-3.5 py-2 text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Simulate Call to Phone B
            </button>
            {callState.status !== 'idle' && (
              <button
                type="button"
                onClick={() => handleCallControl('end', 'phone-a')}
                className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Reset / End Call
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 3-Column Grid: Phone A | Live E2E Bridge & Telemetry | Phone B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PHONE A (Pixel 9 Pro) */}
        <div
          data-testid="phone-a-panel"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden"
        >
          {/* Phone Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-mono">
                PHONE A · PRIMARY SIM · ANDROID 15
              </div>
              <h3 className="text-base font-bold tracking-tight mt-0.5">
                Pixel 9 Pro (192.168.1.42)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleTriggerNotification('phone-a')}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              Receive Alert on A
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Call Status Card on Phone A */}
            {callState.status !== 'idle' && (
              <div
                data-testid="phone-a-call-card"
                className={`p-4 rounded-xl border ${
                  callState.status === 'ringing'
                    ? 'bg-amber-50/70 border-amber-300'
                    : callState.status === 'rejected'
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-emerald-50/70 border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold text-slate-900">
                    {callState.originDevice === 'phone-a'
                      ? 'Cellular Incoming Call (SIM 1)'
                      : 'Mirrored Call Alert from Phone B'}
                  </span>
                  <span className="font-mono uppercase">{callState.status}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{callState.callerName}</div>
                <div className="text-xs font-mono text-slate-600">{callState.callerNumber}</div>

                {callState.status === 'ringing' && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCallControl('answer-remote-telecom', 'phone-a')}
                      className="px-2.5 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      Speaker
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallControl('answer-bthfp', 'phone-a')}
                      className="px-2.5 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Bluetooth className="w-3.5 h-3.5 shrink-0" />
                      BT HFP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallControl('reject', 'phone-a')}
                      className="px-2.5 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <PhoneOff className="w-3.5 h-3.5 shrink-0" />
                      Reject
                    </button>
                  </div>
                )}

                {callState.status !== 'ringing' && (
                  <div className="mt-2 text-xs text-slate-700">
                    Action synced via{' '}
                    <span className="font-mono font-semibold">
                      {callState.actionTakenBy === 'phone-a' ? 'Phone A' : 'Phone B'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notification Shade on Phone A */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Notification Shade ({activeNotifications.length})
                </span>
                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                  NotificationListenerService
                </span>
              </div>

              {activeNotifications.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">
                    All notifications dismissed across both phones.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTriggerNotification('phone-a')}
                    className="mt-2 px-3 py-1.5 text-xs font-medium text-blue-700 hover:underline"
                  >
                    Send test notification to Phone A
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeNotifications.map((item) => (
                    <div
                      key={`a-${item.id}`}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0 truncate">
                          <span className="font-semibold text-slate-900 whitespace-nowrap">
                            {item.appName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="whitespace-nowrap">
                            {item.originDevice === 'phone-a' ? 'Local' : 'From Phone B'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono whitespace-nowrap">{item.timestamp}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Dismiss ${item.title} on Phone A`}
                          onClick={() => handleDismissNotification(item, 'phone-a')}
                          className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Dismiss
                        </button>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      {item.repliedText && (
                        <div className="text-xs text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                          <span>Synced Reply: “{item.repliedText}”</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clipboard Box on Phone A */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="phone-a-clip-input"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                  Phone A Clipboard Buffer
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  Synced {clipboardState.lastSyncedAt}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  id="phone-a-clip-input"
                  type="text"
                  value={phoneAClipDraft}
                  onChange={(e) => setPhoneAClipDraft(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Type text to copy on Phone A..."
                />
                <button
                  type="button"
                  onClick={() => handleCopyFromPhone('phone-a')}
                  className="px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Copy on A
                </button>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
                <div className="truncate font-mono text-slate-700 pr-2">
                  Current Clip: {clipboardState.phoneA}
                </div>
                <button
                  type="button"
                  onClick={() => setPastedPreviewA(clipboardState.phoneA)}
                  className="text-blue-600 hover:underline font-medium whitespace-nowrap shrink-0"
                >
                  Paste on A
                </button>
              </div>
              {pastedPreviewA && (
                <div className="text-xs text-emerald-700 font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Pasted into Phone A note: {pastedPreviewA}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Live E2EE Bridge, Clipboard OS Restriction Selector & Battery Telemetry */}
        <div className="lg:col-span-4 space-y-5">
          {/* Android 10+ Clipboard Method Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                3. Outgoing Clipboard Capture Mode (Android 10–15)
              </h3>
              <span className="text-xs font-mono text-slate-500">No Root</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Android 10+ blocks silent background <code className="font-mono">getPrimaryClip()</code> calls. Select how our custom app captures outgoing copies:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setClipboardMethod('accessibility-hook')}
                className={`p-2.5 text-left rounded-lg border transition-colors ${
                  clipboardMethod === 'accessibility-hook'
                    ? 'bg-blue-50/60 border-blue-600 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-semibold">
                  AccessibilityService + Transient 1px Focus Overlay (Recommended)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Detects copy selection actions automatically without root or ADB.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClipboardMethod('quick-tile')}
                className={`p-2.5 text-left rounded-lg border transition-colors ${
                  clipboardMethod === 'quick-tile'
                    ? 'bg-blue-50/60 border-blue-600 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-semibold">
                  Quick Settings Tile / Foreground Floating Pill
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Zero Accessibility permission needed; 1-tap tile briefly gains window focus to sync.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClipboardMethod('background-blocked')}
                className={`p-2.5 text-left rounded-lg border transition-colors ${
                  clipboardMethod === 'background-blocked'
                    ? 'bg-amber-50 border-amber-500 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-semibold">
                  Naive Background Listener (Test Android 10+ OS Block)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Demonstrates why standard apps fail to read background clipboards on Android 10+.
                </div>
              </button>
            </div>

            {clipboardState.blockedWarning && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{clipboardState.blockedWarning}</span>
              </div>
            )}
          </div>

          {/* Live Encrypted Wire Inspector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Encrypted AEAD Packet Stream
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenPairingModal}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Inspect ECDH Keys
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {frames.map((frame) => (
                <div
                  key={frame.frameId}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                    <span>
                      {frame.type} · {frame.source === 'phone-a' ? 'A→B' : 'B→A'}
                    </span>
                    <span className="tabular-nums">
                      {frame.payloadBytes}B · {frame.latencyMs}ms
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">{frame.summary}</div>
                  <div className="font-mono text-[11px] text-slate-500 truncate">
                    Nonce: {frame.nonceHex.slice(0, 12)} · Cipher: {frame.ciphertextPreview}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Battery & Bandwidth Calculator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Battery & Data Impact Estimator
              </h3>
              <select
                aria-label="Select Wakeup Strategy"
                value={keepAliveStrategy}
                onChange={(e) => setKeepAliveStrategy(e.target.value as any)}
                className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-slate-800"
              >
                <option value="fcm-high-priority">FCM Push + Ephemeral Socket</option>
                <option value="persistent-lan-socket">Persistent mDNS LAN Socket</option>
                <option value="aggressive-polling">Naive 5s WakeLock Polling</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">Battery Drain</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {resourceImpact.batteryPercentPerHour}%/hr
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">Daily Data</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {resourceImpact.dailyDataMegabytes} MB
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">Sync Latency</div>
                <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  ~{resourceImpact.avgLatencyMs} ms
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHONE B (Galaxy S25 Ultra) */}
        <div
          data-testid="phone-b-panel"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden"
        >
          {/* Phone Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-mono">
                PHONE B · COMPANION PEER · ONE UI 7
              </div>
              <h3 className="text-base font-bold tracking-tight mt-0.5">
                Galaxy S25 Ultra (192.168.1.48)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleTriggerNotification('phone-b')}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              Receive Alert on B
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Synchronized Call Card on Phone B */}
            {callState.status !== 'idle' && (
              <div
                data-testid="phone-b-call-card"
                className={`p-4 rounded-xl border ${
                  callState.status === 'ringing'
                    ? 'bg-amber-50/70 border-amber-300'
                    : callState.status === 'rejected'
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-emerald-50/70 border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold text-slate-900">
                    {callState.originDevice === 'phone-b'
                      ? 'Cellular Incoming Call (SIM 1)'
                      : 'Synced Incoming Call from Phone A'}
                  </span>
                  <span className="font-mono uppercase">{callState.status}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{callState.callerName}</div>
                <div className="text-xs font-mono text-slate-600">{callState.callerNumber}</div>

                {callState.status === 'ringing' && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCallControl('answer-remote-telecom', 'phone-b')}
                      className="px-2.5 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      Answer (A)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallControl('answer-bthfp', 'phone-b')}
                      className="px-2.5 py-2 text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Bluetooth className="w-3.5 h-3.5 shrink-0" />
                      BT HFP
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallControl('reject', 'phone-b')}
                      className="px-2.5 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <PhoneOff className="w-3.5 h-3.5 shrink-0" />
                      Reject
                    </button>
                  </div>
                )}

                {callState.status !== 'ringing' && (
                  <div className="mt-2 text-xs text-slate-700">
                    State synchronized · Controlled by{' '}
                    <span className="font-mono font-semibold">
                      {callState.actionTakenBy === 'phone-a' ? 'Phone A' : 'Phone B'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Synchronized Notifications on Phone B */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Synced Notifications ({activeNotifications.length})
                </span>
                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                  Cross-Dismiss Active
                </span>
              </div>

              {activeNotifications.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">
                    No active notifications. Trigger an alert on Phone A or B to watch instant mirroring.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeNotifications.map((item) => (
                    <div
                      key={`b-${item.id}`}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 min-w-0 truncate">
                          <span className="font-semibold text-slate-900 whitespace-nowrap">
                            {item.appName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="whitespace-nowrap">
                            {item.originDevice === 'phone-b' ? 'Local' : 'From Phone A'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono whitespace-nowrap">{item.timestamp}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Dismiss ${item.title} on Both Phones`}
                          onClick={() => handleDismissNotification(item, 'phone-b')}
                          className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Dismiss Both
                        </button>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {item.content}
                        </p>
                      </div>

                      {item.repliedText ? (
                        <div className="text-xs text-blue-700 bg-blue-50/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                          <span>RemoteInput Sent: “{item.repliedText}”</span>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            aria-label={`Reply to ${item.title} from Phone B`}
                            value={replyDrafts[item.id] || ''}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Inline reply via RemoteInput..."
                            className="flex-1 min-w-0 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleReplyNotification(item, 'phone-b')}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <Send className="w-3 h-3" />
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clipboard Box on Phone B */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="phone-b-clip-input"
                  className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                  Phone B Clipboard Buffer
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  setPrimaryClip() Ready
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  id="phone-b-clip-input"
                  type="text"
                  value={phoneBClipDraft}
                  onChange={(e) => setPhoneBClipDraft(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Type text to copy on Phone B..."
                />
                <button
                  type="button"
                  onClick={() => handleCopyFromPhone('phone-b')}
                  className="px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Copy on B
                </button>
              </div>

              <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
                <div className="truncate font-mono text-slate-700 pr-2">
                  Current Clip: {clipboardState.phoneB}
                </div>
                <button
                  type="button"
                  onClick={() => setPastedPreviewB(clipboardState.phoneB)}
                  className="text-blue-600 hover:underline font-medium whitespace-nowrap shrink-0"
                >
                  Paste on B
                </button>
              </div>
              {pastedPreviewB && (
                <div className="text-xs text-emerald-700 font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Pasted into Phone B app: {pastedPreviewB}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
