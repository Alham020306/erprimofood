import { useEffect, useState } from "react";
import { subscribeCOOReviewMonitor } from "../services/cooDetailService";

export const useCOOReviewMonitor = () => {
  const [restaurantReviews, setRestaurantReviews] = useState<any[]>([]);
  const [driverReviews, setDriverReviews] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeCOOReviewMonitor((data) => {
      setRestaurantReviews(data.restaurantReviews);
      setDriverReviews(data.driverReviews);
    });

    return () => unsubscribe();
  }, []);

  return {
    restaurantReviews,
    driverReviews,
  };
};
