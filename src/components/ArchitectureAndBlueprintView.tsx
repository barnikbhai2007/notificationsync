import React, { useState } from 'react';
import {
  IMPLEMENTATION_STEPS,
  KOTLIN_BLUEPRINT_MODULES,
} from '../data/kotlinBlueprintData';
import {
  Copy,
  Check,
  KeyRound,
  Cpu,
  Radio,
  Lock,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface ArchitectureAndBlueprintViewProps {
  pairedSasCode: string;
  onRegeneratePairing: () => void;
}

export const ArchitectureAndBlueprintView: React.FC<ArchitectureAndBlueprintViewProps> = ({
  pairedSasCode,
  onRegeneratePairing,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    KOTLIN_BLUEPRINT_MODULES[0].id
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeModule =
    KOTLIN_BLUEPRINT_MODULES.find((m) => m.id === selectedModuleId) ||
    KOTLIN_BLUEPRINT_MODULES[0];

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback if clipboard permission in iframe is restricted
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-10">
      {/* SECTION 1: System Architecture & Hybrid Transport Stack */}
      <section aria-labelledby="arch-heading" className="space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Part 3 System Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Trust Hybrid LAN + BLE + FCM Topology</span>
          </div>
          <h2 id="arch-heading" className="text-2xl font-bold text-slate-900">
            Recommended Custom Android Architecture (“ContinuumSync”)
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            To achieve Apple-grade continuity without root access or battery drain, the application separates <strong>Event Capture</strong>, <strong>End-to-End AEAD Cryptography</strong>, and <strong>Adaptive Multi-Path Transport</strong>.
          </p>
        </div>

        {/* 4-Layer Architectural Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>01. OS Event Hooks</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Android System Listeners</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                · <strong className="text-slate-800">Notifications:</strong>{' '}
                <code className="font-mono">NotificationListenerService</code> captures posts, actions, and keys.
              </li>
              <li>
                · <strong className="text-slate-800">Calls:</strong>{' '}
                <code className="font-mono">TelephonyCallback</code> +{' '}
                <code className="font-mono">TelecomManager</code> for remote answer/reject.
              </li>
              <li>
                · <strong className="text-slate-800">Clipboard:</strong>{' '}
                <code className="font-mono">AccessibilityService</code> + Quick Tile (Outgoing) &{' '}
                <code className="font-mono">setPrimaryClip</code> (Incoming).
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>02. State & Deduplication</span>
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Loop-Free Sync Engine</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                · <strong className="text-slate-800">Echo Guard:</strong> Tags mirrored notifications with{' '}
                <code className="font-mono">EXTRA_CONTINUUM_MIRRORED=true</code>.
              </li>
              <li>
                · <strong className="text-slate-800">Clipboard Hash Ring:</strong> Computes SHA-256 of incoming clips so Android 13+ clipboard toasts do not trigger re-broadcasts.
              </li>
              <li>
                · <strong className="text-slate-800">Room Queue:</strong> Monotonic sequence numbers with SQLite persistence during offline handoffs.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>03. Zero-Trust Crypto</span>
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">End-to-End Encryption</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                · <strong className="text-slate-800">Key Agreement:</strong> Ephemeral X25519 ECDH exchanged via out-of-band QR code scan.
              </li>
              <li>
                · <strong className="text-slate-800">Key Storage:</strong> Derived 256-bit key wrapped inside hardware-backed Android Keystore.
              </li>
              <li>
                · <strong className="text-slate-800">AEAD Cipher:</strong> ChaCha20-Poly1305 with 96-bit nonces and device-ID Associated Data (AAD).
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>04. Adaptive Transport</span>
              <Radio className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">LAN / BLE / WAN Bridge</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                · <strong className="text-slate-800">Tier 1 (Same Wi-Fi):</strong> mDNS (<code className="font-mono">_continuumsync._tcp</code>) + Mutual TLS 1.3 (~9ms).
              </li>
              <li>
                · <strong className="text-slate-800">Tier 2 (Offline Proximity):</strong> BLE GATT notification + L2CAP CoC socket (~38ms).
              </li>
              <li>
                · <strong className="text-slate-800">Tier 3 (Remote Cellular):</strong> FCM High-Priority encrypted data push (&lt;4KB) with zero idle battery drain.
              </li>
            </ul>
          </div>
        </div>

        {/* Interactive Pairing & ECDH Key Verification Strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Zero-Server Pairing Protocol</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">Curve25519 + HKDF-SHA256</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Verified Device Pair: Pixel 9 Pro ↔ Galaxy S25 Ultra
            </h3>
            <p className="text-xs text-slate-600">
              Both phones verify a 6-digit Short Authentication String (SAS) derived from the ECDH shared secret to prevent Man-in-the-Middle attacks on public Wi-Fi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-500">Active SAS Fingerprint: </span>
              <span className="font-mono font-bold text-slate-900">{pairedSasCode}</span>
            </div>
            <button
              type="button"
              onClick={onRegeneratePairing}
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Rotate Ephemeral Keys
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: 6-Step Implementation Roadmap */}
      <section aria-labelledby="roadmap-heading" className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Part 4 Step-by-Step Guide</span>
            <span aria-hidden="true">·</span>
            <span>Android Studio Ladybug · Kotlin 2.0 · MinSDK 28 / TargetSDK 35</span>
          </div>
          <h2 id="roadmap-heading" className="text-2xl font-bold text-slate-900">
            Step-by-Step Android Implementation Guide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {IMPLEMENTATION_STEPS.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="text-xs text-slate-500 font-mono">{step.durationEstimate}</div>
                <h3 className="text-base font-bold text-slate-900">
                  {step.stepNumber}. {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.summary}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                Verify: {step.verificationCriteria}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Production Kotlin Source Code Explorer */}
      <section aria-labelledby="kotlin-code-heading" className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Part 5 Reference Implementation</span>
            <span aria-hidden="true">·</span>
            <span>Production Kotlin & AndroidManifest Source Files</span>
          </div>
          <h2 id="kotlin-code-heading" className="text-2xl font-bold text-slate-900">
            Core Kotlin Implementation Modules
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* File Selector Tabs */}
          <div
            role="tablist"
            aria-label="Kotlin implementation source files"
            className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border-b border-slate-200"
          >
            {KOTLIN_BLUEPRINT_MODULES.map((mod) => (
              <button
                key={mod.id}
                role="tab"
                aria-selected={activeModule.id === mod.id}
                type="button"
                onClick={() => setSelectedModuleId(mod.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeModule.id === mod.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mod.subsystem}
              </button>
            ))}
          </div>

          {/* Active Module Metadata & Code */}
          <div className="p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-blue-700">{activeModule.filename}</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeModule.title}</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl">{activeModule.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(activeModule.id, activeModule.code)}
                className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start whitespace-nowrap shrink-0"
              >
                {copiedId === activeModule.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied Kotlin File
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Source File
                  </>
                )}
              </button>
            </div>

            {/* Engineering Notes */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                Android SDK & Security Implementation Notes:
              </div>
              {activeModule.androidNotes.map((note, idx) => (
                <div key={idx} className="text-xs text-slate-600">
                  · {note}
                </div>
              ))}
            </div>

            {/* Code Block */}
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{activeModule.code}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
