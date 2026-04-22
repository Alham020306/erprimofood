import { useEffect, useMemo, useState } from "react";
import {
  type BlueprintPhaseKey,
  provisionCLevelFoundationDocs,
  provisionCLevelPhaseBundle,
  purgeCLevelWorkingCollections,
  seedDatabaseBlueprintRegistry,
  subscribeBlueprintCollectionStatuses,
  updateBlueprintImplementationStatus,
} from "../services/databaseBlueprintRegistryService";

type CollectionField = {
  name: string;
  required?: boolean;
  note: string;
};

type CollectionSheet = {
  name: string;
  ownerRoles: string[];
  sourceOfTruth: "dbMain" | "direksi" | "Hybrid";
  decision: "KEEP" | "CACHE" | "NEW" | "HYBRID";
  freshness: "REALTIME" | "SNAPSHOT" | "MANUAL" | "HYBRID";
  costMode: "OPTIMAL" | "HEMAT" | "INVESTIGATIVE";
  priority: "NOW" | "NEXT" | "LATER";
  purpose: string;
  readBy: string[];
  writeBy: string[];
  fields: CollectionField[];
};

type SheetCategory = {
  key: string;
  label: string;
  summary: string;
  collections: CollectionSheet[];
};

type StrategyRule = {
  title: string;
  rule: string;
  impact: string;
};

const strategyRules: StrategyRule[] = [
  {
    title: "Tetap Di dbMain",
    rule: "Semua data operasional inti yang sedang berjalan tetap di `dbMain` dan tidak disentuh struktur utamanya.",
    impact: "Mengurangi risiko gangguan ke sistem utama yang masih dipakai.",
  },
  {
    title: "ERP Baca Cache Dulu",
    rule: "Dashboard `CEO`, `CFO`, `CMO`, `HR`, `Secretary`, dan sebagian `CTO` harus membaca ringkasan database `direksi` dulu.",
    impact: "Read Firestore turun dan halaman ERP lebih cepat dibuka.",
  },
  {
    title: "Realtime Hanya Untuk Data Hidup",
    rule: "Realtime dipakai hanya untuk queue approval, meeting aktif, alert, live board, map monitor, dan tugas aktif.",
    impact: "Collection yang jarang berubah tidak membuang read secara terus-menerus.",
  },
  {
    title: "Snapshot Untuk Ringkasan",
    rule: "Semua KPI, summary, ranking exposure, dan health board dibentuk sebagai snapshot/cache di database `direksi`.",
    impact: "ERP tidak perlu menghitung ulang dari raw collection besar tiap kali halaman dibuka.",
  },
  {
    title: "Drilldown Tetap Ada",
    rule: "Kalau user butuh investigasi, baru ambil detail dari raw source atau cache drilldown.",
    impact: "Tetap akurat seperti admin lama, tapi biaya read lebih terkontrol.",
  },
];

