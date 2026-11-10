import React from 'react';
import { X, QrCode, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sasCode: string;
  onRotateKeys: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  sasCode,
  onRotateKeys,
}) => {
  if (!isOpen) return null;

  const qrPayload = JSON.stringify({
    proto: 'continuumsync-v1',
    curve: 'X25519',
    pubKey: 'MCowBQYDK2VuAyEA8f9a2c4b1e7d9f0a3c5e8b2d4f6a1c3e',
    lanEndpoint: '192.168.1.42:8443',
    sas: sasCode,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pairing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs text-slate-500">
              CompanionDeviceManager + Out-of-Band X25519 Key Exchange
            </div>
            <h2 id="pairing-modal-title" className="text-lg font-bold text-slate-900 mt-0.5">
              Device Pairing & Trust Management
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close pairing modal"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Simulated Deterministic QR Matrix */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center text-center space-y-2">
            <div className="w-32 h-32 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
            <div className="text-xs font-semibold text-slate-800">
              Scan from Phone B to Pair
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              SAS Verification: #{sasCode}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                Phone A: Google Pixel 9 Pro
              </div>
              <div className="text-slate-500 font-mono">
                Status: Paired · Primary SIM Host
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Phone B: Samsung Galaxy S25 Ultra
              </div>
              <div className="text-slate-500 font-mono">
                Status: Paired · Companion Peer
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Zero-Trust Hardware Keystore
              </div>
              <p className="text-slate-600 leading-relaxed">
                Keys never leave the Android StrongBox Keystore. FCM wakeup packets carry only ChaCha20-Poly1305 ciphertext.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-700">
            Encoded QR Handshake Payload:
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto">
            <code>{qrPayload}</code>
          </pre>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onRotateKeys}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate New Ephemeral SAS
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
