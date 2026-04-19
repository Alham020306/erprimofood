import { collection, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

const mapDocs = (snap: any) =>
  snap.docs.map((item: any) => ({
    id: item.id,
    ...item.data(),
  }));

export const subscribeOperationalUsers = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "users"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeOperationalOrders = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "orders"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );
