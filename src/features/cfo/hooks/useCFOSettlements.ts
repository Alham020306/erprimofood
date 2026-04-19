import { useMemo, useState } from "react";
import { useCFODashboard } from "./useCFODashboard";

const isDriver = (user: any) =>
  String(user?.role || "").toUpperCase() === "DRIVER";

export const useCFOSettlements = () => {
  const { dashboard, loading } = useCFODashboard();
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [entityType, setEntityType] = useState<"RESTAURANT" | "DRIVER">("RESTAURANT");

  const restaurants = dashboard?.raw?.restaurants || [];
  const drivers = (dashboard?.raw?.users || []).filter(isDriver);

  const currentList = entityType === "RESTAURANT" ? restaurants : drivers;

  const summary = useMemo(() => {
    const restaurantBalance = restaurants.reduce(
      (sum: number, item: any) => sum + Number(item?.balance || 0),
      0
    );

    const driverBalance = drivers.reduce(
      (sum: number, item: any) => sum + Number(item?.balance || 0),
      0
    );

    const restaurantUnpaid = restaurants.reduce(
      (sum: number, item: any) => sum + Number(item?.totalUnpaidCommission || 0),
      0
    );

    const driverUnpaid = drivers.reduce(
      (sum: number, item: any) => sum + Number(item?.totalUnpaidCommission || 0),
      0
    );

    return {
      totalRestaurantBalance: restaurantBalance,
      totalDriverBalance: driverBalance,
      unpaidRestaurantCommission: restaurantUnpaid,
      unpaidDriverCommission: driverUnpaid,
    };
  }, [restaurants, drivers]);

  return {
    loading,
    entityType,
    setEntityType,
    currentList,
    selectedEntity,
    setSelectedEntity,
    summary,
  };
};