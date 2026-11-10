export interface ExistingAppAudit {
  id: string;
  name: string;
  developerType: string;
  primaryTopology: string;
  notificationSync: {
    status: 'Full' | 'Partial' | 'PC-Only';
    detail: string;
  };
  callSync: {
    status: 'Alert + Reject Only' | 'Answer + Reject (No Voice Audio)' | 'PC-Only' | 'None';
    detail: string;
  };
  clipboardSync: {
    status: 'Manual / Tile (Android 10+)' | 'Auto via Accessibility / Logs' | 'PC-Only';
    detail: string;
  };
  encryptionModel: string;
  rootRequired: boolean;
  verdict: string;
  gapSummary: string;
}

export interface AndroidPermissionAudit {
  id: string;
  featureArea: 'Notifications' | 'Calls' | 'Clipboard' | 'Background & Pairing';
  apiOrPermission: string;
  minSdk: string;
  protectionLevel: 'Special App Access' | 'Runtime Dangerous' | 'Role / Companion' | 'System / OEM';
  whatAndroidPermits: string;
  hardAndroidLimitation: string;
  practicalNonRootSolution: string;
}

export const EXISTING_APPS_AUDIT: ExistingAppAudit[] = [
  {
    id: 'kde-connect',
    name: 'KDE Connect (Android-to-Android)',
    developerType: 'Open Source (GPLv2+)',
    primaryTopology: 'Local Wi-Fi (UDP 1716 discovery + TLS 1.2/1.3 TCP socket)',
    notificationSync: {
      status: 'Full',
      detail:
        'Can mirror notifications between two Android phones on the same Wi-Fi LAN, including inline replies and cross-device dismissal via NotificationListenerService.',
    },
    callSync: {
      status: 'Alert + Reject Only',
      detail:
        'Sends Telephony packet on incoming call to pause media or show caller ID, but lacks a dedicated dual-phone incoming call UI with remote Answer via TelecomManager.',
    },
    clipboardSync: {
      status: 'Manual / Tile (Android 10+)',
      detail:
        'Auto-push works when receiving, but sending from Android 10+ requires tapping the KDE Connect "Send Clipboard" foreground notification action or Quick Settings tile.',
    },
    encryptionModel: 'End-to-End TLS 1.3 with self-signed X.509 certificates pinned on first pairing',
    rootRequired: false,
    verdict: 'Closest Open-Source Baseline (Local Wi-Fi Only)',
    gapSummary:
      'Fails when phones are on cellular data (no WAN relay without tailscale/VPN), lacks remote Call Answering UI, and cannot auto-read background clipboard without an Accessibility helper.',
  },
  {
    id: 'join-joaoapps',
    name: 'Join by joaoapps',
    developerType: 'Commercial Indie',
    primaryTopology: 'Google Cloud / FCM + Google Drive Relay',
    notificationSync: {
      status: 'Full',
      detail:
        'Syncs notifications, icons, action buttons, and dismissals across Android phones anywhere over the internet via FCM high-priority messages.',
    },
    callSync: {
      status: 'Alert + Reject Only',
      detail:
        'Can mirror call notifications and end calls when paired with Tasker, but does not offer a synchronized live Call State UI out of the box.',
    },
    clipboardSync: {
      status: 'Auto via Accessibility / Logs',
      detail:
        'Uses an optional AccessibilityService overlay monitor or WRITE_SECURE_SETTINGS (ADB) workaround to detect copy events on Android 10+.',
    },
    encryptionModel: 'Optional user-password AES-256 payload encryption over FCM',
    rootRequired: false,
    verdict: 'Best Cloud-First Power-User Tool',
    gapSummary:
      'Relies on Google Play Services & Drive API quotas, requires ADB or Accessibility tweaks for seamless clipboard, and has dated UI ergonomics.',
  },
  {
    id: 'pushbullet',
    name: 'Pushbullet',
    developerType: 'Commercial SaaS',
    primaryTopology: 'Cloud Relay Server + FCM',
    notificationSync: {
      status: 'PC-Only',
      detail:
        'Designed strictly for Phone-to-Desktop notification mirroring. Android-to-Android notification mirroring was deprecated/restricted.',
    },
    callSync: {
      status: 'PC-Only',
      detail: 'Shows call popups on desktop browsers only; no phone-to-phone call control.',
    },
    clipboardSync: {
      status: 'Manual / Tile (Android 10+)',
      detail: 'Universal copy-paste stopped working automatically in the background after Android 10.',
    },
    encryptionModel: 'Optional password-derived AES-256 E2EE for notification bodies',
    rootRequired: false,
    verdict: 'Not Suitable for Phone-to-Phone Sync',
    gapSummary: 'Built for Phone-to-PC rather than peer-to-peer phone ecosystems.',
  },
  {
    id: 'samsung-google-native',
    name: 'Google Cross-Device Services & Samsung Call/Text on Other Devices',
    developerType: 'First-Party OEM',
    primaryTopology: 'Proprietary Bluetooth LE + WebRTC + OEM Cloud',
    notificationSync: {
      status: 'Partial',
      detail:
        'Samsung Flow mirrors notifications to tablets/PCs; Google Cross-Device focuses on Hotspot, Cast, and Chromebook Phone Hub.',
    },
    callSync: {
      status: 'PC-Only',
      detail:
        'Samsung "Call & Text on other devices" works only between a Samsung Phone and a Samsung Tablet/Watch—it explicitly blocks Phone-to-Phone pairing.',
    },
    clipboardSync: {
      status: 'Partial' as any,
      detail:
        'Samsung Continuity clipboard syncs only across Samsung devices signed into the same Samsung Account over Bluetooth/Wi-Fi.',
    },
    encryptionModel: 'Proprietary Google/Samsung account-bound encryption',
    rootRequired: false,
    verdict: 'Hardware-Locked (Blocks Phone-to-Phone)',
    gapSummary:
      'Artificially restricted to Phone-to-Tablet or Phone-to-Chromebook; does not support two phones or mixed brands (e.g., Pixel + Galaxy).',
  },
];

