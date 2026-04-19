import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

const mapDocs = (snap: any) =>
  snap.docs.map((item: any) => ({
    id: item.id,
    ...item.data(),
  }));

export const subscribeCOOMerchantOrders = (
  merchantId: string,
  callback: (rows: any[]) => void
) =>
  onSnapshot(
    query(collection(dbMain, "orders"), where("restaurantId", "==", merchantId)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOOMerchantReviews = (
  merchantId: string,
  callback: (rows: any[]) => void
) =>
  onSnapshot(
    query(collection(dbMain, "reviews"), where("restaurantId", "==", merchantId)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOOMerchantMenus = (
  merchantId: string,
  callback: (rows: any[]) => void
) =>
  onSnapshot(
    query(collection(dbMain, "menus"), where("restaurantId", "==", merchantId)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOODriverOrders = (
  driverId: string,
  callback: (rows: any[]) => void
) =>
  onSnapshot(
    query(collection(dbMain, "orders"), where("driverId", "==", driverId)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOODriverReviews = (
  driverId: string,
  callback: (rows: any[]) => void
) =>
  onSnapshot(
    query(collection(dbMain, "driver_reviews"), where("driverId", "==", driverId)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCOOReviewMonitor = (
  callback: (data: { restaurantReviews: any[]; driverReviews: any[] }) => void
) => {
  let restaurantReviews: any[] = [];
  let driverReviews: any[] = [];

  const emit = () =>
    callback({
      restaurantReviews: [...restaurantReviews],
      driverReviews: [...driverReviews],
    });

  const unsubRestaurant = onSnapshot(
    query(collection(dbMain, "reviews"), orderBy("createdAt", "desc"), limit(8)),
    (snap) => {
      restaurantReviews = mapDocs(snap);
      emit();
    },
    () => {
      restaurantReviews = [];
      emit();
    }
  );

  const unsubDriver = onSnapshot(
    query(
      collection(dbMain, "driver_reviews"),
      orderBy("createdAt", "desc"),
      limit(8)
    ),
    (snap) => {
      driverReviews = mapDocs(snap);
      emit();
    },
    () => {
      driverReviews = [];
      emit();
    }
  );

  return () => {
    unsubRestaurant();
    unsubDriver();
  };
};
