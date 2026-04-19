import { useEffect, useMemo, useState } from "react";
import CTOConfigPanel from "../components/CTOConfigPanel";
import CTOSectionShell from "../components/CTOSectionShell";
import CTOZoneEditorMap from "../components/CTOZoneEditorMap";
import { useCTOConfigControl } from "../hooks/useCTOConfigControl";
import { exportSystemSnapshot } from "../utils/exportSystemSnapshot";
import { DIRECTOR_SUMMARY_TARGETS } from "../../shared/services/directorSummaryService";
import { fetchCTOExportSnapshotSource } from "../services/ctoDashboardFeedService";

type Props = { user: any };
type Coordinate = { lat: number; lng: number };
type MacroZone = { path: Coordinate[] };

const inputClass =
  "rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-3 text-white";

const operationFieldMeta = {
  maintenanceTitle: ["Maintenance Title", "Judul utama saat sistem sedang maintenance."],
  maintenanceETC: ["Maintenance ETA", "Perkiraan kapan maintenance selesai."],
  maintenanceMessage: ["Maintenance Message", "Pesan detail untuk user saat maintenance."],
  baseDeliveryFee: ["Base Delivery Fee", "Biaya dasar pengiriman sebelum tarif jarak."],
  pricePerKm: ["Price Per Km", "Tarif tambahan per kilometer."],
  baseDistanceKm: ["Base Distance Km", "Jarak dasar yang dicakup biaya awal."],
  serviceFeePercent: ["Service Fee Percent", "Persentase biaya layanan customer."],
  reservationServiceFee: ["Reservation Service Fee", "Biaya tambahan untuk reservasi."],
  driverCommissionPercent: ["Driver Commission Percent", "Persentase komisi driver."],
  adminEarnings: ["Admin Earnings", "Nilai earning internal yang tersimpan di config."],
  updateVersion: ["Update Version", "Versi app yang ditandai siap update."],
  updateLink: ["Update Link", "URL file update aplikasi."],
} as const;

const normalizePoint = (point: any): Coordinate => ({
  lat: Number(point?.lat || 0),
  lng: Number(point?.lng || 0),
});

const normalizeMacroZones = (zones: any[]): MacroZone[] =>
  (Array.isArray(zones) ? zones : []).map((zone) => ({
    ...zone,
    path: Array.isArray(zone?.path) ? zone.path.map(normalizePoint) : [],
  }));

