import { collection, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

type CFOData = {
  operationalLedger: any[];
  restaurants: any[];
  users: any[];
  orders: any[];
};

export const subscribeCFOData = (callback: (data: CFOData) => void) => {
  const state: CFOData = {
    operationalLedger: [],
    restaurants: [],
    users: [],
    orders: [],
  };

  const emit = () => {
    callback({
      operationalLedger: [...state.operationalLedger],
      restaurants: [...state.restaurants],
      users: [...state.users],
      orders: [...state.orders],
    });
  };

  const unsubLedger = onSnapshot(
    collection(dbMain, "operational_ledger"),
    (snap) => {
      state.operationalLedger = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("operational_ledger realtime error:", error);
    }
  );

  const unsubRestaurants = onSnapshot(
    collection(dbMain, "restaurants"),
    (snap) => {
      state.restaurants = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("restaurants realtime error:", error);
    }
  );

  const unsubUsers = onSnapshot(
    collection(dbMain, "users"),
    (snap) => {
      state.users = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("users realtime error:", error);
    }
  );

  const unsubOrders = onSnapshot(
    collection(dbMain, "orders"),
    (snap) => {
      state.orders = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("orders realtime error:", error);
    }
  );

  return () => {
    unsubLedger();
    unsubRestaurants();
    unsubUsers();
    unsubOrders();
  };
};