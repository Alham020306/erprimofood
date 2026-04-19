import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { ApprovalAttachment, ApprovalPriority, ApprovalRequestType, ApprovalStatus } from "../../../core/types/approval";
import {
  createAuditLog,
  createDirectorNotification,
} from "../../shared/services/governanceCoreService";

type CreateApprovalParams = {
  title: string;
  description: string;
  requestType: ApprovalRequestType;
  requestedByUid: string;
  requestedByName: string;
  requestedByRole: string;
  targetRole: string;
  targetUid?: string | null;
  amount?: number | null;
  currency?: string | null;
  priority: ApprovalPriority;
  relatedModule?: string | null;
  relatedEntityId?: string | null;
  attachments?: ApprovalAttachment[];
};

export const createApprovalRequest = async ({
  title,
  description,
  requestType,
  requestedByUid,
  requestedByName,
  requestedByRole,
  targetRole,
  targetUid = null,
  amount = null,
  currency = "IDR",
  priority,
  relatedModule = null,
  relatedEntityId = null,
  attachments = [],
}: CreateApprovalParams) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "approval_requests"), {
    title,
    description,
    requestType,
    requestedByUid,
    requestedByName,
    requestedByRole,
    targetRole,
    targetUid,
    amount,
    currency,
    priority,
    status: "SUBMITTED",
    relatedModule,
    relatedEntityId,
    attachments,
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await addDoc(collection(dbCLevel, "approval_activity_logs"), {
    approvalId: docRef.id,
    action: "CREATED",
    actorUid: requestedByUid,
    actorName: requestedByName,
    actorRole: requestedByRole,
    note: "Approval dibuat",
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  await createDirectorNotification({
    targetRole,
    targetUid,
    title: "Approval baru masuk",
    message: `${requestedByName} mengajukan ${title}`,
    type: "APPROVAL",
    link: `/approvals/${docRef.id}`,
    relatedEntityType: "approval_requests",
    relatedEntityId: docRef.id,
  });

  await createAuditLog({
    actorUid: requestedByUid,
    actorRole: requestedByRole,
    action: "APPROVAL_CREATED",
    entityType: "approval_requests",
    entityId: docRef.id,
    after: {
      requestType,
      targetRole,
      priority,
      relatedModule,
      relatedEntityId,
    },
  });

  return docRef.id;
};

type UpdateApprovalStatusParams = {
  approvalId: string;
  status: ApprovalStatus;
  actorUid: string;
  actorName: string;
  actorRole: string;
  note?: string;
};

export const updateApprovalStatus = async ({
  approvalId,
  status,
  actorUid,
  actorName,
  actorRole,
  note = "",
}: UpdateApprovalStatusParams) => {
  const now = Date.now();
  const approvalRef = doc(dbCLevel, "approval_requests", approvalId);
  const approvalSnap = await getDoc(approvalRef);
  const approvalData = approvalSnap.exists() ? (approvalSnap.data() as any) : null;

  await updateDoc(approvalRef, {
    status,
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  const action =
    status === "APPROVED"
      ? "APPROVED"
      : status === "REJECTED"
      ? "REJECTED"
      : status === "REVISION_REQUIRED"
      ? "REVISION_REQUIRED"
      : "COMMENTED";

  await addDoc(collection(dbCLevel, "approval_activity_logs"), {
    approvalId,
    action,
    actorUid,
    actorName,
    actorRole,
    note,
    createdAt: now,
    createdAtServer: serverTimestamp(),
  });

  await createDirectorNotification({
    targetRole: approvalData?.requestedByRole || actorRole,
    targetUid: approvalData?.requestedByUid || null,
    title: "Approval updated",
    message: `${actorName} mengubah approval ke status ${status}.`,
    type: "APPROVAL_STATUS",
    link: `/approvals/${approvalId}`,
    relatedEntityType: "approval_requests",
    relatedEntityId: approvalId,
  });

  await createAuditLog({
    actorUid,
    actorRole,
    action: "APPROVAL_STATUS_UPDATED",
    entityType: "approval_requests",
    entityId: approvalId,
    after: {
      status,
      note,
    },
  });
};

export const subscribeInboxApprovals = (
  role: string,
  callback: (rows: any[]) => void
) => {
  const q = query(
    collection(dbCLevel, "approval_requests"),
    where("targetRole", "==", role),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    },
    (error) => {
      console.error("subscribeInboxApprovals error:", error);
      callback([]);
    }
  );
};

export const subscribeRequestedApprovals = (
  uid: string,
  callback: (rows: any[]) => void
) => {
  const q = query(
    collection(dbCLevel, "approval_requests"),
    where("requestedByUid", "==", uid),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    },
    (error) => {
      console.error("subscribeRequestedApprovals error:", error);
      callback([]);
    }
  );
};

export const subscribeApprovalActivityLogs = (
  approvalId: string,
  callback: (rows: any[]) => void
) => {
  const q = query(
    collection(dbCLevel, "approval_activity_logs"),
    where("approvalId", "==", approvalId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    },
    (error) => {
      console.error("subscribeApprovalActivityLogs error:", error);
      callback([]);
    }
  );
};
