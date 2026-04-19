import { useEffect, useMemo, useState } from "react";
import {
  subscribeCOODriverOrders,
  subscribeCOODriverReviews,
} from "../services/cooDetailService";

export const useCOODriverDetail = (driver: any | null) => {
  const driverId = String(driver?.id || "");
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!driverId) {
      setOrders([]);
      setReviews([]);
      return;
    }

    const unsubs = [
      subscribeCOODriverOrders(driverId, setOrders),
      subscribeCOODriverReviews(driverId, setReviews),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [driverId]);

  return useMemo(
    () => ({
      orders,
      reviews,
    }),
    [orders, reviews]
  );
};
