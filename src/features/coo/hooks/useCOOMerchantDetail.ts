import { useEffect, useMemo, useState } from "react";
import {
  subscribeCOOMerchantMenus,
  subscribeCOOMerchantOrders,
  subscribeCOOMerchantReviews,
} from "../services/cooDetailService";

export const useCOOMerchantDetail = (merchant: any | null) => {
  const merchantId = String(merchant?.id || merchant?.ownerId || "");
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    if (!merchantId) {
      setOrders([]);
      setReviews([]);
      setMenus([]);
      return;
    }

    const unsubs = [
      subscribeCOOMerchantOrders(merchantId, setOrders),
      subscribeCOOMerchantReviews(merchantId, setReviews),
      subscribeCOOMerchantMenus(merchantId, setMenus),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [merchantId]);

  return useMemo(
    () => ({
      orders,
      reviews,
      menus,
    }),
    [menus, orders, reviews]
  );
};
