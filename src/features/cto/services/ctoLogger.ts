import { addDoc, collection, query, where, getDocs, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import {
  createAuditLog,
  createDirectorNotification,
} from "../../shared/services/governanceCoreService";

type LogSeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export const logSystemEvent = async (payload: {
  module: string;
  action: string;
  actorUid?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  severity?: LogSeverity;
  message: string;
  metadata?: Record<string, any>;
}) => {
  const docRef = await addDoc(collection(dbCLevel, "system_logs"), {
    module: payload.module,
    action: payload.action,
    actorUid: payload.actorUid || null,
    actorName: payload.actorName || null,
    actorRole: payload.actorRole || null,
    severity: payload.severity || "INFO",
    message: payload.message,
    metadata: payload.metadata || {},
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.actorUid || "",
    actorRole: payload.actorRole || "CTO",
    action: "SYSTEM_LOG_CREATED",
    entityType: "system_logs",
    entityId: docRef.id,
    after: {
      module: payload.module,
      action: payload.action,
      severity: payload.severity || "INFO",
    },
  });
};

export const reportSystemError = async (payload: {
  module: string;
  message: string;
  stack?: string;
  severity?: LogSeverity;
}) => {
  const severity = payload.severity || "ERROR";

  const q = query(
    collection(dbCLevel, "system_errors"),
    where("module", "==", payload.module),
    where("message", "==", payload.message)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    const first = snap.docs[0];
    await updateDoc(doc(dbCLevel, "system_errors", first.id), {
      count: increment(1),
      lastSeenAt: Date.now(),
      lastSeenAtServer: serverTimestamp(),
      stack: payload.stack || first.data().stack || "",
      severity,
    });

    await createAuditLog({
      actorUid: "",
      actorRole: "CTO",
      action: "SYSTEM_ERROR_INCREMENTED",
      entityType: "system_errors",
      entityId: first.id,
      after: {
        module: payload.module,
        message: payload.message,
        severity,
      },
    });

    return;
  }

  const docRef = await addDoc(collection(dbCLevel, "system_errors"), {
    module: payload.module,
    message: payload.message,
    stack: payload.stack || "",
    severity,
    count: 1,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
    firstSeenAtServer: serverTimestamp(),
    lastSeenAtServer: serverTimestamp(),
  });

  await createDirectorNotification({
    targetRole: "CTO",
    title: "System error detected",
    message: `${payload.module}: ${payload.message}`,
    type: "SYSTEM_ERROR",
    relatedEntityType: "system_errors",
    relatedEntityId: docRef.id,
  });
};
