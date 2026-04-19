import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";
import {
  createAuditLog,
  createDirectorNotification,
} from "../../shared/services/governanceCoreService";

export const subscribeCTOSystemData = (callback: (data: any) => void) => {
  const state = {
    users: [] as any[],
    restaurants: [] as any[],
    orders: [] as any[],
    banners: [] as any[],
    categories: [] as any[],
    menus: [] as any[],
    systemLogs: [] as any[],
    systemAlerts: [] as any[],
    systemErrors: [] as any[],
    backups: [] as any[],
    config: null as any,
    support: null as any,
    directorUsers: [] as any[],
    approvalRequests: [] as any[],
    meetingAgendas: [] as any[],
    meetingRequests: [] as any[],
    letters: [] as any[],
    executiveTasks: [] as any[],
    syncJobs: [] as any[],
    reviews: [] as any[],
    driverReviews: [] as any[],
    chats: [] as any[],
    notifications: [] as any[],
    voucherClaims: [] as any[],
    shippingVouchers: [] as any[],
  };

  const emit = () => {
    callback({
      users: [...state.users],
      restaurants: [...state.restaurants],
      orders: [...state.orders],
      banners: [...state.banners],
      categories: [...state.categories],
      menus: [...state.menus],
      systemLogs: [...state.systemLogs],
      systemAlerts: [...state.systemAlerts],
      systemErrors: [...state.systemErrors],
      backups: [...state.backups],
      config: state.config,
      support: state.support,
      directorUsers: [...state.directorUsers],
      approvalRequests: [...state.approvalRequests],
      meetingAgendas: [...state.meetingAgendas],
      meetingRequests: [...state.meetingRequests],
      letters: [...state.letters],
      executiveTasks: [...state.executiveTasks],
      syncJobs: [...state.syncJobs],
      reviews: [...state.reviews],
      driverReviews: [...state.driverReviews],
      chats: [...state.chats],
      notifications: [...state.notifications],
      voucherClaims: [...state.voucherClaims],
      shippingVouchers: [...state.shippingVouchers],
    });
  };

  const unsubUsers = onSnapshot(
    collection(dbMain, "users"),
    (snap) => {
      state.users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO users realtime error:", error);
    }
  );

  const unsubRestaurants = onSnapshot(
    collection(dbMain, "restaurants"),
    (snap) => {
      state.restaurants = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO restaurants realtime error:", error);
    }
  );

  const unsubOrders = onSnapshot(
    collection(dbMain, "orders"),
    (snap) => {
      state.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO orders realtime error:", error);
    }
  );

  const unsubBanners = onSnapshot(
    collection(dbMain, "banners"),
    (snap) => {
      state.banners = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO banners realtime error:", error);
    }
  );

  const unsubCategories = onSnapshot(
    collection(dbMain, "categories"),
    (snap) => {
      state.categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO categories realtime error:", error);
    }
  );

  const unsubMenus = onSnapshot(
    collection(dbMain, "menus"),
    (snap) => {
      state.menus = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO menus realtime error:", error);
    }
  );

  const logsQuery = query(
    collection(dbCLevel, "system_logs"),
    orderBy("createdAt", "desc")
  );

  const unsubLogs = onSnapshot(
    logsQuery,
    (snap) => {
      state.systemLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 100);
      emit();
    },
    (error) => {
      console.error("CTO logs realtime error:", error);
    }
  );

  const alertsQuery = query(
    collection(dbCLevel, "system_alerts"),
    orderBy("createdAt", "desc")
  );

  const unsubAlerts = onSnapshot(
    alertsQuery,
    (snap) => {
      state.systemAlerts = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 100);
      emit();
    },
    (error) => {
      console.error("CTO alerts realtime error:", error);
    }
  );

  const errorsQuery = query(
    collection(dbCLevel, "system_errors"),
    orderBy("lastSeenAt", "desc")
  );

  const unsubErrors = onSnapshot(
    errorsQuery,
    (snap) => {
      state.systemErrors = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 100);
      emit();
    },
    (error) => {
      console.error("CTO errors realtime error:", error);
    }
  );

  const backupsQuery = query(
    collection(dbCLevel, "system_backups"),
    orderBy("createdAt", "desc")
  );

  const unsubBackups = onSnapshot(
    backupsQuery,
    (snap) => {
      state.backups = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 50);
      emit();
    },
    (error) => {
      console.error("CTO backups realtime error:", error);
    }
  );