const formatCoordinate = (point: Coordinate) =>
  `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;

const formatTimestamp = (value: any) => {
  const time = Number(value || 0);
  if (!time) return "-";
  return new Date(time).toLocaleString("id-ID");
};

function LabeledInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  textarea?: boolean;
}) {
  return (
    <label className="rounded-3xl border border-cyan-500/14 bg-slate-950/60 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/80">
        {label}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`mt-3 w-full ${inputClass}`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`mt-3 w-full ${inputClass}`}
        />
      )}
    </label>
  );
}

export default function CTOConfigPage({ user }: Props) {
  const {
    loading,
    dashboard,
    systemFlags,
    configSnapshot,
    saveConfig,
    saveOperationalConfig,
    saveSupport,
    saveZoneConfig,
    triggerBackup,
    summarySnapshots,
    syncState,
    refreshingSummary,
    refreshSummary,
    refreshAllSummaries,
  } = useCTOConfigControl({ user });

  const [settingsForm, setSettingsForm] = useState({
    maintenanceTitle: "",
    maintenanceMessage: "",
    maintenanceETC: "",
    baseDeliveryFee: "0",
    baseDistanceKm: "0",
    pricePerKm: "0",
    serviceFeePercent: "0",
    reservationServiceFee: "0",
    driverCommissionPercent: "0",
    adminEarnings: "0",
    updateVersion: "",
    updateLink: "",
    botEnabled: false,
    updateAvailable: false,
  });
  const [contactForm, setContactForm] = useState({ email: "", wa: "", ig: "", fb: "" });
  const [supportForm, setSupportForm] = useState({ isOnline: false, reason: "" });
  const [zoneForm, setZoneForm] = useState({
    centerLat: "0",
    centerLng: "0",
    password: "",
  });
  const [primaryZone, setPrimaryZone] = useState<Coordinate[]>([]);
  const [macroZones, setMacroZones] = useState<MacroZone[]>([]);
  const [activeDrawMode, setActiveDrawMode] = useState<"center" | "primary" | "macro">(
    "primary"
  );
  const [activeMacroIndex, setActiveMacroIndex] = useState(0);
  const [savingOps, setSavingOps] = useState(false);
  const [savingSupport, setSavingSupport] = useState(false);
  const [savingZone, setSavingZone] = useState(false);
  const [runningBackupScope, setRunningBackupScope] = useState("");
  const [zoneError, setZoneError] = useState("");

  useEffect(() => {
    setSettingsForm({
      maintenanceTitle: configSnapshot.maintenanceTitle || "",
      maintenanceMessage: configSnapshot.maintenanceMessage || "",
      maintenanceETC: configSnapshot.maintenanceETC || "",
      baseDeliveryFee: String(configSnapshot.baseDeliveryFee || 0),
      baseDistanceKm: String(configSnapshot.baseDistanceKm || 0),
      pricePerKm: String(configSnapshot.pricePerKm || 0),
      serviceFeePercent: String(configSnapshot.serviceFeePercent || 0),
      reservationServiceFee: String(configSnapshot.reservationServiceFee || 0),
      driverCommissionPercent: String(configSnapshot.driverCommissionPercent || 0),
      adminEarnings: String(configSnapshot.adminEarnings || 0),
      updateVersion: configSnapshot.updateVersion || "",
      updateLink: configSnapshot.updateLink || "",
      botEnabled: configSnapshot.botEnabled === true,
      updateAvailable: configSnapshot.updateAvailable === true,
    });
    setContactForm({
      email: configSnapshot.contact?.email || "",
      wa: configSnapshot.contact?.wa || "",
      ig: configSnapshot.contact?.ig || "",
      fb: configSnapshot.contact?.fb || "",
    });
    setSupportForm({
      isOnline: configSnapshot.supportOnline === true,
      reason: configSnapshot.supportReason || "",
    });
    setZoneForm({
      centerLat: String(configSnapshot.center?.lat ?? 0),
      centerLng: String(configSnapshot.center?.lng ?? 0),
      password: "",
    });
    setPrimaryZone((configSnapshot.zone || []).map(normalizePoint));
    setMacroZones(normalizeMacroZones(configSnapshot.zones || []));
  }, [configSnapshot]);

  const enabledFlags = Object.values(systemFlags).filter(Boolean).length;
  const zoneCenter = useMemo(
    () => ({
      lat: Number(zoneForm.centerLat || 0),
      lng: Number(zoneForm.centerLng || 0),
    }),
    [zoneForm.centerLat, zoneForm.centerLng]
  );
  const generatedZoneJson = useMemo(() => JSON.stringify(primaryZone, null, 2), [primaryZone]);
  const generatedZonesJson = useMemo(() => JSON.stringify(macroZones, null, 2), [macroZones]);
  const summaryCards = useMemo(
    () =>
      (Object.entries(DIRECTOR_SUMMARY_TARGETS) as Array<
        [keyof typeof DIRECTOR_SUMMARY_TARGETS, (typeof DIRECTOR_SUMMARY_TARGETS)[keyof typeof DIRECTOR_SUMMARY_TARGETS]]
      >).map(([summaryKey, target]) => ({
        summaryKey,
        label: target.label,
        snapshot: summarySnapshots[summaryKey],
        syncMeta: syncState?.summaries?.[summaryKey] || null,
      })),
    [summarySnapshots, syncState]
  );

  if (loading) return <div>Loading CTO config...</div>;

  const saveOps = async () => {
    setSavingOps(true);
    try {
      await saveOperationalConfig({
        settings: {
          maintenanceTitle: settingsForm.maintenanceTitle,
          maintenanceMessage: settingsForm.maintenanceMessage,
          maintenanceETC: settingsForm.maintenanceETC,
          baseDeliveryFee: Number(settingsForm.baseDeliveryFee || 0),
          baseDistanceKm: Number(settingsForm.baseDistanceKm || 0),
          pricePerKm: Number(settingsForm.pricePerKm || 0),
          serviceFeePercent: Number(settingsForm.serviceFeePercent || 0),
          reservationServiceFee: Number(settingsForm.reservationServiceFee || 0),
          driverCommissionPercent: Number(settingsForm.driverCommissionPercent || 0),
          adminEarnings: Number(settingsForm.adminEarnings || 0),
          updateVersion: settingsForm.updateVersion,
          updateLink: settingsForm.updateLink,
          isRimoBotEnabled: settingsForm.botEnabled,
          updateAvailable: settingsForm.updateAvailable,
        },
        contact: contactForm,
      });
    } finally {
      setSavingOps(false);
    }
  };

  const saveSupportState = async () => {
    setSavingSupport(true);
    try {
      await saveSupport(supportForm);
    } finally {
      setSavingSupport(false);
    }
  };

  const runBackup = async (
    scope: "MAIN_DB" | "C_LEVEL_DB" | "STORAGE" | "FULL"
  ) => {
    setRunningBackupScope(scope);
    try {
      await triggerBackup(scope);
    } finally {
      setRunningBackupScope("");
    }
  };

  const exportSnapshot = async () => {
    await triggerBackup("FULL");
    const rawSnapshot = await fetchCTOExportSnapshotSource();
    exportSystemSnapshot({
      generatedAt: new Date().toISOString(),
      systemHealth: dashboard?.healthStatus || "UNKNOWN",
      directorHealth: dashboard?.directorHealthStatus || "UNKNOWN",
      network: {
        supportOnline: configSnapshot.supportOnline,
        supportReason: configSnapshot.supportReason,
      },
      raw: rawSnapshot,
    });
  };

  const saveZoneState = async () => {
    setSavingZone(true);
    setZoneError("");
    try {
      if (primaryZone.length < 3) {
        throw new Error("Primary zone harus memiliki minimal 3 titik polygon.");
      }
      await saveZoneConfig({
        center: zoneCenter,
        zone: primaryZone,
        zones: macroZones,
        password: zoneForm.password,
      });
      setZoneForm((prev) => ({ ...prev, password: "" }));
    } catch (error: any) {
      setZoneError(error?.message || "Gagal menyimpan area operasional.");
    } finally {
      setSavingZone(false);
    }
  };

  const addPrimaryPoint = (point: Coordinate) => {
    setPrimaryZone((prev) => [...prev, point]);
  };

  const updatePrimaryPoint = (index: number, point: Coordinate) => {
    setPrimaryZone((prev) => prev.map((item, itemIndex) => (itemIndex === index ? point : item)));
  };

  const removePrimaryPoint = (index: number) => {
    setPrimaryZone((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const addMacroZone = () => {
    setMacroZones((prev) => [...prev, { path: [] }]);
    setActiveMacroIndex(macroZones.length);
    setActiveDrawMode("macro");
  };

  const removeMacroZone = (index: number) => {
    setMacroZones((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setActiveMacroIndex((prev) => Math.max(0, Math.min(prev, macroZones.length - 2)));
  };

  const addMacroPoint = (point: Coordinate) => {
    setMacroZones((prev) => {
      if (prev.length === 0) {
        setActiveMacroIndex(0);
        return [{ path: [point] }];
      }

      return prev.map((zone, zoneIndex) =>
        zoneIndex === activeMacroIndex ? { ...zone, path: [...(zone.path || []), point] } : zone
      );
    });
  };

  const updateMacroPoint = (zoneIndex: number, pointIndex: number, point: Coordinate) => {
    setMacroZones((prev) =>
      prev.map((zone, currentZoneIndex) =>
        currentZoneIndex === zoneIndex
          ? {
              ...zone,
              path: (zone.path || []).map((item, currentPointIndex) =>
                currentPointIndex === pointIndex ? point : item
              ),
            }
          : zone
      )
    );
  };

  const removeMacroPoint = (zoneIndex: number, pointIndex: number) => {
    setMacroZones((prev) =>
      prev.map((zone, currentZoneIndex) =>
        currentZoneIndex === zoneIndex
          ? {
              ...zone,
              path: (zone.path || []).filter((_, currentPointIndex) => currentPointIndex !== pointIndex),
            }
          : zone
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">active controls</p>
          <p className="mt-3 text-3xl font-bold text-white">{enabledFlags}</p>
        </div>
        <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">maintenance</p>
          <p className="mt-3 text-xl font-bold text-white">
            {configSnapshot.maintenanceMode ? "ON" : "OFF"}
          </p>
        </div>
        <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">support desk</p>
          <p className="mt-3 text-xl font-bold text-white">
            {configSnapshot.supportOnline ? "ONLINE" : "OFFLINE"}
          </p>
        </div>
        <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">zone points</p>
          <p className="mt-3 text-3xl font-bold text-white">{primaryZone.length}</p>
        </div>
      </div>

      <CTOSectionShell
        title="System Control Matrix"
        subtitle="Derived feature state based on the live system configuration."
      >
        <CTOConfigPanel systemFlags={systemFlags} editable onSave={saveConfig} />
      </CTOSectionShell>

      <CTOSectionShell
        title="Director Platform Safeguards"
        subtitle="Manual backup controls for operational and c-level environments."
      >
        <div className="grid gap-3 md:grid-cols-5">
          {(["MAIN_DB", "C_LEVEL_DB", "STORAGE", "FULL"] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => runBackup(scope)}
              disabled={runningBackupScope === scope}
              className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-4 text-left text-sm font-semibold text-white transition hover:border-cyan-400/50 disabled:opacity-60"
            >
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
                manual backup
              </div>
              <div className="mt-2">{scope.replace(/_/g, " ")}</div>
              <div className="mt-2 text-xs text-slate-400">
                {runningBackupScope === scope ? "Recording..." : "Create backup record"}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={exportSnapshot}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-left text-sm font-semibold text-emerald-300 transition hover:border-emerald-300/60"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">
              snapshot export
            </div>
            <div className="mt-2">All Database Snapshot</div>
            <div className="mt-2 text-xs text-slate-400">
              Download monitored system data as JSON archive
            </div>
          </button>
        </div>
      </CTOSectionShell>

      <CTOSectionShell
        title="Summary Sync Control"
        subtitle="Refresh cache direksi secara manual dan pantau freshness tiap singleton summary."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-2xl border border-cyan-500/14 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
            <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
              last global refresh
            </div>
            <div className="mt-2 font-semibold text-white">
              {formatTimestamp(syncState?.lastSummaryRefreshAt)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {syncState?.lastSummaryRefreshByName || "Belum ada refresh manual"}{" "}
              {syncState?.lastSummaryRefreshByRole
                ? `(${syncState.lastSummaryRefreshByRole})`
                : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={refreshAllSummaries}
            disabled={refreshingSummary === "all"}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {refreshingSummary === "all" ? "Refreshing All..." : "Refresh All Summaries"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {summaryCards.map(({ summaryKey, label, snapshot, syncMeta }) => (
            <div
              key={summaryKey}
              className="rounded-3xl border border-cyan-500/14 bg-slate-950/65 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                    {summaryKey.replace(/_/g, " ")}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => refreshSummary(summaryKey)}
                  disabled={refreshingSummary === summaryKey || refreshingSummary === "all"}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 disabled:opacity-60"
                >
                  {refreshingSummary === summaryKey ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
                    doc freshness
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {formatTimestamp(snapshot?.updatedAt)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {snapshot?.updatedAt ? "Summary doc sudah tersimpan di direksi." : "Belum ada snapshot."}
                  </div>
                </div>
                <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-300/80">
                    sync status
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {syncMeta?.status || "AUTO / FALLBACK"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {syncMeta?.refreshedAt
                      ? `Last manual refresh ${formatTimestamp(syncMeta.refreshedAt)}`
                      : "Belum ada refresh manual tercatat."}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Refreshed by: {syncMeta?.refreshedByName || "-"}{" "}
                {syncMeta?.refreshedByRole ? `(${syncMeta.refreshedByRole})` : ""}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-500/14 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
          CFO summary refresh akan mengambil `operational_ledger` secara manual saat tombol
          ditekan, jadi tidak menambah listener realtime tetap di `dbMain`.
        </div>
      </CTOSectionShell>

      <div className="grid gap-4 xl:grid-cols-2">
        <CTOSectionShell
          title="Operations Settings"
          subtitle="Pricing, maintenance copy, updates, and bot behavior."
        >
          <div className="grid gap-4">
            <LabeledInput
              label={operationFieldMeta.maintenanceTitle[0]}
              description={operationFieldMeta.maintenanceTitle[1]}
              value={settingsForm.maintenanceTitle}
              onChange={(value) => setSettingsForm((prev) => ({ ...prev, maintenanceTitle: value }))}
              placeholder="Maintenance title"
            />
            <LabeledInput
              label={operationFieldMeta.maintenanceETC[0]}
              description={operationFieldMeta.maintenanceETC[1]}
              value={settingsForm.maintenanceETC}
              onChange={(value) => setSettingsForm((prev) => ({ ...prev, maintenanceETC: value }))}
              placeholder="Maintenance ETA"
            />
            <LabeledInput
              label={operationFieldMeta.maintenanceMessage[0]}
              description={operationFieldMeta.maintenanceMessage[1]}
              value={settingsForm.maintenanceMessage}
              onChange={(value) => setSettingsForm((prev) => ({ ...prev, maintenanceMessage: value }))}
              placeholder="Maintenance message"
              textarea
            />

            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  "baseDeliveryFee",
                  "pricePerKm",
                  "baseDistanceKm",
                  "serviceFeePercent",
                  "reservationServiceFee",
                  "driverCommissionPercent",
                  "adminEarnings",
                  "updateVersion",
                  "updateLink",
                ] as const
              ).map((field) => (
                <LabeledInput
                  key={field}
                  label={operationFieldMeta[field][0]}
                  description={operationFieldMeta[field][1]}
                  value={settingsForm[field]}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, [field]: value }))}
                  placeholder={operationFieldMeta[field][0]}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setSettingsForm((prev) => ({ ...prev, botEnabled: !prev.botEnabled }))}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                settingsForm.botEnabled
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-400/30 bg-red-500/10 text-red-300"
              }`}
            >
              Rimo Bot: {settingsForm.botEnabled ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() =>
                setSettingsForm((prev) => ({ ...prev, updateAvailable: !prev.updateAvailable }))
              }
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                settingsForm.updateAvailable
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-400/30 bg-red-500/10 text-red-300"
              }`}
            >
              App Update: {settingsForm.updateAvailable ? "READY" : "OFF"}
            </button>
          </div>

          <button
            type="button"
            onClick={saveOps}
            disabled={savingOps}
            className="mt-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {savingOps ? "Saving..." : "Save Operational Config"}
          </button>
        </CTOSectionShell>

        <CTOSectionShell
          title="Contact, Support, and Zone Snapshot"
          subtitle="Public support identity and operational map context."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={contactForm.email}
              onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Support email"
              className={inputClass}
            />
            <input
              value={contactForm.wa}
              onChange={(event) => setContactForm((prev) => ({ ...prev, wa: event.target.value }))}
              placeholder="WhatsApp"
              className={inputClass}
            />
            <input
              value={contactForm.ig}
              onChange={(event) => setContactForm((prev) => ({ ...prev, ig: event.target.value }))}
              placeholder="Instagram"
              className={inputClass}
            />
            <input
              value={contactForm.fb}
              onChange={(event) => setContactForm((prev) => ({ ...prev, fb: event.target.value }))}
              placeholder="Facebook"
              className={inputClass}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-cyan-500/14 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">support desk</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Status ini dipakai untuk menandai apakah support desk utama sedang aktif menerima tiket.
              </p>
              <button
                type="button"
                onClick={() => setSupportForm((prev) => ({ ...prev, isOnline: !prev.isOnline }))}
                className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  supportForm.isOnline
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-400/30 bg-red-500/10 text-red-300"
                }`}
              >
                {supportForm.isOnline ? "Support Online" : "Support Offline"}
              </button>
              <textarea
                value={supportForm.reason}
                onChange={(event) => setSupportForm((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="Support status reason"
                rows={3}
                className="mt-3 w-full rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-3 text-white"
              />
              <button
                type="button"
                onClick={saveSupportState}
                disabled={savingSupport}
                className="mt-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingSupport ? "Saving..." : "Save Support Status"}
              </button>
            </div>

            <div className="rounded-2xl border border-cyan-500/14 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">zone intelligence</p>
              <div className="mt-3 space-y-2">
                <div>Main center: {zoneCenter.lat}, {zoneCenter.lng}</div>
                <div>Primary zone points: {primaryZone.length}</div>
                <div>Macro zones: {macroZones.length}</div>
                <div>Locked roles: {configSnapshot.lockedRoles.join(", ") || "-"}</div>
              </div>
            </div>
          </div>
        </CTOSectionShell>
      </div>

      <CTOSectionShell
        title="Operational Area Editor"
        subtitle="Edit area ekspansi atau pengurangan zona operasional dengan verifikasi password CTO."
      >
        <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveDrawMode("center")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  activeDrawMode === "center"
                    ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-300"
                    : "border-cyan-500/20 bg-slate-950/60 text-slate-300"
                }`}
              >
                Edit Center
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawMode("primary")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  activeDrawMode === "primary"
                    ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-300"
                    : "border-cyan-500/20 bg-slate-950/60 text-slate-300"
                }`}
              >
                Draw Primary Zone
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawMode("macro")}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  activeDrawMode === "macro"
                    ? "border-amber-300/40 bg-amber-500/10 text-amber-300"
                    : "border-cyan-500/20 bg-slate-950/60 text-slate-300"
                }`}
              >
                Draw Macro Zone
              </button>
            </div>

            <CTOZoneEditorMap
              center={zoneCenter}
              primaryZone={primaryZone}
              macroZones={macroZones}
              activeMode={activeDrawMode}
              activeMacroIndex={activeMacroIndex}
              onAddPrimaryPoint={addPrimaryPoint}
              onAddMacroPoint={addMacroPoint}
              onSetCenter={(point) =>
                setZoneForm((prev) => ({ ...prev, centerLat: String(point.lat), centerLng: String(point.lng) }))
              }
              onMovePrimaryPoint={updatePrimaryPoint}
              onMoveMacroPoint={updateMacroPoint}
              onRemovePrimaryPoint={removePrimaryPoint}
              onRemoveMacroPoint={removeMacroPoint}
            />
          </div>

          <div className="space-y-4 rounded-3xl border border-cyan-500/14 bg-slate-950/70 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">area safeguard</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Editor polygon operasional</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Klik peta untuk menaruh titik sesuai mode aktif. Marker bisa digeser untuk
                menyesuaikan lat-lng secara presisi. Penyimpanan tetap membutuhkan password CTO.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={zoneForm.centerLat}
                onChange={(event) => setZoneForm((prev) => ({ ...prev, centerLat: event.target.value }))}
                placeholder="Center latitude"
                className={inputClass}
              />
              <input
                value={zoneForm.centerLng}
                onChange={(event) => setZoneForm((prev) => ({ ...prev, centerLng: event.target.value }))}
                placeholder="Center longitude"
                className={inputClass}
              />
            </div>

            <div className="rounded-2xl border border-cyan-500/14 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">macro zones</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Tambahkan polygon baru untuk ekspansi lintas area.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMacroZone}
                  className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300"
                >
                  Add Zone
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {macroZones.length > 0 ? (
                  macroZones.map((zone, index) => (
                    <div
                      key={`macro-zone-card-${index}`}
                      className={`rounded-2xl border px-4 py-3 ${
                        index === activeMacroIndex
                          ? "border-amber-400/30 bg-amber-500/10"
                          : "border-cyan-500/10 bg-slate-950/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMacroIndex(index);
                            setActiveDrawMode("macro");
                          }}
                          className="text-left text-sm font-semibold text-white"
                        >
                          Macro Zone #{index + 1}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMacroZone(index)}
                          className="text-xs font-semibold text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{zone.path.length} titik polygon</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Belum ada macro zone.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/14 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                primary polygon coordinates
              </p>
              <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                {primaryZone.length > 0 ? (
                  primaryZone.map((point, index) => (
                    <div
                      key={`primary-coordinate-${index}`}
                      className="rounded-2xl border border-cyan-500/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300"
                    >
                      #{index + 1} {formatCoordinate(point)}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Belum ada titik primary zone.</p>
                )}
              </div>
            </div>

            <input
              type="password"
              value={zoneForm.password}
              onChange={(event) => setZoneForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Konfirmasi password CTO"
              className="rounded-2xl border border-amber-400/30 bg-slate-950/70 px-4 py-3 text-white"
            />

            {zoneError ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {zoneError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={saveZoneState}
              disabled={savingZone}
              className="rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {savingZone ? "Verifying & Saving..." : "Save Operational Area"}
            </button>

            <div className="grid gap-3">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                  generated primary zone payload
                </p>
                <textarea
                  value={generatedZoneJson}
                  readOnly
                  rows={8}
                  className="w-full rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-3 font-mono text-sm text-white"
                />
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-cyan-300/80">
                  generated macro zones payload
                </p>
                <textarea
                  value={generatedZonesJson}
                  readOnly
                  rows={8}
                  className="w-full rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-3 font-mono text-sm text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </CTOSectionShell>
    </div>
  );
}
