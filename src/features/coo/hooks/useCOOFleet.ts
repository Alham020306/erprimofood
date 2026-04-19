import { useMemo, useState } from "react";
import { useCOODashboard } from "./useCOODashboard";

export const useCOOFleet = () => {
  const { raw, loading } = useCOODashboard();

  const [driverQuery, setDriverQuery] = useState("");
  const [driverStatus, setDriverStatus] = useState("ALL");
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);

  const drivers = useMemo(() => {
    const base =
      raw?.users?.filter(
        (u: any) => String(u?.role || "").toUpperCase() === "DRIVER"
      ) || [];

    return base
      .filter((driver: any) =>
        String(driver?.name || "")
          .toLowerCase()
          .includes(driverQuery.toLowerCase())
      )
      .filter((driver: any) => {
        if (driverStatus === "ALL") return true;
        const isOnline = driver?.isOnline === true;
        return driverStatus === "ONLINE" ? isOnline : !isOnline;
      });
  }, [raw, driverQuery, driverStatus]);

  const summary = useMemo(() => {
    const base =
      raw?.users?.filter(
        (u: any) => String(u?.role || "").toUpperCase() === "DRIVER"
      ) || [];

    const online = base.filter((d: any) => d?.isOnline === true).length;
    const offline = base.length - online;
    const unpaid = base.reduce(
      (sum: number, d: any) => sum + Number(d?.totalUnpaidCommission || 0),
      0
    );

    return {
      total: base.length,
      online,
      offline,
      unpaid,
    };
  }, [raw]);

  return {
    loading,
    drivers,
    summary,
    driverQuery,
    setDriverQuery,
    driverStatus,
    setDriverStatus,
    selectedDriver,
    setSelectedDriver,
  };
};