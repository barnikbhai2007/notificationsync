import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEncryptedFrame,
  postNotificationToSyncState,
  dismissSyncedNotification,
  replyToSyncedNotification,
  transitionCallState,
  syncClipboardContent,
  estimateResourceImpact,
  type SyncNotificationItem,
  type CallSessionState,
  type ClipboardState,
} from './syncEngine';

test('notification post, reply, and cross-device dismissal synchronize both devices', () => {
  const initial: SyncNotificationItem[] = [];
  const afterPost = postNotificationToSyncState(initial, {
    id: 'notif-1',
    sbnKey: '0|org.thoughtcrime.securesms|1042|null|10145',
    originDevice: 'phone-a',
    packageName: 'org.thoughtcrime.securesms',
    appName: 'Signal',
    appCategory: 'messaging',
    title: 'Marcus Chen',
    content: 'Flight landed at SFO Terminal 2. Are you near arrivals?',
    timestamp: '21:50:12',
  });

  assert.equal(afterPost.length, 1);
  assert.equal(afterPost[0].dismissedOnOrigin, false);
  assert.equal(afterPost[0].dismissedOnPeer, false);

  const afterReply = replyToSyncedNotification(afterPost, 'notif-1', 'Pulling up to curb now!');
  assert.equal(afterReply[0].repliedText, 'Pulling up to curb now!');

  const afterDismiss = dismissSyncedNotification(afterReply, 'notif-1');
  assert.equal(afterDismiss[0].dismissedOnOrigin, true);
  assert.equal(afterDismiss[0].dismissedOnPeer, true);
});

test('call synchronization transitions accurately reflect Android TelecomManager & Bluetooth HFP capabilities', () => {
  const idleState: CallSessionState = {
    callId: 'none',
    originDevice: 'phone-a',
    callerName: '',
    callerNumber: '',
    status: 'idle',
    androidApiUsed: 'None',
    audioRoutingNote: '',
    startedAt: '21:50:00',
  };

  const ringing = transitionCallState(idleState, 'incoming', 'phone-a', {
    name: 'Dr. Aria Patel',
    number: '+1 (650) 442-8810',
  });
  assert.equal(ringing.status, 'ringing');
  assert.equal(ringing.originDevice, 'phone-a');

  const answeredRemote = transitionCallState(ringing, 'answer-remote-telecom', 'phone-b');
  assert.equal(answeredRemote.status, 'active-on-origin');
  assert.equal(answeredRemote.actionTakenBy, 'phone-b');
  assert.ok(answeredRemote.androidApiUsed.includes('TelecomManager.acceptRingingCall()'));

  const ringingAgain = transitionCallState(answeredRemote, 'incoming', 'phone-b', {
    name: 'Courier Dispatch',
    number: '+1 (415) 202-9911',
  });
  const rejected = transitionCallState(ringingAgain, 'reject', 'phone-a');
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.actionTakenBy, 'phone-a');
});

test('clipboard synchronization enforces Android 10+ background restriction and works with foreground/accessibility hooks', () => {
  const initialClip: ClipboardState = {
    phoneA: 'Initial A',
    phoneB: 'Initial B',
    lastSyncedFrom: null,
    lastMethod: 'quick-tile',
    lastSyncedAt: '21:40:00',
    blockedWarning: null,
  };

  const blockedAttempt = syncClipboardContent(
    initialClip,
    'phone-a',
    'secret-token-blocked',
    'background-blocked'
  );
  assert.equal(blockedAttempt.phoneA, 'secret-token-blocked');
  assert.equal(blockedAttempt.phoneB, 'Initial B');
  assert.ok(blockedAttempt.blockedWarning?.includes('Android 10+'));

  const validSync = syncClipboardContent(
    blockedAttempt,
    'phone-a',
    'https://github.com/continuumsync/android-bridge',
    'accessibility-hook'
  );
  assert.equal(validSync.phoneA, 'https://github.com/continuumsync/android-bridge');
  assert.equal(validSync.phoneB, 'https://github.com/continuumsync/android-bridge');
  assert.equal(validSync.lastSyncedFrom, 'phone-a');
  assert.equal(validSync.blockedWarning, null);
});

test('encrypted frame generator and battery estimator produce deterministic valid metrics', () => {
  const frame = createEncryptedFrame({
    type: 'CLIPBOARD_PUSH',
    source: 'phone-a',
    transport: 'lan-tls',
    plaintextJson: '{"clip":"OTP 849201"}',
    summary: 'Clipboard push (21 bytes)',
  });

  assert.equal(frame.source, 'phone-a');
  assert.equal(frame.target, 'phone-b');
  assert.equal(frame.nonceHex.length, 24);
  assert.ok(frame.payloadBytes > 28);

  const fcmImpact = estimateResourceImpact({
    transport: 'lan-tls',
    notificationsPerHour: 15,
    clipboardSyncsPerHour: 10,
    keepAliveStrategy: 'fcm-high-priority',
  });
  const pollingImpact = estimateResourceImpact({
    transport: 'lan-tls',
    notificationsPerHour: 15,
    clipboardSyncsPerHour: 10,
    keepAliveStrategy: 'aggressive-polling',
  });

  assert.ok(fcmImpact.batteryPercentPerHour < pollingImpact.batteryPercentPerHour);
});
