import { collection, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

type COOData = {
  restaurants: any[];
  users: any[];
  orders: any[];
  reviews: any[];
  driverReviews: any[];
  menus: any[];
};

export const subscribeCOOData = (callback: (data: COOData) => void) => {
  const state: COOData = {
    restaurants: [],
    users: [],
    orders: [],
    reviews: [],
    driverReviews: [],
    menus: [],
  };

  const emit = () => {
    callback({
      restaurants: [...state.restaurants],
      users: [...state.users],
      orders: [...state.orders],
      reviews: [...state.reviews],
      driverReviews: [...state.driverReviews],
      menus: [...state.menus],
    });
  };

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

  const unsubReviews = onSnapshot(
    collection(dbMain, "reviews"),
    (snap) => {
      state.reviews = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("reviews realtime error:", error);
    }
  );

  const unsubDriverReviews = onSnapshot(
    collection(dbMain, "driver_reviews"),
    (snap) => {
      state.driverReviews = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("driver_reviews realtime error:", error);
    }
  );

  const unsubMenus = onSnapshot(
    collection(dbMain, "menus"),
    (snap) => {
      state.menus = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      emit();
    },
    (error) => {
      console.error("menus realtime error:", error);
    }
  );

  return () => {
    unsubRestaurants();
    unsubUsers();
    unsubOrders();
    unsubReviews();
    unsubDriverReviews();
    unsubMenus();
  };
};
