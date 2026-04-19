import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const createDirectorNotification = async (payload: {
  targetRole: string;
  message: string;
  title?: string;
  targetUid?: string | null;
  type?: string;
  link?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}) => {
  const now = Date.now();

  await addDoc(collection(dbCLevel, "notifications"), {
    targetRole: payload.targetRole,
    targetUid: payload.targetUid || null,
    title: payload.title || "Rimo Food Direksi",
    message: payload.message,
    type: payload.type || "GENERAL",
    link: payload.link || "",
    relatedEntityType: payload.relatedEntityType || "",
    relatedEntityId: payload.relatedEntityId || "",
    isRead: false,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });
};

export const createAuditLog = async (payload: {
  actorUid: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) => {
  if (!payload.actorUid) return;

  await addDoc(collection(dbCLevel, "audit_logs"), {
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    before: payload.before || null,
    after: payload.after || null,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
};
