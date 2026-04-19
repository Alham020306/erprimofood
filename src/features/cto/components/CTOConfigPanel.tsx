import { useEffect, useMemo, useState } from "react";

type ConfigFlags = {
  maintenanceMode: boolean;
  enableApprovals: boolean;
  enableFinance: boolean;
  enableOrders: boolean;
  enableDriverRealtime: boolean;
  enableMerchantRegistration: boolean;
  enableExpansionAnalyzer: boolean;
  enableNotifications: boolean;
};

type Props = {
  systemFlags: ConfigFlags;
  editable?: boolean;
  onSave?: (nextFlags: ConfigFlags) => Promise<void>;
};

const flagGroups: Array<{
  title: string;
  description: string;
  items: Array<{ key: keyof ConfigFlags; label: string; note: string }>;
}> = [
  {
    title: "Core Platform",
    description: "Platform state and routing-critical controls.",
    items: [
      {
        key: "maintenanceMode",
        label: "Maintenance Mode",
        note: "Freeze non-essential interactions for maintenance windows.",
      },
      {
        key: "enableOrders",
        label: "Orders Pipeline",
        note: "Gate incoming order flow and operational processing.",
      },
      {
        key: "enableNotifications",
        label: "Notification Layer",
        note: "Keep executive and operational notifications active.",
      },
    ],
  },
  {
    title: "Business Services",
    description: "Workflow services powering approvals and finance.",
    items: [
      {
        key: "enableApprovals",
        label: "Approvals Engine",
        note: "Handle business approvals and role escalations.",
      },
      {
        key: "enableFinance",
        label: "Finance Layer",
        note: "Ledger, settlements, and reporting access.",
      },
      {
        key: "enableMerchantRegistration",
        label: "Merchant Registration",
        note: "Provision and activate merchant onboarding paths.",
      },
    ],
  },
  {
    title: "Realtime Intelligence",
    description: "Observability and spatial control systems.",
    items: [
      {
        key: "enableDriverRealtime",
        label: "Driver Realtime",
        note: "Maintain live location and status telemetry.",
      },
      {
        key: "enableExpansionAnalyzer",
        label: "Expansion Analyzer",
        note: "Keep strategic area expansion logic available.",
      },
    ],
  },
];

export default function CTOConfigPanel({
  systemFlags,
  editable = false,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<ConfigFlags>(systemFlags);
  const [saving, setSaving] = useState(false);

  const enabledCount = useMemo(
    () => Object.values(draft).filter(Boolean).length,
    [draft]
  );
  const readinessPct = Math.round((enabledCount / Object.keys(draft).length) * 100);

  useEffect(() => {
    setDraft(systemFlags);
  }, [systemFlags]);

  const toggle = (key: keyof ConfigFlags) => {
    if (!editable) return;
    setDraft((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const save = async () => {
    if (!editable || !onSave) return;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/92 p-5 shadow-[0_24px_80px_rgba(14,165,233,0.12)]">
      <div className="mb-5 grid gap-4 md:grid-cols-[1.4fr,0.8fr]">
        <div>
        <h2 className="text-lg font-bold text-cyan-300">System Config Flags</h2>
          <p className="mt-1 text-sm text-slate-400">
            grouped operational controls for platform continuity, governance, and
            realtime services.
          </p>
        </div>
        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
              readiness
            </span>
            <span className="text-sm font-semibold text-white">{readinessPct}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${readinessPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {enabledCount} of {Object.keys(draft).length} control surfaces active.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        {editable ? (
          <button
            onClick={save}
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Config"}
          </button>
        ) : <div />}
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
          CTO policy matrix
        </div>
      </div>

      <div className="space-y-4">
        {flagGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-3xl border border-cyan-500/20 bg-slate-900/55 p-4"
          >
            <div className="mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/90">
                {group.title}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{group.description}</p>
            </div>

            <div className="space-y-3">
              {group.items.map((item) => {
                const value = draft[item.key];

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-cyan-500/14 bg-slate-950/70 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-100">
                        {item.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{item.note}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => toggle(item.key)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        value
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      } ${!editable ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      {value ? "ON" : "OFF"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