export const ANDROID_PERMISSION_AUDITS: AndroidPermissionAudit[] = [
  {
    id: 'notif-listener',
    featureArea: 'Notifications',
    apiOrPermission: 'android.service.notification.NotificationListenerService',
    minSdk: 'API 18+ (Enhanced in API 26–35)',
    protectionLevel: 'Special App Access',
    whatAndroidPermits:
      'Receives real-time callbacks (onNotificationPosted, onNotificationRemoved) with full StatusBarNotification metadata: packageName, title, text, bigText, small/large icon Bitmap, Notification.Action pending intents (inline replies), and unique notification key.',
    hardAndroidLimitation:
      'Android 13+ (API 33) places sideloaded APKs under "Restricted Settings" until the user enables "Allow restricted settings" in App Info. Android 15+ redacts sensitive OTP two-factor codes from untrusted NotificationListeners unless the app holds CompanionDeviceManager association.',
    practicalNonRootSolution:
      'Bind a NotificationListenerService associated with a CompanionDeviceManager profile (COMPANION_APPROVE_WIFI_CONNECTIONS / REQUEST_OBSERVE_COMPANION_DEVICE_PRESENCE). Dismiss remotely on either phone by calling cancelNotification(sbn.key).',
  },
  {
    id: 'call-answer-reject',
    featureArea: 'Calls',
    apiOrPermission: 'TelecomManager.acceptRingingCall() & TelecomManager.endCall()',
    minSdk: 'API 26 (Accept) / API 28 (EndCall)',
    protectionLevel: 'Runtime Dangerous',
    whatAndroidPermits:
      'With ANSWER_PHONE_CALLS, READ_PHONE_STATE, and READ_CALL_LOG + READ_CONTACTS, a non-root app on Phone A can detect an incoming call, read the caller phone number/contact name, send an alert packet to Phone B, and execute acceptRingingCall() or endCall() on Phone A when commanded by Phone B.',
    hardAndroidLimitation:
      'CRITICAL ANDROID TRUTH: Answering a cellular call via TelecomManager.acceptRingingCall() answers the call on Phone A (the phone with the SIM card). Non-root third-party Android apps CANNOT capture or inject cellular voice uplink/downlink audio streams (VOICE_CALL audio source requires system signature permission CAPTURE_AUDIO_OUTPUT) to stream the call over Wi-Fi/VoIP.',
    practicalNonRootSolution:
      '1) Remote Control + Auto-Speakerphone: Clicking "Answer" on Phone B answers Phone A and switches Phone A to Speakerphone or connected Bluetooth headset. 2) True Voice Audio on Phone B: Register Bluetooth Hands-Free Profile (HFP Sink / HF role) between Phone A and Phone B so Android OS natively routes cellular call audio over Bluetooth.',
  },
  {
    id: 'clipboard-android10',
    featureArea: 'Clipboard',
    apiOrPermission: 'ClipboardManager.OnPrimaryClipChangedListener',
    minSdk: 'API 29+ (Android 10 Privacy Sandbox)',
    protectionLevel: 'Special App Access',
    whatAndroidPermits:
      'Any background service or broadcast receiver can WRITE to the clipboard at any time via ClipboardManager.setPrimaryClip(ClipData). Meaning incoming synced text from the other phone is 100% automatic and instant.',
    hardAndroidLimitation:
      'CRITICAL ANDROID TRUTH: Since Android 10 (API 29), background apps CANNOT read the clipboard or receive OnPrimaryClipChangedListener events unless the app currently holds window input focus or is the active Default Input Method Editor (Keyboard).',
    practicalNonRootSolution:
      'Combine three non-root mechanisms for outgoing copies: (A) AccessibilityService listening for TYPE_VIEW_TEXT_SELECTION_CHANGED / copy action ("Copy" button tap), (B) a 1x1 pixels invisible/translucent transient focus window triggered on copy gesture, and (C) a Quick Settings Tile + Share Sheet ("Sync Copy") fallback.',
  },
  {
    id: 'background-survival',
    featureArea: 'Background & Pairing',
    apiOrPermission: 'CompanionDeviceManager + ForegroundService (connectedDevice)',
    minSdk: 'API 26–34+ (Android 14 Foreground Service Types)',
    protectionLevel: 'Role / Companion',
    whatAndroidPermits:
      'Asociating both phones via CompanionDeviceManager exempts the app from Doze mode network restrictions, App Standby Buckets, and background process kills.',
    hardAndroidLimitation:
      'Android 14+ (API 34) strictly enforces foregroundServiceType="connectedDevice|remoteMessaging". Persistent TCP sockets over cellular drain battery (~3–4%/hr) if kept awake 24/7 without hardware offload.',
    practicalNonRootSolution:
      'Use a Hybrid Dual-Transport Engine: (1) When both phones are on the same Wi-Fi LAN, discover via mDNS (_continuumsync._tcp) and use a low-overhead TLS 1.3 socket. (2) When apart on mobile data, close idle sockets and use Firebase Cloud Messaging (FCM) High-Priority data pushes (zero payload knowledge—encrypted blob inside FCM) to wake the peer in <180ms.',
  },
];
