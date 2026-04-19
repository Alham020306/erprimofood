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

const sortByUpdatedAt = (rows: any[]) =>
  [...rows].sort(
    (a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)
  );

export const subscribeLetters = (callback: (rows: any[]) => void) => {
  const q = query(collection(dbCLevel, "letters"), orderBy("updatedAt", "desc"));

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

export const createLetter = async (payload: {
  letterType: string;
  subject: string;
  summary: string;
  classification: string;
  recipient: string;
  createdBy: string;
  ownerRole: string;
}) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "letters"), {
    ...payload,
    status: "DRAFT",
    requiresApproval: true,
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.createdBy,
    actorRole: payload.ownerRole,
    action: "LETTER_CREATED",
    entityType: "letters",
    entityId: docRef.id,
    after: {
      subject: payload.subject,
      classification: payload.classification,
      recipient: payload.recipient,
    },
  });

  await createDirectorNotification({
    targetRole: "CEO",
    title: "Letter draft created",
    message: `${payload.ownerRole} membuat draft surat: ${payload.subject}`,
    type: "LETTER",
    relatedEntityType: "letters",
    relatedEntityId: docRef.id,
  });
};

export const updateLetterStatus = async (
  letterId: string,
  status: string,
  actor?: {
    uid?: string;
    role?: string;
  }
) => {
  await updateDoc(doc(dbCLevel, "letters", letterId), {
    status,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor?.uid || "",
    actorRole: actor?.role || "SECRETARY",
    action: "LETTER_STATUS_UPDATED",
    entityType: "letters",
    entityId: letterId,
    after: { status },
  });
};

export const subscribeMeetingAgendas = (callback: (rows: any[]) => void) => {
  const q = query(
    collection(dbCLevel, "meeting_agendas"),
    orderBy("updatedAt", "desc")
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

export const createMeetingAgenda = async (payload: {
  title: string;
  meetingDate: string;
  meetingTime: string;
  location: string;
  organizerUid: string;
  organizerName?: string;
  ownerRole?: string;
  participants: string[];
  requestedByUid?: string;
  requestedByName?: string;
  requestedByRole?: string;
  requestId?: string | null;
}) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "meeting_agendas"), {
    ...payload,
    scheduledByUid: payload.organizerUid,
    scheduledByName: payload.organizerName || "Secretary Office",
    status: "SCHEDULED",
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.organizerUid,
    actorRole: payload.ownerRole || "SECRETARY",
    action: "MEETING_AGENDA_CREATED",
    entityType: "meeting_agendas",
    entityId: docRef.id,
    after: {
      title: payload.title,
      meetingDate: payload.meetingDate,
      meetingTime: payload.meetingTime,
      requestId: payload.requestId || null,
    },
  });

  await Promise.all(
    (payload.participants || []).map((participantRole) =>
      createDirectorNotification({
        targetRole: participantRole,
        title: "Meeting scheduled",
        message: `Meeting "${payload.title}" dijadwalkan pada ${payload.meetingDate} ${payload.meetingTime}.`,
        type: "MEETING",
        relatedEntityType: "meeting_agendas",
        relatedEntityId: docRef.id,
      })
    )
  );

  if (payload.requestId) {
    await updateDoc(doc(dbCLevel, "meeting_requests", payload.requestId), {
      status: "SCHEDULED",
      linkedAgendaId: docRef.id,
      scheduledAt: now,
      scheduledByUid: payload.organizerUid,
      scheduledByName: payload.organizerName || "Secretary Office",
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    });

    await createAuditLog({
      actorUid: payload.organizerUid,
      actorRole: payload.ownerRole || "SECRETARY",
      action: "MEETING_REQUEST_SCHEDULED",
      entityType: "meeting_requests",
      entityId: payload.requestId,
      after: {
        linkedAgendaId: docRef.id,
        status: "SCHEDULED",
      },
    });
  }
};