const unsubConfig = onSnapshot(
  doc(dbMain, "system", "config"),
  (snap) => {
    state.config = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    emit();
  },
  (error) => {
    console.error("CTO config realtime error:", error);
  }
);

  const unsubSupport = onSnapshot(
  doc(dbMain, "system", "support"),
  (snap) => {
    state.support = snap.exists() ? { id: snap.id, ...snap.data() } : null;
    emit();
  },
  (error) => {
    console.error("CTO support realtime error:", error);
  }
);

  const unsubDirectorUsers = onSnapshot(
    collection(dbCLevel, "direction_users"),
    (snap) => {
      state.directorUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO direction_users realtime error:", error);
    }
  );

  const unsubApprovals = onSnapshot(
    collection(dbCLevel, "approval_requests"),
    (snap) => {
      state.approvalRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO approval_requests realtime error:", error);
    }
  );

  const unsubMeetingAgendas = onSnapshot(
    collection(dbCLevel, "meeting_agendas"),
    (snap) => {
      state.meetingAgendas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO meeting_agendas realtime error:", error);
    }
  );

  const unsubMeetingRequests = onSnapshot(
    collection(dbCLevel, "meeting_requests"),
    (snap) => {
      state.meetingRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO meeting_requests realtime error:", error);
    }
  );

  const unsubLetters = onSnapshot(
    collection(dbCLevel, "letters"),
    (snap) => {
      state.letters = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO letters realtime error:", error);
    }
  );

  const unsubExecutiveTasks = onSnapshot(
    collection(dbCLevel, "executive_tasks"),
    (snap) => {
      state.executiveTasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO executive_tasks realtime error:", error);
    }
  );

  const unsubSyncJobs = onSnapshot(
    query(collection(dbCLevel, "sync_jobs"), orderBy("updatedAt", "desc")),
    (snap) => {
      state.syncJobs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 50);
      emit();
    },
    (error) => {
      console.error("CTO sync_jobs realtime error:", error);
    }
  );

  const unsubReviews = onSnapshot(
    collection(dbMain, "reviews"),
    (snap) => {
      state.reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO reviews realtime error:", error);
    }
  );

  const unsubDriverReviews = onSnapshot(
    collection(dbMain, "driver_reviews"),
    (snap) => {
      state.driverReviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO driver_reviews realtime error:", error);
    }
  );

  const unsubChats = onSnapshot(
    collection(dbMain, "chats"),
    (snap) => {
      state.chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO chats realtime error:", error);
    }
  );

  const unsubNotifications = onSnapshot(
    collection(dbMain, "notifications"),
    (snap) => {
      state.notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO notifications realtime error:", error);
    }
  );

  const unsubVoucherClaims = onSnapshot(
    collection(dbMain, "voucher_claims"),
    (snap) => {
      state.voucherClaims = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO voucher_claims realtime error:", error);
    }
  );

  const unsubShippingVouchers = onSnapshot(
    collection(dbMain, "shipping_vouchers"),
    (snap) => {
      state.shippingVouchers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    (error) => {
      console.error("CTO shipping_vouchers realtime error:", error);
    }
  );

  return () => {
    unsubUsers();
    unsubRestaurants();
    unsubOrders();
    unsubBanners();
    unsubCategories();
    unsubMenus();
    unsubLogs();
    unsubAlerts();
    unsubErrors();
    unsubBackups();
    unsubConfig();
    unsubSupport();
    unsubDirectorUsers();
    unsubApprovals();
    unsubMeetingAgendas();
    unsubMeetingRequests();
    unsubLetters();
    unsubExecutiveTasks();
    unsubSyncJobs();
    unsubReviews();
    unsubDriverReviews();
    unsubChats();
    unsubNotifications();
    unsubVoucherClaims();
    unsubShippingVouchers();
  };
};

export const upsertSystemConfig = async (payload: Record<string, unknown>) => {
  const ref = doc(dbMain, "system", "config");
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

export const upsertSystemSupport = async (payload: Record<string, unknown>) => {
  const ref = doc(dbMain, "system", "support");
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

export const createSystemAlert = async (payload: {
  title: string;
  message: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
  module: string;
  actorUid?: string;
  actorRole?: string;
}) => {
  const docRef = await addDoc(collection(dbCLevel, "system_alerts"), {
    ...payload,
    isResolved: false,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.actorUid || "",
    actorRole: payload.actorRole || "CTO",
    action: "SYSTEM_ALERT_CREATED",
    entityType: "system_alerts",
    entityId: docRef.id,
    after: {
      title: payload.title,
      severity: payload.severity,
      module: payload.module,
    },
  });

  await createDirectorNotification({
    targetRole: "CTO",
    title: payload.title,
    message: payload.message,
    type: "SYSTEM_ALERT",
    relatedEntityType: "system_alerts",
    relatedEntityId: docRef.id,
  });
};

export const resolveSystemAlert = async (alertId: string, actor: {
  uid: string;
  name: string;
  role: string;
}) => {
  const alertRef = doc(dbCLevel, "system_alerts", alertId);
  const alertSnap = await getDoc(alertRef);
  const alertData = alertSnap.exists() ? alertSnap.data() : null;

  await updateDoc(alertRef, {
    isResolved: true,
    resolvedByUid: actor.uid,
    resolvedByName: actor.name,
    resolvedByRole: actor.role,
    resolvedAt: Date.now(),
    resolvedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor.uid,
    actorRole: actor.role,
    action: "SYSTEM_ALERT_RESOLVED",
    entityType: "system_alerts",
    entityId: alertId,
    after: {
      isResolved: true,
      severity: alertData?.severity || "",
      module: alertData?.module || "",
    },
  });
};

export const createBackupRecord = async (payload: {
  backupType: "AUTO" | "MANUAL";
  status: "SUCCESS" | "FAILED" | "PENDING";
  scope: "MAIN_DB" | "C_LEVEL_DB" | "STORAGE" | "FULL";
  triggeredByUid?: string | null;
  triggeredByName?: string | null;
  triggeredByRole?: string | null;
  notes?: string;
}) => {
  const now = Date.now();

  const backupRef = await addDoc(collection(dbCLevel, "system_backups"), {
    ...payload,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  const syncRef = await addDoc(collection(dbCLevel, "sync_jobs"), {
    jobType: payload.scope,
    status: payload.status,
    source: "direksi",
    triggeredByUid: payload.triggeredByUid || null,
    triggeredByName: payload.triggeredByName || null,
    triggeredByRole: payload.triggeredByRole || null,
    relatedEntityType: "system_backups",
    relatedEntityId: backupRef.id,
    notes: payload.notes || "",
    createdAt: now,
    createdAtServer: serverTimestamp(),
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.triggeredByUid || "",
    actorRole: payload.triggeredByRole || "CTO",
    action: "SYSTEM_BACKUP_RECORDED",
    entityType: "system_backups",
    entityId: backupRef.id,
    after: {
      backupType: payload.backupType,
      status: payload.status,
      scope: payload.scope,
      syncJobId: syncRef.id,
    },
  });
};
