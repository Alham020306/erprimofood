import { collection, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

const mapDocs = (snap: any) =>
  snap.docs.map((item: any) => ({
    id: item.id,
    ...item.data(),
  }));

export const subscribeCOORestaurants = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "restaurants"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOOUsers = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "users"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOOOrders = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "orders"),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );
