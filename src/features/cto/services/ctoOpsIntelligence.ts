const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");

const isDriver = (user: any) =>
  safeString(user?.role).toUpperCase() === "DRIVER";

const normalizeArea = (item: any) => {
  const raw =
    item?.operationalArea ||
    item?.district ||
    item?.area ||
    item?.city ||
    item?.address ||
    item?.deliveryArea ||
    "UNKNOWN_AREA";

  return safeString(raw).trim() || "UNKNOWN_AREA";
};

export const buildDriverMonitorData = (raw: any) => {
  const users = safeArray(raw?.users);
  const drivers = users.filter(isDriver);

  return drivers
    .map((driver: any) => {
      const updatedAt = safeNumber(
        driver?.locationUpdatedAt || driver?.updatedAt || driver?.lastSeenAt || 0
      );

      const now = Date.now();
      const ageMs = updatedAt ? now - updatedAt : Number.MAX_SAFE_INTEGER;

      const freshness =
        ageMs <= 60_000
          ? "LIVE"
          : ageMs <= 5 * 60_000
          ? "STALE"
          : "OFFLINE_SIGNAL";

      const isOnline = driver?.isOnline === true;
      const speed = safeNumber(driver?.speed || 0);
      const isMoving = speed > 3;

      const risk =
        !isOnline
          ? "OFFLINE"
          : freshness === "OFFLINE_SIGNAL"
          ? "NO_SIGNAL"
          : freshness === "STALE"
          ? "STALE"
          : !isMoving
          ? "IDLE"
          : "NORMAL";

      return {
        ...driver,
        area: normalizeArea(driver),
        freshness,
        risk,
        isMoving,
        speed,
        updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const buildMerchantZoneData = (raw: any) => {
  const restaurants = safeArray(raw?.restaurants);

  const rows = restaurants.map((merchant: any) => {
    const area = normalizeArea(merchant);
    const isOpen = merchant?.isOpen ?? true;
    const isBanned = merchant?.isBanned === true;

    return {
      ...merchant,
      area,
      isOperational: isOpen && !isBanned,
    };
  });

  const grouped = new Map<
    string,
    {
      area: string;
      totalMerchants: number;
      openMerchants: number;
      closedMerchants: number;
    }
  >();

  rows.forEach((item) => {
    const prev = grouped.get(item.area) || {
      area: item.area,
      totalMerchants: 0,
      openMerchants: 0,
      closedMerchants: 0,
    };

    prev.totalMerchants += 1;
    if (item.isOperational) prev.openMerchants += 1;
    if (!item.isOperational) prev.closedMerchants += 1;

    grouped.set(item.area, prev);
  });

  return {
    merchants: rows.sort((a, b) => a.area.localeCompare(b.area)),
    zones: Array.from(grouped.values()).sort((a, b) =>
      a.area.localeCompare(b.area)
    ),
  };
};

export const buildExpansionData = (raw: any) => {
  const users = safeArray(raw?.users);
  const restaurants = safeArray(raw?.restaurants);
  const orders = safeArray(raw?.orders);

  const drivers = users.filter(isDriver);

  const areaMap = new Map<
    string,
    {
      area: string;
      drivers: number;
      merchants: number;
      activeMerchants: number;
      orders: number;
    }
  >();

  drivers.forEach((driver: any) => {
    const area = normalizeArea(driver);
    const prev = areaMap.get(area) || {
      area,
      drivers: 0,
      merchants: 0,
      activeMerchants: 0,
      orders: 0,
    };
    prev.drivers += 1;
    areaMap.set(area, prev);
  });

  restaurants.forEach((merchant: any) => {
    const area = normalizeArea(merchant);
    const prev = areaMap.get(area) || {
      area,
      drivers: 0,
      merchants: 0,
      activeMerchants: 0,
      orders: 0,
    };
    prev.merchants += 1;
    if ((merchant?.isOpen ?? true) && merchant?.isBanned !== true) {
      prev.activeMerchants += 1;
    }
    areaMap.set(area, prev);
  });

  orders.forEach((order: any) => {
    const area = normalizeArea(order);
    const prev = areaMap.get(area) || {
      area,
      drivers: 0,
      merchants: 0,
      activeMerchants: 0,
      orders: 0,
    };
    prev.orders += 1;
    areaMap.set(area, prev);
  });

  const analysis = Array.from(areaMap.values()).map((item) => {
    const demandScore = item.orders * 3;
    const merchantCoverage = item.activeMerchants * 2;
    const driverCoverage = item.drivers * 2;
    const readiness = demandScore - merchantCoverage - driverCoverage;

    let recommendation = "STABLE";

    if (item.orders > 0 && item.activeMerchants === 0) {
      recommendation = "NEED_MERCHANT_FIRST";
    } else if (item.orders > item.drivers * 2) {
      recommendation = "NEED_DRIVER_FIRST";
    } else if (readiness >= 6) {
      recommendation = "HIGH_POTENTIAL";
    } else if (item.orders === 0 && item.merchants > 0 && item.drivers > 0) {
      recommendation = "LOW_ACTIVITY";
    }

    return {
      ...item,
      demandScore,
      merchantCoverage,
      driverCoverage,
      readiness,
      recommendation,
    };
  });

  return analysis.sort((a, b) => b.readiness - a.readiness);
};