const categories: SheetCategory[] = [
  {
    key: "shared-core",
    label: "Shared Core",
    summary:
      "Fondasi lintas semua role: identitas direksi, approval, dokumen, meeting, audit, dan notifikasi internal.",
    collections: [
      {
        name: "direction_users",
        ownerRoles: ["CTO", "HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Master identitas direksi dan akses role ERP.",
        readBy: ["Auth", "Internal Users", "Router", "Meeting", "Approval"],
        writeBy: ["Register", "Internal User Management", "CTO Auth Control"],
        fields: [
          { name: "uid", required: true, note: "UID dari Firebase Auth." },
          { name: "email", required: true, note: "Email akun direksi." },
          { name: "fullName", required: true, note: "Nama lengkap." },
          { name: "primaryRole", required: true, note: "Role utama." },
          { name: "roles", required: true, note: "Array role tambahan." },
          { name: "isActive", required: true, note: "Status aktif." },
          { name: "isSuspended", required: true, note: "Flag suspend." },
          { name: "updatedAt", required: true, note: "Timestamp pembaruan." },
        ],
      },
      {
        name: "director_profiles",
        ownerRoles: ["HR", "Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Profil tambahan direksi, preferensi, tanda tangan, dan info administratif.",
        readBy: ["Secretary", "Profile", "Letters", "Board Pack"],
        writeBy: ["Profile Editor", "HR"],
        fields: [
          { name: "uid", required: true, note: "Relasi ke direction_users." },
          { name: "title", note: "Jabatan formal." },
          { name: "signatureImage", note: "Tanda tangan digital." },
          { name: "bio", note: "Info singkat." },
          { name: "updatedAt", required: true, note: "Pembaruan terakhir." },
        ],
      },
      {
        name: "director_roles",
        ownerRoles: ["CTO", "HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Definisi resmi role dan hirarki organisasi direksi.",
        readBy: ["Permissions", "Internal Users", "Future Delegation"],
        writeBy: ["CTO", "HR"],
        fields: [
          { name: "roleKey", required: true, note: "Kode role." },
          { name: "roleName", required: true, note: "Nama tampilan role." },
          { name: "hierarchyLevel", required: true, note: "Level hirarki." },
          { name: "canDelegate", note: "Flag boleh mendelegasikan." },
        ],
      },
      {
        name: "role_permissions",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Permission granular per role agar bukan hanya sidebar yang role-based.",
        readBy: ["CTO", "Guards", "Action Buttons"],
        writeBy: ["CTO"],
        fields: [
          { name: "roleKey", required: true, note: "Role yang diatur." },
          { name: "modules", required: true, note: "Object permission per modul." },
          { name: "updatedAt", required: true, note: "Timestamp pembaruan." },
        ],
      },
      {
        name: "approval_requests",
        ownerRoles: ["CEO", "Secretary", "CFO", "CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Header utama approval lintas role.",
        readBy: ["Approval Inbox", "CEO", "Secretary", "CFO", "CTO", "COO"],
        writeBy: ["Approval Composer", "Approval Inbox"],
        fields: [
          { name: "title", required: true, note: "Judul approval." },
          { name: "requestType", required: true, note: "Jenis request." },
          { name: "requestedByUid", required: true, note: "Pengaju." },
          { name: "targetRole", required: true, note: "Role tujuan." },
          { name: "status", required: true, note: "PENDING, APPROVED, REJECTED." },
          { name: "priority", required: true, note: "HIGH, MEDIUM, LOW." },
          { name: "attachments", note: "Lampiran." },
        ],
      },
      {
        name: "approval_activity_logs",
        ownerRoles: ["Secretary", "CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Log aksi untuk setiap approval.",
        readBy: ["Approval Detail", "Audit", "CEO"],
        writeBy: ["Approval Inbox", "Composer"],
        fields: [
          { name: "approvalId", required: true, note: "ID approval induk." },
          { name: "action", required: true, note: "Jenis aksi." },
          { name: "actorUid", required: true, note: "Pelaku." },
          { name: "note", note: "Catatan aksi." },
          { name: "createdAt", required: true, note: "Waktu aksi." },
        ],
      },
      {
        name: "director_documents",
        ownerRoles: ["Secretary", "CEO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Dokumen direksi dan lampiran workflow.",
        readBy: ["Approvals", "Letters", "Board Pack"],
        writeBy: ["Secretary", "Approval Composer"],
        fields: [
          { name: "title", required: true, note: "Judul dokumen." },
          { name: "fileUrl", required: true, note: "Lokasi file." },
          { name: "documentType", required: true, note: "Tipe dokumen." },
          { name: "uploadedByUid", required: true, note: "Pengunggah." },
          { name: "relatedApprovalId", note: "Relasi ke approval." },
        ],
      },
      {
        name: "notifications",
        ownerRoles: ["Secretary", "CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Notifikasi internal ERP untuk semua role direksi.",
        readBy: ["All roles", "Topbar", "Secretary Dashboard"],
        writeBy: ["Approvals", "Meetings", "Tasks", "System Alerts"],
        fields: [
          { name: "targetUid", note: "UID target jika spesifik user." },
          { name: "targetRole", required: true, note: "Role target." },
          { name: "message", required: true, note: "Isi notifikasi." },
          { name: "isRead", required: true, note: "Status baca." },
          { name: "createdAt", required: true, note: "Waktu notifikasi." },
        ],
      },
      {
        name: "audit_logs",
        ownerRoles: ["CTO", "CEO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Jejak aksi sensitif seluruh ERP.",
        readBy: ["CTO", "CEO", "Internal User Management"],
        writeBy: ["Management", "Config Control", "Approvals", "Meetings"],
        fields: [
          { name: "actorUid", required: true, note: "UID pelaku." },
          { name: "actorRole", required: true, note: "Role pelaku." },
          { name: "action", required: true, note: "Nama aksi." },
          { name: "entityType", required: true, note: "Collection / modul target." },
          { name: "entityId", required: true, note: "ID target." },
          { name: "createdAt", required: true, note: "Waktu audit." },
        ],
      },
    ],
  },
  {
    key: "ceo",
    label: "CEO Model",
    summary:
      "Collection yang dipakai CEO untuk overview strategis, task, risk, decision, dan board governance.",
    collections: [
      {
        name: "executive_overview",
        ownerRoles: ["CEO"],
        sourceOfTruth: "direksi",
        decision: "CACHE",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NOW",
        purpose: "Summary nasional agar CEO tidak baca raw operasional terus-menerus.",
        readBy: ["CEO Dashboard", "Topbar", "Future Home KPI"],
        writeBy: ["Sync job", "Manual refresh"],
        fields: [
          { name: "totalOrdersToday", required: true, note: "Order hari ini." },
          { name: "activeOrders", required: true, note: "Order aktif." },
          { name: "onlineDrivers", required: true, note: "Driver online." },
          { name: "openMerchants", required: true, note: "Merchant buka." },
          { name: "grossRevenue", required: true, note: "Revenue ringkas." },
          { name: "updatedAt", required: true, note: "Kapan cache dibuat." },
        ],
      },
      {
        name: "executive_tasks",
        ownerRoles: ["CEO", "Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Task board lintas direksi.",
        readBy: ["CEO Control Board", "Secretary", "Owner role"],
        writeBy: ["CEO", "Secretary"],
        fields: [
          { name: "title", required: true, note: "Judul task." },
          { name: "assignedToRole", required: true, note: "Owner role." },
          { name: "priority", required: true, note: "Prioritas." },
          { name: "status", required: true, note: "OPEN, IN_PROGRESS, DONE." },
          { name: "dueAt", note: "Batas waktu." },
        ],
      },
      {
        name: "risk_register",
        ownerRoles: ["CEO", "CFO", "CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Register risiko enterprise.",
        readBy: ["CEO", "CFO", "CTO", "Secretary"],
        writeBy: ["CEO", "Secretary"],
        fields: [
          { name: "category", required: true, note: "Kategori risiko." },
          { name: "title", required: true, note: "Nama risiko." },
          { name: "impact", required: true, note: "Skor dampak." },
          { name: "likelihood", required: true, note: "Skor kemungkinan." },
          { name: "ownerRole", required: true, note: "Owner mitigasi." },
          { name: "status", required: true, note: "OPEN, MITIGATED, CLOSED." },
        ],
      },
      {
        name: "decision_archives",
        ownerRoles: ["CEO", "Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Arsip keputusan direksi yang final.",
        readBy: ["CEO", "Secretary", "Board Pack"],
        writeBy: ["Secretary", "CEO"],
        fields: [
          { name: "title", required: true, note: "Judul keputusan." },
          { name: "decisionDate", required: true, note: "Tanggal keputusan." },
          { name: "ownerRole", required: true, note: "Role penanggung jawab." },
          { name: "summary", required: true, note: "Ringkasan keputusan." },
        ],
      },
      {
        name: "board_packs",
        ownerRoles: ["Secretary", "CEO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Material rapat direksi / board.",
        readBy: ["CEO", "Secretary"],
        writeBy: ["Secretary"],
        fields: [
          { name: "title", required: true, note: "Judul board pack." },
          { name: "meetingId", note: "Relasi ke meeting." },
          { name: "documentIds", required: true, note: "Daftar dokumen." },
          { name: "createdAt", required: true, note: "Waktu dibuat." },
        ],
      },
    ],
  },
  {
    key: "coo",
    label: "COO Model",
    summary:
      "Data untuk COO harus tetap akurat seperti admin lama, tapi read utamanya diarahkan ke summary dan drilldown cache.",
    collections: [
      {
        name: "coo_operational_summary",
        ownerRoles: ["COO"],
        sourceOfTruth: "direksi",
        decision: "CACHE",
        freshness: "HYBRID",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Ringkasan operasional cepat untuk dashboard dan live board ringan.",
        readBy: ["COO Dashboard", "COO Live Board", "CEO"],
        writeBy: ["Sync job"],
        fields: [
          { name: "totalMerchants", required: true, note: "Jumlah merchant." },
          { name: "activeDrivers", required: true, note: "Driver aktif." },
          { name: "activeOrders", required: true, note: "Order aktif." },
          { name: "readyOrders", required: true, note: "Order READY." },
          { name: "customerCancels", required: true, note: "Cancel customer." },
          { name: "updatedAt", required: true, note: "Timestamp snapshot." },
        ],
      },
      {
        name: "merchant_health_cache",
        ownerRoles: ["COO", "CTO"],
        sourceOfTruth: "Hybrid",
        decision: "CACHE",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Detail merchant yang sering dipakai operasional tanpa scan `orders/menus/reviews` penuh.",
        readBy: ["COO Merchant Detail", "CTO Merchant Zones", "CEO Ops Insight"],
        writeBy: ["Sync job"],
        fields: [
          { name: "merchantId", required: true, note: "ID merchant." },
          { name: "completedOrders", required: true, note: "Order selesai." },
          { name: "cancelledOrders", required: true, note: "Order batal." },
          { name: "reviewScore", required: true, note: "Nilai review." },
          { name: "promoMenus", note: "Jumlah menu promo." },
        ],
      },
      {
        name: "driver_health_cache",
        ownerRoles: ["COO", "CTO", "CFO"],
        sourceOfTruth: "Hybrid",
        decision: "CACHE",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Detail performa driver untuk panel operasional dan finance exposure.",
        readBy: ["COO Driver Detail", "CTO Driver Monitor", "CFO Exposure"],
        writeBy: ["Sync job"],
        fields: [
          { name: "driverId", required: true, note: "UID driver." },
          { name: "completedTrips", required: true, note: "Trip selesai." },
          { name: "cancelledTrips", required: true, note: "Trip batal." },
          { name: "driverEarnings", required: true, note: "Pendapatan driver." },
          { name: "reviewScore", required: true, note: "Rata-rata review." },
        ],
      },
      {
        name: "ops_incidents",
        ownerRoles: ["COO", "Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Issue operasional yang perlu ditindaklanjuti.",
        readBy: ["COO", "CEO", "Secretary"],
        writeBy: ["COO", "CTO", "Secretary"],
        fields: [
          { name: "title", required: true, note: "Judul insiden." },
          { name: "severity", required: true, note: "LOW, MEDIUM, HIGH." },
          { name: "ownerRole", required: true, note: "Role penanggung jawab." },
          { name: "status", required: true, note: "OPEN, ACK, RESOLVED." },
        ],
      },
    ],
  },
  {
    key: "cfo",
    label: "CFO Model",
    summary:
      "Modul CFO harus akurat seperti admin revenue lama, tapi summary dibentuk di `direksi` agar tidak selalu hitung dari ledger mentah.",
    collections: [
      {
        name: "cfo_financial_summary",
        ownerRoles: ["CFO"],
        sourceOfTruth: "direksi",
        decision: "CACHE",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NOW",
        purpose: "Summary finansial harian / saat ini untuk dashboard CFO.",
        readBy: ["CFO Dashboard", "CEO"],
        writeBy: ["Sync job"],
        fields: [
          { name: "totalCashIn", required: true, note: "Kas masuk." },
          { name: "totalCashOut", required: true, note: "Kas keluar." },
          { name: "netCashflow", required: true, note: "Net cashflow." },
          { name: "totalUnpaidCommission", required: true, note: "Total komisi belum dibayar." },
          { name: "updatedAt", required: true, note: "Waktu cache." },
        ],
      },
      {
        name: "settlement_summary",
        ownerRoles: ["CFO"],
        sourceOfTruth: "Hybrid",
        decision: "CACHE",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Cache eksposur saldo dan komisi per entitas.",
        readBy: ["CFO Dashboard", "CFO Settlements"],
        writeBy: ["Sync job"],
        fields: [
          { name: "entityType", required: true, note: "RESTAURANT atau DRIVER." },
          { name: "entityId", required: true, note: "ID entitas." },
          { name: "balance", required: true, note: "Saldo berjalan." },
          { name: "totalUnpaidCommission", required: true, note: "Komisi belum dibayar." },
        ],
      },
      {
        name: "financial_reports",
        ownerRoles: ["CFO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Laporan finansial siap tampil dan siap diekspor.",
        readBy: ["CFO Reports", "CEO"],
        writeBy: ["Report generator", "Sync job"],
        fields: [
          { name: "periodKey", required: true, note: "Periode laporan." },
          { name: "cashflowSeries", required: true, note: "Series cashflow." },
          { name: "categoryBreakdown", required: true, note: "Breakdown kategori." },
          { name: "generatedAt", required: true, note: "Waktu generate." },
        ],
      },
      {
        name: "budget_requests",
        ownerRoles: ["CFO", "CEO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "LATER",
        purpose: "Workflow permintaan budget enterprise.",
        readBy: ["CFO", "CEO", "Approvals"],
        writeBy: ["CFO", "Divisions"],
        fields: [
          { name: "title", required: true, note: "Judul budget." },
          { name: "amount", required: true, note: "Nilai pengajuan." },
          { name: "ownerRole", required: true, note: "Role pengaju." },
          { name: "status", required: true, note: "Status approval." },
        ],
      },
      {
        name: "expense_requests",
        ownerRoles: ["CFO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "LATER",
        purpose: "Workflow permintaan expense.",
        readBy: ["CFO", "Approvals"],
        writeBy: ["CFO", "Divisions"],
        fields: [
          { name: "title", required: true, note: "Judul expense." },
          { name: "amount", required: true, note: "Nilai expense." },
          { name: "category", required: true, note: "Kategori." },
          { name: "status", required: true, note: "Status." },
        ],
      },
    ],
  },
  {
    key: "cto",
    label: "CTO Model",
    summary:
      "CTO tetap paling hybrid. Dia perlu live signal dari sistem utama, tapi dashboard utamanya harus semakin bertumpu pada summary `direksi` agar hemat read.",
    collections: [
      {
        name: "cto_system_summary",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "CACHE",
        freshness: "HYBRID",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Ringkasan kesehatan sistem utama dan sistem direksi.",
        readBy: ["CTO Dashboard", "CEO"],
        writeBy: ["Sync job", "System control actions"],
        fields: [
          { name: "maintenanceMode", required: true, note: "Mode maintenance." },
          { name: "supportOnline", required: true, note: "Status support." },
          { name: "unresolvedAlerts", required: true, note: "Alert belum selesai." },
          { name: "latestBackupStatus", required: true, note: "Status backup terakhir." },
          { name: "updatedAt", required: true, note: "Timestamp cache." },
        ],
      },
      {
        name: "system_logs",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "INVESTIGATIVE",
        priority: "NOW",
        purpose: "Log teknis dan event operasional.",
        readBy: ["CTO Logs"],
        writeBy: ["CTO services", "Future integrations"],
        fields: [
          { name: "module", required: true, note: "Sumber log." },
          { name: "message", required: true, note: "Isi log." },
          { name: "severity", note: "Level log." },
          { name: "createdAt", required: true, note: "Timestamp." },
        ],
      },
      {
        name: "system_alerts",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Alert yang harus segera dilihat CTO.",
        readBy: ["CTO Alerts", "CTO Dashboard", "CEO"],
        writeBy: ["CTO services", "Future monitoring jobs"],
        fields: [
          { name: "title", required: true, note: "Judul alert." },
          { name: "severity", required: true, note: "INFO, WARN, ERROR, CRITICAL." },
          { name: "isResolved", required: true, note: "Sudah selesai atau belum." },
          { name: "module", required: true, note: "Sumber modul." },
        ],
      },
      {
        name: "system_errors",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "INVESTIGATIVE",
        priority: "NOW",
        purpose: "Agregasi error signature.",
        readBy: ["CTO Dashboard", "CTO Alerts"],
        writeBy: ["CTO services"],
        fields: [
          { name: "module", required: true, note: "Modul error." },
          { name: "count", required: true, note: "Jumlah kejadian." },
          { name: "lastSeenAt", required: true, note: "Terakhir terlihat." },
        ],
      },
      {
        name: "system_backups",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Riwayat backup database dan storage.",
        readBy: ["CTO Dashboard", "CTO Config"],
        writeBy: ["Manual backup", "Future backup job"],
        fields: [
          { name: "backupType", required: true, note: "AUTO atau MANUAL." },
          { name: "status", required: true, note: "SUCCESS, FAILED, PENDING." },
          { name: "scope", required: true, note: "MAIN_DB, C_LEVEL_DB, STORAGE, FULL." },
          { name: "createdAt", required: true, note: "Waktu backup." },
        ],
      },
      {
        name: "system_incidents",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Insiden teknis yang perlu lifecycle tersendiri.",
        readBy: ["CTO", "CEO"],
        writeBy: ["CTO"],
        fields: [
          { name: "title", required: true, note: "Judul incident." },
          { name: "severity", required: true, note: "Level severity." },
          { name: "status", required: true, note: "OPEN, ACK, RESOLVED." },
          { name: "ownerUid", note: "Engineer owner." },
        ],
      },
      {
        name: "sync_jobs",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Daftar job sinkronisasi cache ERP.",
        readBy: ["CTO", "Database Sheets"],
        writeBy: ["CTO", "Future job runner"],
        fields: [
          { name: "jobName", required: true, note: "Nama job." },
          { name: "targetCollection", required: true, note: "Cache target." },
          { name: "status", required: true, note: "IDLE, RUNNING, FAILED." },
          { name: "lastRunAt", note: "Terakhir jalan." },
        ],
      },
      {
        name: "sync_state",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "State freshness cache dan cursor sinkronisasi.",
        readBy: ["CTO", "Database Sheets"],
        writeBy: ["Sync jobs"],
        fields: [
          { name: "cacheKey", required: true, note: "Nama cache." },
          { name: "lastSyncedAt", required: true, note: "Waktu sinkron." },
          { name: "recordsProcessed", note: "Jumlah record." },
        ],
      },
      {
        name: "sync_failures",
        ownerRoles: ["CTO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "INVESTIGATIVE",
        priority: "LATER",
        purpose: "Riwayat error sinkronisasi.",
        readBy: ["CTO"],
        writeBy: ["Sync jobs"],
        fields: [
          { name: "jobName", required: true, note: "Job yang gagal." },
          { name: "reason", required: true, note: "Penyebab." },
          { name: "createdAt", required: true, note: "Waktu gagal." },
        ],
      },
    ],
  },
  {
    key: "cmo",
    label: "CMO Model",
    summary:
      "CMO lebih hemat bila membaca summary dan metrics, bukan banners/menus/categories mentah terus-menerus.",
    collections: [
      {
        name: "cmo_growth_summary",
        ownerRoles: ["CMO"],
        sourceOfTruth: "direksi",
        decision: "CACHE",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Summary growth dan merchandising utama.",
        readBy: ["CMO Dashboard", "CEO"],
        writeBy: ["Sync job"],
        fields: [
          { name: "totalMenus", required: true, note: "Jumlah menu." },
          { name: "promoMenus", required: true, note: "Jumlah promo." },
          { name: "trendingMenus", required: true, note: "Jumlah trending." },
          { name: "categories", required: true, note: "Jumlah kategori." },
          { name: "updatedAt", required: true, note: "Kapan disinkronkan." },
        ],
      },
      {
        name: "campaigns",
        ownerRoles: ["CMO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Master campaign marketing.",
        readBy: ["CMO Campaigns", "CEO"],
        writeBy: ["CMO"],
        fields: [
          { name: "title", required: true, note: "Nama campaign." },
          { name: "status", required: true, note: "DRAFT, ACTIVE, CLOSED." },
          { name: "budget", note: "Nilai budget." },
          { name: "targetType", note: "Target campaign." },
        ],
      },
      {
        name: "campaign_metrics",
        ownerRoles: ["CMO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "SNAPSHOT",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Metrics hasil campaign dan ROI.",
        readBy: ["CMO Dashboard", "CMO Campaigns", "CEO"],
        writeBy: ["Sync job", "Campaign reporting"],
        fields: [
          { name: "campaignId", required: true, note: "Relasi ke campaign." },
          { name: "impressions", note: "Impresi." },
          { name: "ordersDriven", note: "Order terdorong." },
          { name: "roi", note: "Rasio ROI." },
        ],
      },
    ],
  },
  {
    key: "hr",
    label: "HR Model",
    summary:
      "HR tidak perlu realtime berat. Fokusnya profile, people, recruitment, dan performance cycle yang hemat read.",
    collections: [
      {
        name: "employee_records",
        ownerRoles: ["HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Master data pegawai internal non-direksi dan catatan SDM.",
        readBy: ["HR Employees", "HR Dashboard"],
        writeBy: ["HR"],
        fields: [
          { name: "employeeId", required: true, note: "ID pegawai." },
          { name: "fullName", required: true, note: "Nama pegawai." },
          { name: "department", required: true, note: "Departemen." },
          { name: "employmentStatus", required: true, note: "ACTIVE, LEAVE, EXIT." },
        ],
      },
      {
        name: "org_structure",
        ownerRoles: ["HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Struktur organisasi formal.",
        readBy: ["HR", "CEO"],
        writeBy: ["HR"],
        fields: [
          { name: "unitName", required: true, note: "Nama unit." },
          { name: "headRole", note: "Role kepala unit." },
          { name: "reportingTo", note: "Atasan." },
        ],
      },
      {
        name: "recruitment_requests",
        ownerRoles: ["HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Permintaan kebutuhan rekrutmen.",
        readBy: ["HR Recruitment", "CEO"],
        writeBy: ["HR"],
        fields: [
          { name: "title", required: true, note: "Judul kebutuhan." },
          { name: "department", required: true, note: "Divisi." },
          { name: "headcount", required: true, note: "Jumlah kebutuhan." },
          { name: "status", required: true, note: "OPEN, PROCESSING, CLOSED." },
        ],
      },
      {
        name: "performance_cycles",
        ownerRoles: ["HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "LATER",
        purpose: "Siklus performance review.",
        readBy: ["HR", "CEO"],
        writeBy: ["HR"],
        fields: [
          { name: "cycleName", required: true, note: "Nama cycle." },
          { name: "startDate", required: true, note: "Mulai." },
          { name: "endDate", required: true, note: "Selesai." },
        ],
      },
      {
        name: "performance_reviews",
        ownerRoles: ["HR"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "LATER",
        purpose: "Review performa pegawai.",
        readBy: ["HR"],
        writeBy: ["HR", "Managers"],
        fields: [
          { name: "employeeId", required: true, note: "Pegawai target." },
          { name: "cycleId", required: true, note: "Cycle review." },
          { name: "score", note: "Skor review." },
          { name: "summary", note: "Ringkasan review." },
        ],
      },
    ],
  },
  {
    key: "secretary",
    label: "Secretary Model",
    summary:
      "Secretary jadi pusat governance administratif: letters, meeting, disposition, minutes, board material, dan acknowledgement.",
    collections: [
      {
        name: "meeting_requests",
        ownerRoles: ["Secretary", "CEO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Permintaan rapat dari direksi.",
        readBy: ["Secretary", "Meetings"],
        writeBy: ["All roles", "Secretary"],
        fields: [
          { name: "title", required: true, note: "Judul permintaan." },
          { name: "requestedByUid", required: true, note: "Pengaju." },
          { name: "requestedByRole", required: true, note: "Role pengaju." },
          { name: "status", required: true, note: "OPEN, SCHEDULED, REJECTED." },
        ],
      },
      {
        name: "meeting_agendas",
        ownerRoles: ["Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Agenda rapat resmi.",
        readBy: ["Secretary", "All roles"],
        writeBy: ["Secretary"],
        fields: [
          { name: "title", required: true, note: "Nama rapat." },
          { name: "meetingDate", required: true, note: "Tanggal rapat." },
          { name: "participants", required: true, note: "Peserta." },
          { name: "status", required: true, note: "SCHEDULED, DONE, CANCELLED." },
        ],
      },
      {
        name: "meeting_action_items",
        ownerRoles: ["Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Tindak lanjut rapat.",
        readBy: ["Secretary", "Owner role", "CEO"],
        writeBy: ["Secretary"],
        fields: [
          { name: "title", required: true, note: "Nama action item." },
          { name: "assignedToRole", required: true, note: "Role owner." },
          { name: "status", required: true, note: "OPEN, IN_PROGRESS, DONE." },
          { name: "dueDate", note: "Batas waktu." },
        ],
      },
      {
        name: "meeting_minutes",
        ownerRoles: ["Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "MANUAL",
        costMode: "HEMAT",
        priority: "NEXT",
        purpose: "Notulen rapat resmi.",
        readBy: ["Secretary", "CEO", "Participants"],
        writeBy: ["Secretary"],
        fields: [
          { name: "agendaId", required: true, note: "Relasi agenda." },
          { name: "summary", required: true, note: "Ringkasan notulen." },
          { name: "decisions", note: "Keputusan penting." },
        ],
      },
      {
        name: "letters",
        ownerRoles: ["Secretary", "CEO"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NOW",
        purpose: "Surat dan memo resmi.",
        readBy: ["Secretary", "CEO"],
        writeBy: ["Secretary"],
        fields: [
          { name: "subject", required: true, note: "Subjek." },
          { name: "letterType", required: true, note: "Jenis surat." },
          { name: "classification", required: true, note: "Klasifikasi." },
          { name: "status", required: true, note: "DRAFT, SUBMITTED, APPROVED." },
        ],
      },
      {
        name: "dispositions",
        ownerRoles: ["Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "NEXT",
        purpose: "Disposisi surat atau instruksi administratif.",
        readBy: ["Secretary", "CEO"],
        writeBy: ["Secretary"],
        fields: [
          { name: "letterId", required: true, note: "Relasi surat." },
          { name: "targetRole", required: true, note: "Role tujuan." },
          { name: "instruction", required: true, note: "Instruksi disposisi." },
          { name: "status", required: true, note: "OPEN, ACK, DONE." },
        ],
      },
      {
        name: "acknowledgements",
        ownerRoles: ["Secretary"],
        sourceOfTruth: "direksi",
        decision: "NEW",
        freshness: "REALTIME",
        costMode: "OPTIMAL",
        priority: "LATER",
        purpose: "Tanda baca / acknowledge dokumen atau keputusan.",
        readBy: ["Secretary", "CEO"],
        writeBy: ["All roles"],
        fields: [
          { name: "targetUid", required: true, note: "User target." },
          { name: "documentId", required: true, note: "Dokumen terkait." },
          { name: "acknowledgedAt", note: "Waktu acknowledge." },
        ],
      },
    ],
  },
];

const phaseBundles: Array<{
  key: BlueprintPhaseKey;
  label: string;
  description: string;
}> = [
  {
    key: "shared-core",
    label: "Provision Shared Core",
    description: "Menyiapkan role registry, baseline permission, dan profile template.",
  },
  {
    key: "secretary-core",
    label: "Provision Secretary Core",
    description: "Menyiapkan template minutes, dispositions, dan acknowledgements.",
  },
  {
    key: "approval-core",
    label: "Provision Approval Core",
    description: "Menyiapkan template approval, activity log, document, dan notification.",
  },
  {
    key: "executive-core",
    label: "Provision Executive Core",
    description: "Menyiapkan template task, risk, decision archive, dan board pack.",
  },
  {
    key: "cto-core",
    label: "Provision CTO Core",
    description: "Menyiapkan template observability, alert, backup, incident, dan sync job.",
  },
  {
    key: "summary-core",
    label: "Provision Summary Core",
    description: "Menyiapkan template cache dan summary lintas divisi untuk rebuild.",
  },
];

const decisionStyle: Record<CollectionSheet["decision"], string> = {
  KEEP: "bg-blue-100 text-blue-700",
  CACHE: "bg-emerald-100 text-emerald-700",
  NEW: "bg-violet-100 text-violet-700",
  HYBRID: "bg-amber-100 text-amber-700",
};

const freshnessStyle: Record<CollectionSheet["freshness"], string> = {
  REALTIME: "bg-rose-100 text-rose-700",
  SNAPSHOT: "bg-slate-100 text-slate-700",
  MANUAL: "bg-orange-100 text-orange-700",
  HYBRID: "bg-indigo-100 text-indigo-700",
};

const costStyle: Record<CollectionSheet["costMode"], string> = {
  OPTIMAL: "bg-emerald-100 text-emerald-700",
  HEMAT: "bg-blue-100 text-blue-700",
  INVESTIGATIVE: "bg-amber-100 text-amber-700",
};

const priorityStyle: Record<CollectionSheet["priority"], string> = {
  NOW: "bg-emerald-100 text-emerald-700",
  NEXT: "bg-amber-100 text-amber-700",
  LATER: "bg-slate-100 text-slate-700",
};

export default function SecretaryDatabaseSheetsPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0].key);
  const [statusMap, setStatusMap] = useState<Record<string, any>>({});
  const [seedState, setSeedState] = useState<{
    status: "idle" | "running" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "",
  });
  const category =
    categories.find((item) => item.key === activeCategory) || categories[0];

  useEffect(() => {
    const unsubscribe = subscribeBlueprintCollectionStatuses(activeCategory, (docs) => {
      const next: Record<string, any> = {};
      docs.forEach((item) => {
        next[item.id] = item;
      });
      setStatusMap(next);
    });

    return () => unsubscribe();
  }, [activeCategory]);

  const handleSeed = async (scope: "all" | "category") => {
    setSeedState({
      status: "running",
      message:
        scope === "all"
          ? "Menyimpan seluruh blueprint ke registry Firestore..."
          : `Menyimpan blueprint ${category.label} ke registry Firestore...`,
    });

    try {
      const result = await seedDatabaseBlueprintRegistry(categories, {
        scope,
        targetCategoryKey: scope === "category" ? category.key : undefined,
      });

      setSeedState({
        status: "success",
        message: `Berhasil menyimpan ${result.collectionCount} collection blueprint dalam ${result.categoryCount} kategori ke registry direksi.`,
      });
    } catch (error: any) {
      setSeedState({
        status: "error",
        message: error?.message || "Gagal menyimpan blueprint ke registry Firestore.",
      });
    }
  };

  const handleProvisionFoundation = async () => {
    setSeedState({
      status: "running",
      message: "Membuat singleton docs awal untuk summary dan sync state direksi...",
    });

    try {
      const result = await provisionCLevelFoundationDocs();
      setSeedState({
        status: "success",
        message: `Berhasil menyiapkan ${result.documentCount} dokumen fondasi direksi.`,
      });
    } catch (error: any) {
      setSeedState({
        status: "error",
        message: error?.message || "Gagal menyiapkan dokumen fondasi direksi.",
      });
    }
  };

  const handleResetWorkingCollections = async () => {
    setSeedState({
      status: "running",
      message: "Mengosongkan koleksi kerja direksi yang aman direset...",
    });

    try {
      const result = await purgeCLevelWorkingCollections();
      setSeedState({
        status: "success",
        message: `Berhasil mengosongkan ${result.deletedDocCount} dokumen dari ${result.collectionCount} kelompok koleksi kerja direksi.`,
      });
    } catch (error: any) {
      setSeedState({
        status: "error",
        message: error?.message || "Gagal mengosongkan koleksi kerja direksi.",
      });
    }
  };

  const handlePhaseProvision = async (phase: BlueprintPhaseKey, label: string) => {
    setSeedState({
      status: "running",
      message: `Menyiapkan ${label.toLowerCase()}...`,
    });

    try {
      const result = await provisionCLevelPhaseBundle(phase);
      setSeedState({
        status: "success",
        message: `${label} berhasil menyiapkan ${result.documentCount} dokumen starter.`,
      });
    } catch (error: any) {
      setSeedState({
        status: "error",
        message: error?.message || `${label} gagal diprovision.`,
      });
    }
  };


  const handleStageUpdate = async (
    collectionName: string,
    stage: "PLANNED" | "SEEDED" | "COLLECTION_READY" | "SERVICE_READY" | "UI_READY" | "SYNC_READY"
  ) => {
    setSeedState({
      status: "running",
      message: `Memperbarui status ${collectionName} ke ${stage}...`,
    });

    try {
      await updateBlueprintImplementationStatus(activeCategory, collectionName, stage);
      setSeedState({
        status: "success",
        message: `Status ${collectionName} berhasil diubah ke ${stage}.`,
      });
    } catch (error: any) {
      setSeedState({
        status: "error",
        message: error?.message || `Gagal memperbarui status ${collectionName}.`,
      });
    }
  };

  const summaryStats = useMemo(() => {
    const all = categories.flatMap((item) => item.collections);
    return {
      totalCollections: all.length,
      realtimeCollections: all.filter((item) => item.freshness === "REALTIME").length,
      cacheCollections: all.filter((item) => item.decision === "CACHE").length,
      keepHybridCollections: all.filter((item) =>
        ["KEEP", "HYBRID"].includes(item.decision)
      ).length,
    };
  }, []);

  const stageStyle: Record<string, string> = {
    PLANNED: "bg-slate-100 text-slate-700",
    SEEDED: "bg-blue-100 text-blue-700",
    COLLECTION_READY: "bg-emerald-100 text-emerald-700",
    SERVICE_READY: "bg-violet-100 text-violet-700",
    UI_READY: "bg-amber-100 text-amber-700",
    SYNC_READY: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
              Rimo Food ERP Blueprint
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Complete Database Sheets
            </h1>
            <p className="mt-3 max-w-4xl text-sm text-slate-600">
              Model lengkap arsitektur `direksi` untuk ERP. Sheet ini membedakan
              mana data yang harus tetap hidup, mana yang cukup disnapshot, mana
              yang sengaja dihemat, dan mana yang tetap hybrid dengan `dbMain`
              tanpa mengganggu operasi utama.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
                Collections
              </p>
              <p className="mt-2 text-2xl font-black">{summaryStats.totalCollections}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-rose-700">
              <p className="text-[11px] font-black uppercase tracking-[0.18em]">
                Realtime
              </p>
              <p className="mt-2 text-2xl font-black">{summaryStats.realtimeCollections}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-700">
              <p className="text-[11px] font-black uppercase tracking-[0.18em]">
                Cache
              </p>
              <p className="mt-2 text-2xl font-black">{summaryStats.cacheCollections}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 px-4 py-4 text-blue-700">
              <p className="text-[11px] font-black uppercase tracking-[0.18em]">
                Keep / Hybrid
              </p>
              <p className="mt-2 text-2xl font-black">{summaryStats.keepHybridCollections}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-slate-900">
              Seed, Reset, dan Provision direksi
            </p>
            <p className="mt-1 text-sm text-slate-600">
              `Seed` menyimpan blueprint ke registry. `Provision Foundation`
              membuat dokumen singleton awal yang memang aman disiapkan. `Reset
              Working Collections` mengosongkan koleksi kerja `direksi`
              terpilih tanpa menyentuh `direction_users`, `database_blueprints`,
              atau `dbMain`.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Catatan: Firestore tidak benar-benar membuat collection kosong.
              Collection baru akan terlihat saat sudah punya dokumen pertama.
              Karena itu tombol provision hanya membuat doc awal untuk model
              singleton seperti summary dan sync state.
            </p>
            {seedState.message ? (
              <p
                className={`mt-3 text-sm ${
                  seedState.status === "error"
                    ? "text-rose-600"
                    : seedState.status === "success"
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {seedState.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleProvisionFoundation}
              disabled={seedState.status === "running"}
              className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Provision Foundation
            </button>
            <button
              type="button"
              onClick={() => handleSeed("category")}
              disabled={seedState.status === "running"}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Seed {category.label}
            </button>
            <button
              type="button"
              onClick={() => handleSeed("all")}
              disabled={seedState.status === "running"}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Seed Semua Blueprint
            </button>
            <button
              type="button"
              onClick={handleResetWorkingCollections}
              disabled={seedState.status === "running"}
              className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset Working Collections
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {strategyRules.map((item) => (
          <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              {item.title}
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">{item.rule}</p>
            <p className="mt-3 text-xs text-slate-500">{item.impact}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">
            Build Phases
          </p>
          <h2 className="text-2xl font-black text-slate-900">
            Provision Per Domain
          </h2>
          <p className="max-w-4xl text-sm text-slate-600">
            Tombol ini menyiapkan dokumen starter per domain build ulang ERP.
            Gunakan setelah `Seed Semua Blueprint` dan sebelum mulai wiring
            service atau UI per modul.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {phaseBundles.map((phase) => (
            <div
              key={phase.key}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-black text-slate-900">{phase.label}</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                {phase.description}
              </p>
              <button
                type="button"
                onClick={() => handlePhaseProvision(phase.key, phase.label)}
                disabled={seedState.status === "running"}
                className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phase.label}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveCategory(item.key)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                item.key === category.key
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="text-xs font-black uppercase tracking-[0.18em]">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">{category.label}</h2>
        <p className="mt-2 max-w-4xl text-sm text-slate-600">{category.summary}</p>
      </section>

      <div className="space-y-5">
        {category.collections.map((sheet) => (
          <section
            key={sheet.name}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            {(() => {
              const persisted = statusMap[sheet.name]?.implementationStatus;
              const stage = persisted?.stage || "PLANNED";

              return (
                <>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black text-slate-900">{sheet.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${priorityStyle[sheet.priority]}`}>
                    {sheet.priority}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${decisionStyle[sheet.decision]}`}>
                    {sheet.decision}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${freshnessStyle[sheet.freshness]}`}>
                    {sheet.freshness}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${costStyle[sheet.costMode]}`}>
                    {sheet.costMode}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${stageStyle[stage] || stageStyle.PLANNED}`}>
                    {stage.split("_").join(" ")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{sheet.purpose}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:w-[540px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Source Of Truth
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{sheet.sourceOfTruth}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Owner Roles
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sheet.ownerRoles.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Read By
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sheet.readBy.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Write By
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sheet.writeBy.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Implementation Tracker
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ubah status implementasi collection ini setelah proses seed,
                    pembuatan service, UI, dan sync selesai.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "PLANNED",
                    "SEEDED",
                    "COLLECTION_READY",
                    "SERVICE_READY",
                    "UI_READY",
                    "SYNC_READY",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        handleStageUpdate(
                          sheet.name,
                          item as
                            | "PLANNED"
                            | "SEEDED"
                            | "COLLECTION_READY"
                            | "SERVICE_READY"
                            | "UI_READY"
                            | "SYNC_READY"
                        )
                      }
                      className={`rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition ${
                        stage === item
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.split("_").join(" ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Field
                    </th>
                    <th className="pb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Type
                    </th>
                    <th className="pb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheet.fields.map((field) => (
                    <tr key={field.name}>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">{field.name}</span>
                          {field.required ? (
                            <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
                              required
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-sm font-medium text-slate-500">
                        {field.required ? "Core field" : "Optional / support"}
                      </td>
                      <td className="py-4 text-sm text-slate-600">{field.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                </>
              );
            })()}
          </section>
        ))}
      </div>
    </div>
  );
}

