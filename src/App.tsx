import React, { useState } from 'react';
import { DualPhoneSimulator } from './components/DualPhoneSimulator';
import { EcosystemAuditView } from './components/EcosystemAuditView';
import { ArchitectureAndBlueprintView } from './components/ArchitectureAndBlueprintView';
import { PairingModal } from './components/PairingModal';
import { LivePhysicalBridgeAndInstaller } from './components/LivePhysicalBridgeAndInstaller';

type ActiveSection = 'all' | 'simulator' | 'audit' | 'blueprint';

const SAS_CODES = ['482-910', '731-049', '905-628', '318-774'];

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('all');
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [sasIndex, setSasIndex] = useState(0);

  const currentSas = SAS_CODES[sasIndex % SAS_CODES.length];

  const handleRotateKeys = () => {
    setSasIndex((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('all');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          ContinuumSync
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#complete-overview"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('all');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'all' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Complete Blueprint
          </a>
          <a
            href="#live-studio"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('simulator');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'simulator' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Live Sync Studio
          </a>
          <a
            href="#ecosystem-audit"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('audit');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'audit' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Existing Apps & OS Limits
          </a>
          <a
            href="#kotlin-blueprint"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('blueprint');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'blueprint' ? 'text-slate-900 font-semibold underline' : ''
            }`}
          >
            Architecture & Kotlin Code
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsPairingOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Pair & Manage Devices
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Executive Architectural Summary Header */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
          {activeSection === 'all' && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Dual-Phone Continuity Engineering Specification</span>
                <span aria-hidden="true">·</span>
                <span>Android 10–15 (API 29–35)</span>
                <span aria-hidden="true">·</span>
                <span>No Root Required</span>
                <span aria-hidden="true">·</span>
                <span>End-to-End Encrypted (X25519 + ChaCha20-Poly1305)</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-3">
                  <h1
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    Apple-Style Continuity Between Two Android Phones—Without Root
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                    An honest engineering audit of existing cross-device tools, real Android OS permission boundaries for remote call answering and background clipboard access, and a complete interactive prototype + Kotlin implementation guide.
                  </p>
                </div>

                {/* Key Findings Summary Box */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    Executive Feasibility Verdict (No-Root Android):
                  </div>
                  <div className="space-y-2 text-slate-700 leading-relaxed">
                    <p>
                      <strong className="text-slate-900">1. Notification Sync (100% Supported):</strong>{' '}
                      Full bidirectional mirroring, icons, inline replies (<code className="font-mono">RemoteInput</code>), and cross-device dismissal via <code className="font-mono">NotificationListenerService.cancelNotification(key)</code>.
                    </p>
                    <p>
                      <strong className="text-slate-900">2. Call Sync (Control Supported · Voice Audio Caveat):</strong>{' '}
                      Phone B can display Caller ID and remotely <strong>Answer</strong> (<code className="font-mono">TelecomManager.acceptRingingCall()</code>) or <strong>Reject</strong> (<code className="font-mono">endCall()</code>) a call ringing on Phone A. However, non-root Android blocks third-party apps from streaming cellular call audio over Wi-Fi; answering activates Phone A’s speakerphone or routes voice via Bluetooth HFP.
                    </p>
                    <p>
                      <strong className="text-slate-900">3. Clipboard Sync (Incoming 100% Auto · Outgoing via Hook):</strong>{' '}
                      Background clipboard <em>writes</em> work silently on all Android versions. Background <em>reads</em> are blocked on Android 10+, solved cleanly via an <code className="font-mono">AccessibilityService</code> selection listener + Quick Settings Tile.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section Filter Bar */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 ${
              activeSection === 'all' ? 'pt-4 border-t border-slate-100' : ''
            }`}
          >
            <div
              role="group"
              aria-label="Switch workspace view"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                onClick={() => setActiveSection('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSection === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sections
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('simulator')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSection === 'simulator'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Interactive Dual-Phone Sandbox
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('audit')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSection === 'audit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Existing Apps & Android OS Limits
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('blueprint')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeSection === 'blueprint'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Architecture & Kotlin Implementation
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Paired: Pixel 9 Pro ↔ Galaxy S25 Ultra · SAS #{currentSas}
            </div>
          </div>
        </section>

        {/* Option B Built Android Project & Live Physical Phone-to-Phone Bridge */}
        <LivePhysicalBridgeAndInstaller roomCode={currentSas} />

        {/* Interactive Dual-Phone Sync Sandbox */}
        {(activeSection === 'all' || activeSection === 'simulator') && (
          <div id="live-studio">
            <DualPhoneSimulator
              onOpenPairingModal={() => setIsPairingOpen(true)}
              pairedSasCode={currentSas}
            />
          </div>
        )}

        {/* Existing Apps Investigation & Honest Android Limitations */}
        {(activeSection === 'all' || activeSection === 'audit') && (
          <div id="ecosystem-audit">
            <EcosystemAuditView />
          </div>
        )}

        {/* Architecture, Crypto & Step-by-Step Kotlin Implementation Blueprint */}
        {(activeSection === 'all' || activeSection === 'blueprint') && (
          <div id="kotlin-blueprint">
            <ArchitectureAndBlueprintView
              pairedSasCode={currentSas}
              onRegeneratePairing={handleRotateKeys}
            />
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            ContinuumSync — Dual-Phone Android Synchronization Architecture & Interactive Testbed
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsPairingOpen(true)}
              className="hover:text-slate-900 underline underline-offset-2"
            >
              Inspect QR Pairing & ECDH Handshake
            </button>
          </div>
        </div>
      </footer>

      {/* QR Pairing & Trust Management Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        sasCode={currentSas}
        onRotateKeys={handleRotateKeys}
      />
    </div>
  );
}