export const updateMeetingAgendaStatus = async (
  agendaId: string,
  status: string,
  actor?: {
    uid?: string;
    role?: string;
  }
) => {
  await updateDoc(doc(dbCLevel, "meeting_agendas", agendaId), {
    status,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor?.uid || "",
    actorRole: actor?.role || "SECRETARY",
    action: "MEETING_AGENDA_STATUS_UPDATED",
    entityType: "meeting_agendas",
    entityId: agendaId,
    after: { status },
  });
};

export const subscribeMeetingActionItems = (callback: (rows: any[]) => void) => {
  const q = query(
    collection(dbCLevel, "meeting_action_items"),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        sortByUpdatedAt(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        )
      );
    },
    () => callback([])
  );
};

export const subscribeMeetingRequests = (callback: (rows: any[]) => void) => {
  const q = query(
    collection(dbCLevel, "meeting_requests"),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        sortByUpdatedAt(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        )
      );
    },
    () => callback([])
  );
};

export const createMeetingRequest = async (payload: {
  title: string;
  purpose: string;
  preferredDate: string;
  preferredTime: string;
  participants: string[];
  requestedByUid: string;
  requestedByName: string;
  requestedByRole: string;
}) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "meeting_requests"), {
    ...payload,
    status: "PENDING",
    targetRole: "SECRETARY",
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.requestedByUid,
    actorRole: payload.requestedByRole,
    action: "MEETING_REQUEST_CREATED",
    entityType: "meeting_requests",
    entityId: docRef.id,
    after: {
      title: payload.title,
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
    },
  });

  await createDirectorNotification({
    targetRole: "SECRETARY",
    title: "New meeting request",
    message: `${payload.requestedByName} mengajukan meeting: ${payload.title}`,
    type: "MEETING_REQUEST",
    relatedEntityType: "meeting_requests",
    relatedEntityId: docRef.id,
  });
};

export const updateMeetingRequestStatus = async (
  requestId: string,
  status: string,
  actor?: {
    uid?: string;
    name?: string;
    role?: string;
  }
) => {
  await updateDoc(doc(dbCLevel, "meeting_requests", requestId), {
    status,
    reviewedByUid: actor?.uid || "",
    reviewedByName: actor?.name || "",
    reviewedByRole: actor?.role || "",
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor?.uid || "",
    actorRole: actor?.role || "SECRETARY",
    action: "MEETING_REQUEST_STATUS_UPDATED",
    entityType: "meeting_requests",
    entityId: requestId,
    after: { status },
  });
};

export const createMeetingActionItem = async (payload: {
  minuteId?: string | null;
  title: string;
  description: string;
  assignedToRole: string;
  dueDate: string;
  createdByUid?: string;
  createdByRole?: string;
}) => {
  const now = Date.now();

  const docRef = await addDoc(collection(dbCLevel, "meeting_action_items"), {
    ...payload,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: payload.createdByUid || "",
    actorRole: payload.createdByRole || "SECRETARY",
    action: "MEETING_ACTION_ITEM_CREATED",
    entityType: "meeting_action_items",
    entityId: docRef.id,
    after: {
      title: payload.title,
      assignedToRole: payload.assignedToRole,
      dueDate: payload.dueDate,
    },
  });

  await createDirectorNotification({
    targetRole: payload.assignedToRole,
    title: "New action item",
    message: `Tindak lanjut baru ditugaskan: ${payload.title}`,
    type: "ACTION_ITEM",
    relatedEntityType: "meeting_action_items",
    relatedEntityId: docRef.id,
  });
};

export const updateMeetingActionItemStatus = async (
  actionItemId: string,
  status: string,
  actor?: {
    uid?: string;
    role?: string;
  }
) => {
  await updateDoc(doc(dbCLevel, "meeting_action_items", actionItemId), {
    status,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor?.uid || "",
    actorRole: actor?.role || "SECRETARY",
    action: "MEETING_ACTION_ITEM_STATUS_UPDATED",
    entityType: "meeting_action_items",
    entityId: actionItemId,
    after: { status },
  });
};
