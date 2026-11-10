import React, { useState } from 'react';
import {
  EXISTING_APPS_AUDIT,
  ANDROID_PERMISSION_AUDITS,
  type AndroidPermissionAudit,
} from '../data/ecosystemData';
import { ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export const EcosystemAuditView: React.FC = () => {
  const [selectedFeatureFilter, setSelectedFeatureFilter] = useState<
    'All' | AndroidPermissionAudit['featureArea']
  >('All');

  const filteredPermissions =
    selectedFeatureFilter === 'All'
      ? ANDROID_PERMISSION_AUDITS
      : ANDROID_PERMISSION_AUDITS.filter((item) => item.featureArea === selectedFeatureFilter);

  return (
    <div className="space-y-10">
      {/* PART 1: Existing Applications Investigation */}
      <section aria-labelledby="existing-apps-heading" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Part 1 Investigation</span>
              <span aria-hidden="true">·</span>
              <span>Off-the-Shelf Android Ecosystem Evaluation</span>
            </div>
            <h2 id="existing-apps-heading" className="text-2xl font-bold text-slate-900">
              Can an Existing App Provide All Three Features?
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              <strong>Short answer: No single existing app fulfills all requirements out of the box.</strong>{' '}
              Most cross-device tools (Link to Windows, Pushbullet, AirDroid) are engineered strictly for{' '}
              <em>Phone-to-PC</em> rather than <em>Phone-to-Phone</em>. Combining <strong>KDE Connect</strong> (on LAN) or <strong>Join by joaoapps</strong> (over FCM) gets closest, but both fall short on synchronized dual-phone Call Answering UI and frictionless Android 10+ clipboard sync.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Application & Topology</th>
                  <th className="py-3.5 px-4">1. Notification Sync</th>
                  <th className="py-3.5 px-4">2. Call Sync (Phone-to-Phone)</th>
                  <th className="py-3.5 px-4">3. Clipboard Sync (Android 10+)</th>
                  <th className="py-3.5 px-4">Encryption & Root</th>
                  <th className="py-3.5 px-4">Engineering Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {EXISTING_APPS_AUDIT.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="font-bold text-slate-900 text-sm">{app.name}</div>
                      <div className="text-slate-500 mt-0.5">
                        {app.developerType} · {app.primaryTopology}
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="font-semibold text-slate-900">
                        {app.notificationSync.status}
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {app.notificationSync.detail}
                      </p>
                    </td>
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="font-semibold text-slate-900">{app.callSync.status}</div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{app.callSync.detail}</p>
                    </td>
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="font-semibold text-slate-900">
                        {app.clipboardSync.status}
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {app.clipboardSync.detail}
                      </p>
                    </td>
                    <td className="py-4 px-4 min-w-[180px]">
                      <div className="font-medium text-slate-800">{app.encryptionModel}</div>
                      <div className="text-slate-500 mt-1">
                        Root Required: {app.rootRequired ? 'Yes' : 'No (Non-Root)'}
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[220px]">
                      <div className="font-bold text-blue-700">{app.verdict}</div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{app.gapSummary}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PART 2: Honest Android OS Limitations & Permissions Truth Table */}
      <section aria-labelledby="android-limits-heading" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Part 2 Deep-Dive</span>
              <span aria-hidden="true">·</span>
              <span>Non-Root Android 10–15 API & Hardware Realities</span>
            </div>
            <h2 id="android-limits-heading" className="text-2xl font-bold text-slate-900">
              Honest Android Limitations & Permission Architecture
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Unlike Apple’s iOS/macOS Continuity (which uses private system-signed entitlements inside <code className="font-mono">identityservicesd</code> and <code className="font-mono">rapportd</code>), a non-root Android app must operate strictly within public SDK boundaries. Here is what Android genuinely permits—and what it blocks.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div
            role="group"
            aria-label="Filter Android permissions by subsystem"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
          >
            {(['All', 'Notifications', 'Calls', 'Clipboard', 'Background & Pairing'] as const).map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedFeatureFilter(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedFeatureFilter === category
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPermissions.map((audit) => (
            <article
              key={audit.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">{audit.featureArea}</span>
                    <span aria-hidden="true">·</span>
                    <span>{audit.minSdk}</span>
                    <span aria-hidden="true">·</span>
                    <span>Protection Level: {audit.protectionLevel}</span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-slate-900 mt-1">
                    {audit.apiOrPermission}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    What Android Officially Permits
                  </div>
                  <p className="text-slate-600">{audit.whatAndroidPermits}</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    Hard OS / Hardware Limitation (No Root)
                  </div>
                  <p className="text-slate-700">{audit.hardAndroidLimitation}</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    Best Practical Engineering Solution
                  </div>
                  <p className="text-slate-700">{audit.practicalNonRootSolution}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
