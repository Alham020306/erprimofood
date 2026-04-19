import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

const mapDocs = (snap: any) =>
  snap.docs.map((item: any) => ({
    id: item.id,
    ...item.data(),
  }));

export const subscribeAdminUsers = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "users"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminRestaurants = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "restaurants"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminOrders = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "orders"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminRecentOrders = (
  callback: (rows: any[]) => void,
  take = 12
) =>
  onSnapshot(
    query(collection(dbMain, "orders"), orderBy("timestamp", "desc"), limit(take)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminRecentFrictionOrders = (
  callback: (rows: any[]) => void,
  take = 20
) =>
  onSnapshot(
    query(collection(dbMain, "orders"), orderBy("updatedAt", "desc"), limit(take)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminRecentRestaurantReviews = (
  callback: (rows: any[]) => void,
  take = 6
) =>
  onSnapshot(
    query(collection(dbMain, "reviews"), orderBy("createdAt", "desc"), limit(take)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminRecentDriverReviews = (
  callback: (rows: any[]) => void,
  take = 6
) =>
  onSnapshot(
    query(
      collection(dbMain, "driver_reviews"),
      orderBy("createdAt", "desc"),
      limit(take)
    ),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminSupportStatus = (
  callback: (value: { isOnline: boolean; reason: string }) => void
) =>
  onSnapshot(
    doc(dbMain, "system", "support"),
    (snap) => {
      const data = snap.data() || {};
      callback({
        isOnline: data.isOnline === true,
        reason: String(data.reason || ""),
      });
    },
    () =>
      callback({
        isOnline: false,
        reason: "",
      })
  );

export const subscribeAdminSupportChats = (callback: (rows: any[]) => void) =>
  onSnapshot(
    query(collection(dbMain, "chats"), orderBy("lastUpdated", "desc"), limit(50)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminSupportMessages = (
  chatId: string,
  callback: (rows: any[]) => void
) =>
  onSnapshot(
    query(
      collection(dbMain, "chats", chatId, "messages"),
      orderBy("timestamp", "asc"),
      limit(200)
    ),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const updateAdminSupportStatus = async (payload: {
  isOnline?: boolean;
  reason?: string;
}) => {
  await setDoc(
    doc(dbMain, "system", "support"),
    {
      ...(payload.isOnline === undefined ? {} : { isOnline: payload.isOnline }),
      ...(payload.reason === undefined ? {} : { reason: payload.reason }),
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

export const sendAdminSupportMessage = async (payload: {
  chatId: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
}) => {
  const safeText = payload.text.trim();
  if (!safeText) return;

  await addDoc(collection(dbMain, "chats", payload.chatId, "messages"), {
    text: safeText,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    isAdmin: true,
    timestamp: Date.now(),
    createdAtServer: serverTimestamp(),
  });

  await setDoc(
    doc(dbMain, "chats", payload.chatId),
    {
      lastMessage: safeText,
      lastUpdated: Date.now(),
      lastUpdatedServer: serverTimestamp(),
    },
    { merge: true }
  );
};

export const closeAdminSupportTicket = async (chatId: string) => {
  const messagesSnap = await getDocs(collection(dbMain, "chats", chatId, "messages"));
  await Promise.all(messagesSnap.docs.map((item) => deleteDoc(item.ref)));
  await deleteDoc(doc(dbMain, "chats", chatId));
};

export const subscribeAdminBanners = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "banners"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminCategories = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "categories"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminAds = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "ads"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeAdminMitraAds = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "mitra_ads"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );
