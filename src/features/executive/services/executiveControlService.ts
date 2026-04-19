import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import {
  createAuditLog,
  createDirectorNotification,
} from "../../shared/services/governanceCoreService";

export const subscribeExecutiveTasks = (callback: (rows: any[]) => void) => {
  const q = query(
    collection(dbCLevel, "executive_tasks"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    () => callback([])
  );
};

export const createExecutiveTask = async (payload: {
  title: string;
  description: string;
  assignedBy: string;
  assignedByRole?: string;
  assignedTo: string;
  assignedToRole: string;
  priority: string;
  dueAt?: number | null;
}) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "executive_tasks"), {
    ...payload,
    status: "TODO",
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.assignedBy,
    actorRole: payload.assignedByRole || "CEO",
    action: "EXECUTIVE_TASK_CREATED",
    entityType: "executive_tasks",
    entityId: docRef.id,
    after: {
      title: payload.title,
      assignedToRole: payload.assignedToRole,
      priority: payload.priority,
      dueAt: payload.dueAt || null,
    },
  });

  await createDirectorNotification({
    targetRole: payload.assignedToRole,
    title: "Executive task assigned",
    message: `Task baru ditugaskan: ${payload.title}`,
    type: "EXECUTIVE_TASK",
    relatedEntityType: "executive_tasks",
    relatedEntityId: docRef.id,
  });
};

export const updateExecutiveTaskStatus = async (
  taskId: string,
  status: string,
  actor?: {
    uid?: string;
    role?: string;
  }
) => {
  await updateDoc(doc(dbCLevel, "executive_tasks", taskId), {
    status,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor?.uid || "",
    actorRole: actor?.role || "CEO",
    action: "EXECUTIVE_TASK_STATUS_UPDATED",
    entityType: "executive_tasks",
    entityId: taskId,
    after: { status },
  });
};

export const subscribeRiskRegister = (callback: (rows: any[]) => void) => {
  const q = query(collection(dbCLevel, "risk_register"), orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    () => callback([])
  );
};

export const createRiskItem = async (payload: {
  category: string;
  title: string;
  description: string;
  impact: number;
  likelihood: number;
  mitigationPlan: string;
  ownerRole: string;
  actorUid?: string;
  actorRole?: string;
}) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "risk_register"), {
    ...payload,
    status: "OPEN",
    updatedAt: now,
    createdAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.actorUid || "",
    actorRole: payload.actorRole || "CEO",
    action: "RISK_ITEM_CREATED",
    entityType: "risk_register",
    entityId: docRef.id,
    after: {
      title: payload.title,
      category: payload.category,
      ownerRole: payload.ownerRole,
      impact: payload.impact,
      likelihood: payload.likelihood,
    },
  });

  await createDirectorNotification({
    targetRole: payload.ownerRole,
    title: "Risk assigned",
    message: `Risk baru perlu dimonitor: ${payload.title}`,
    type: "RISK",
    relatedEntityType: "risk_register",
    relatedEntityId: docRef.id,
  });
};

export const updateRiskStatus = async (
  riskId: string,
  status: string,
  actor?: {
    uid?: string;
    role?: string;
  }
) => {
  await updateDoc(doc(dbCLevel, "risk_register", riskId), {
    status,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor?.uid || "",
    actorRole: actor?.role || "CEO",
    action: "RISK_STATUS_UPDATED",
    entityType: "risk_register",
    entityId: riskId,
    after: { status },
  });
};
