import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { dbCLevel, DIREKSI_DATABASE_NAME } from "../../../core/firebase/firebaseCLevel";

type SerializableField = {
  name: string;
  required?: boolean;
  note: string;
};

type SerializableSheet = {
  name: string;
  ownerRoles: string[];
  sourceOfTruth: string;
  decision: string;
  freshness: string;
  costMode: string;
  priority: string;
  purpose: string;
  readBy: string[];
  writeBy: string[];
  fields: SerializableField[];
};

type SerializableCategory = {
  key: string;
  label: string;
  summary: string;
  collections: SerializableSheet[];
};

export type BlueprintPhaseKey =
  | "shared-core"
  | "secretary-core"
  | "approval-core"
  | "executive-core"
  | "cto-core"
  | "summary-core";

export const seedDatabaseBlueprintRegistry = async (
  categories: SerializableCategory[],
  options?: { scope?: "all" | "category"; targetCategoryKey?: string }
) => {
  const scope = options?.scope || "all";
  const targetCategoryKey = options?.targetCategoryKey;

  const targetCategories =
    scope === "category" && targetCategoryKey
      ? categories.filter((item) => item.key === targetCategoryKey)
      : categories;

  const batch = writeBatch(dbCLevel);
  const now = Date.now();

  const metaRef = doc(dbCLevel, "database_blueprint_meta", "current");
  batch.set(
    metaRef,
    {
      version: "v1",
      databaseName: DIREKSI_DATABASE_NAME,
      scope,
      targetCategoryKey: targetCategoryKey || null,
      categoryCount: targetCategories.length,
      collectionCount: targetCategories.reduce(
        (sum, item) => sum + item.collections.length,
        0
      ),
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );

  targetCategories.forEach((category) => {
    const categoryRef = doc(dbCLevel, "database_blueprints", category.key);
    batch.set(
      categoryRef,
      {
        key: category.key,
        label: category.label,
        summary: category.summary,
        collectionCount: category.collections.length,
        updatedAt: now,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    category.collections.forEach((item) => {
      const collectionRef = doc(
        collection(dbCLevel, "database_blueprints", category.key, "collections"),
        item.name
      );

      batch.set(
        collectionRef,
        {
          categoryKey: category.key,
          label: item.name,
          ownerRoles: item.ownerRoles,
          sourceOfTruth: item.sourceOfTruth,
          decision: item.decision,
          freshness: item.freshness,
          costMode: item.costMode,
          priority: item.priority,
          purpose: item.purpose,
          readBy: item.readBy,
          writeBy: item.writeBy,
          fields: item.fields,
          implementationStatus: {
            stage: "SEEDED",
            seededAt: now,
            collectionReady: false,
            serviceReady: false,
            uiReady: false,
            syncReady: false,
            updatedAt: now,
          },
          updatedAt: now,
          updatedAtServer: serverTimestamp(),
        },
        { merge: true }
      );
    });
  });

  await batch.commit();

  return {
    categoryCount: targetCategories.length,
    collectionCount: targetCategories.reduce(
      (sum, item) => sum + item.collections.length,
      0
    ),
  };
};

export const subscribeBlueprintCollectionStatuses = (
  categoryKey: string,
  callback: (docs: any[]) => void
) => {
  return onSnapshot(
    collection(dbCLevel, "database_blueprints", categoryKey, "collections"),
    (snap) => {
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    }
  );
};

export const updateBlueprintImplementationStatus = async (
  categoryKey: string,
  collectionName: string,
  stage: "PLANNED" | "SEEDED" | "COLLECTION_READY" | "SERVICE_READY" | "UI_READY" | "SYNC_READY"
) => {
  const stageMatrix = {
    PLANNED: {
      collectionReady: false,
      serviceReady: false,
      uiReady: false,
      syncReady: false,
    },
    SEEDED: {
      collectionReady: false,
      serviceReady: false,
      uiReady: false,
      syncReady: false,
    },
    COLLECTION_READY: {
      collectionReady: true,
      serviceReady: false,
      uiReady: false,
      syncReady: false,
    },
    SERVICE_READY: {
      collectionReady: true,
      serviceReady: true,
      uiReady: false,
      syncReady: false,
    },
    UI_READY: {
      collectionReady: true,
      serviceReady: true,
      uiReady: true,
      syncReady: false,
    },
    SYNC_READY: {
      collectionReady: true,
      serviceReady: true,
      uiReady: true,
      syncReady: true,
    },
  };

  const ref = doc(
    dbCLevel,
    "database_blueprints",
    categoryKey,
    "collections",
    collectionName
  );

  await updateDoc(ref, {
    "implementationStatus.stage": stage,
    "implementationStatus.collectionReady": stageMatrix[stage].collectionReady,
    "implementationStatus.serviceReady": stageMatrix[stage].serviceReady,
    "implementationStatus.uiReady": stageMatrix[stage].uiReady,
    "implementationStatus.syncReady": stageMatrix[stage].syncReady,
    "implementationStatus.updatedAt": Date.now(),
    "implementationStatus.updatedAtServer": serverTimestamp(),
  });
};

const resettableTopLevelCollections = [
  "approval_requests",
  "approval_activity_logs",
  "director_documents",
  "notifications",
  "audit_logs",
  "cmo_campaigns",
  "system_logs",
  "system_alerts",
  "system_errors",
  "system_backups",
  "executive_tasks",
  "risk_register",
  "letters",
  "meeting_agendas",
  "meeting_requests",
  "meeting_action_items",
];

const resetChatCollections = async () => {
  const roomRef = doc(dbCLevel, "director_chat_rooms", "coo-main");
  const messagesRef = collection(dbCLevel, "director_chat_rooms", "coo-main", "messages");
  const messageSnap = await getDocs(messagesRef);

  for (const item of messageSnap.docs) {
    await deleteDoc(item.ref);
  }

  try {
    await deleteDoc(roomRef);
  } catch {
    // Ignore missing room doc. The message cleanup above is the critical part.
  }
};

export const purgeCLevelWorkingCollections = async () => {
  let deletedDocCount = 0;

  for (const collectionName of resettableTopLevelCollections) {
    const snap = await getDocs(collection(dbCLevel, collectionName));

    for (const item of snap.docs) {
      await deleteDoc(item.ref);
      deletedDocCount += 1;
    }
  }

  await resetChatCollections();

  return {
    deletedDocCount,
    collectionCount: resettableTopLevelCollections.length + 1,
  };
};

export const provisionCLevelFoundationDocs = async () => {
  const now = Date.now();
  const batch = writeBatch(dbCLevel);

  const singletonDocs = [
    {
      path: ["executive_overview", "main"],
      data: {
        totalOrdersToday: 0,
        activeOrders: 0,
        onlineDrivers: 0,
        openMerchants: 0,
        grossRevenue: 0,
        status: "DRAFT",
      },
    },
    {
      path: ["coo_operational_summary", "live"],
      data: {
        totalMerchants: 0,
        activeDrivers: 0,
        activeOrders: 0,
        readyOrders: 0,
        customerCancels: 0,
        status: "DRAFT",
      },
    },
    {
      path: ["cfo_financial_summary", "current"],
      data: {
        totalCashIn: 0,
        totalCashOut: 0,
        netCashflow: 0,
        totalUnpaidCommission: 0,
        status: "DRAFT",
      },
    },
    {
      path: ["cto_system_summary", "current"],
      data: {
        maintenanceMode: false,
        unresolvedAlerts: 0,
        backupStatus: "IDLE",
        supportStatus: "UNKNOWN",
        status: "DRAFT",
      },
    },
    {
      path: ["sync_state", "current"],
      data: {
        status: "IDLE",
        lastSyncAt: null,
        lastSuccessAt: null,
        lastError: null,
      },
    },
    {
      path: ["database_blueprint_meta", "current"],
      data: {
        provisionedFoundation: true,
        databaseName: DIREKSI_DATABASE_NAME,
      },
    },
  ];

  singletonDocs.forEach((item) => {
    batch.set(
      doc(dbCLevel, item.path[0], item.path[1]),
      {
        ...item.data,
        updatedAt: now,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();

  return {
    documentCount: singletonDocs.length,
  };
};

const phaseProvisionDocs: Record<
  BlueprintPhaseKey,
  Array<{ path: [string, string]; data: Record<string, any> }>
> = {
  "shared-core": [
    {
      path: ["director_roles", "registry"],
      data: {
        status: "DRAFT",
        roleKeys: ["CEO", "COO", "CFO", "CTO", "CMO", "HR", "SECRETARY"],
        note: "Starter role registry for rebuilt c-level ERP.",
      },
    },
    {
      path: ["role_permissions", "baseline"],
      data: {
        status: "DRAFT",
        scope: "baseline",
        modules: {},
      },
    },
    {
      path: ["director_profiles", "template"],
      data: {
        status: "TEMPLATE",
        title: "",
        signatureImage: "",
        bio: "",
      },
    },
  ],
  "secretary-core": [
    {
      path: ["meeting_minutes", "template"],
      data: {
        status: "TEMPLATE",
        title: "Meeting Minutes Template",
        summary: "",
      },
    },
    {
      path: ["dispositions", "template"],
      data: {
        status: "TEMPLATE",
        instruction: "",
        targetRole: "",
      },
    },
    {
      path: ["acknowledgements", "template"],
      data: {
        status: "TEMPLATE",
        targetUid: "",
        documentId: "",
      },
    },
  ],
  "approval-core": [
    {
      path: ["approval_requests", "template"],
      data: {
        status: "TEMPLATE",
        requestType: "GENERAL",
        priority: "MEDIUM",
        title: "Approval Template",
      },
    },
    {
      path: ["approval_activity_logs", "template"],
      data: {
        status: "TEMPLATE",
        action: "CREATED",
      },
    },
    {
      path: ["director_documents", "template"],
      data: {
        status: "TEMPLATE",
        title: "Document Template",
        documentType: "GENERAL",
      },
    },
    {
      path: ["notifications", "template"],
      data: {
        status: "TEMPLATE",
        targetRole: "CEO",
        message: "Template notification",
        isRead: false,
      },
    },
  ],
  "executive-core": [
    {
      path: ["executive_tasks", "template"],
      data: {
        status: "OPEN",
        title: "Executive Task Template",
        assignedToRole: "COO",
        priority: "MEDIUM",
      },
    },
    {
      path: ["risk_register", "template"],
      data: {
        status: "OPEN",
        title: "Risk Template",
        category: "OPERATIONAL",
        impact: 1,
        likelihood: 1,
      },
    },
    {
      path: ["decision_archives", "template"],
      data: {
        status: "TEMPLATE",
        title: "Decision Archive Template",
      },
    },
    {
      path: ["board_packs", "template"],
      data: {
        status: "TEMPLATE",
        title: "Board Pack Template",
      },
    },
  ],
  "cto-core": [
    {
      path: ["system_logs", "template"],
      data: {
        status: "TEMPLATE",
        module: "ERP",
        severity: "INFO",
        message: "System log template",
      },
    },
    {
      path: ["system_alerts", "template"],
      data: {
        status: "OPEN",
        severity: "LOW",
        title: "System alert template",
      },
    },
    {
      path: ["system_errors", "template"],
      data: {
        status: "OPEN",
        module: "ERP",
        count: 0,
      },
    },
    {
      path: ["system_backups", "template"],
      data: {
        status: "IDLE",
        backupType: "MANUAL",
        scope: "C_LEVEL_DB",
      },
    },
    {
      path: ["system_incidents", "template"],
      data: {
        status: "OPEN",
        severity: "LOW",
        title: "Incident template",
      },
    },
    {
      path: ["sync_jobs", "template"],
      data: {
        status: "IDLE",
        jobType: "MANUAL",
      },
    },
  ],
  "summary-core": [
    {
      path: ["merchant_health_cache", "template"],
      data: {
        status: "DRAFT",
        merchantId: "",
        completedOrders: 0,
      },
    },
    {
      path: ["driver_health_cache", "template"],
      data: {
        status: "DRAFT",
        driverId: "",
        completedTrips: 0,
      },
    },
    {
      path: ["settlement_summary", "template"],
      data: {
        status: "DRAFT",
        entityType: "RESTAURANT",
        entityId: "",
        balance: 0,
      },
    },
    {
      path: ["financial_reports", "template"],
      data: {
        status: "DRAFT",
        reportType: "MONTHLY",
        title: "Financial Report Template",
      },
    },
    {
      path: ["cmo_growth_summary", "current"],
      data: {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalMenus: 0,
        updatedAtLabel: "DRAFT",
      },
    },
    {
      path: ["hr_people_summary", "current"],
      data: {
        totalEmployees: 0,
        activeRecruitments: 0,
        updatedAtLabel: "DRAFT",
      },
    },
  ],
};

export const provisionCLevelPhaseBundle = async (phase: BlueprintPhaseKey) => {
  const docs = phaseProvisionDocs[phase];
  const batch = writeBatch(dbCLevel);
  const now = Date.now();

  docs.forEach((item) => {
    batch.set(
      doc(dbCLevel, item.path[0], item.path[1]),
      {
        ...item.data,
        updatedAt: now,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );
  });

  batch.set(
    doc(dbCLevel, "database_blueprint_meta", "current"),
    {
      lastProvisionPhase: phase,
      databaseName: DIREKSI_DATABASE_NAME,
      lastProvisionAt: now,
      lastProvisionAtServer: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  return {
    phase,
    documentCount: docs.length,
  };
};
