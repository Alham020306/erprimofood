const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");

const isDriver = (user: any) =>
  safeString(user?.role).trim().toUpperCase() === "DRIVER";

const isActiveOrder = (order: any) => {
  const status = safeString(order?.status).toUpperCase();
  if (!status) return false;
  return !["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
};

const normalizeArea = (item: any) => {
  const raw =
    item?.operationalArea ||
    item?.district ||
    item?.area ||
    item?.city ||
    item?.address ||
    item?.deliveryArea ||
    item?.raw?.operationalArea ||
    "UNKNOWN_AREA";

  return safeString(raw).trim() || "UNKNOWN_AREA";
};

const getLat = (item: any) =>
  safeNumber(
    item?.lat ??
      item?.coords?.lat ??
      item?.latitude ??
      item?.location?.lat ??
      item?.location?.latitude ??
      item?.position?.lat ??
      item?.position?.latitude ??
      item?.addressLat ??
      item?.raw?.lat ??
      item?.raw?.coords?.lat ??
      0
  );

const getLng = (item: any) =>
  safeNumber(
    item?.lng ??
      item?.coords?.lng ??
      item?.longitude ??
      item?.location?.lng ??
      item?.location?.longitude ??
      item?.position?.lng ??
      item?.position?.longitude ??
      item?.addressLng ??
      item?.raw?.lng ??
      item?.raw?.coords?.lng ??
      0
  );

const hasCoords = (item: any) => {
  const lat = getLat(item);
  const lng = getLng(item);
  return lat !== 0 && lng !== 0;
};

const pointInPolygon = (
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
) => {
  if (!polygon || polygon.length < 3) return false;

  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = safeNumber(polygon[i]?.lng);
    const yi = safeNumber(polygon[i]?.lat);
    const xj = safeNumber(polygon[j]?.lng);
    const yj = safeNumber(polygon[j]?.lat);

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

const buildDriverFreshness = (driver: any) => {
  const updatedAt = safeNumber(
    driver?.locationUpdatedAt || driver?.updatedAt || driver?.lastSeenAt || 0
  );

  const now = Date.now();
  const ageMs = updatedAt ? now - updatedAt : Number.MAX_SAFE_INTEGER;

  if (ageMs <= 60_000) return "LIVE";
  if (ageMs <= 5 * 60_000) return "STALE";
  return "OFFLINE_SIGNAL";
};

export const buildCTOMapData = (raw: any, config?: any) => {
  const restaurants = safeArray(raw?.restaurants);
  const users = safeArray(raw?.users);
  const orders = safeArray(raw?.orders);

  const zone = safeArray(config?.zone);
  const settings = config?.settings || {};
  const allDrivers = users.filter(isDriver);
  const activeOrders = orders.filter(isActiveOrder);

  const zonePolygon = zone
    .map((p: any) => ({
      lat: safeNumber(p?.lat),
      lng: safeNumber(p?.lng),
    }))
    .filter((p: any) => p.lat !== 0 && p.lng !== 0);

  const merchantMarkers = restaurants
    .filter(hasCoords)
    .map((merchant: any) => {
      const lat = getLat(merchant);
      const lng = getLng(merchant);
      const insideZone =
        zonePolygon.length >= 3 ? pointInPolygon({ lat, lng }, zonePolygon) : true;
      const isOpen = merchant?.isOpen ?? true;
      const isBanned = merchant?.isBanned === true;

      return {
        id: merchant.id,
        type: "MERCHANT",
        name: merchant.name ?? "Unnamed Merchant",
        ownerId: merchant.ownerId ?? null,
        phone: merchant.phone ?? null,
        email: merchant.email ?? null,
        address: merchant.address ?? null,
        area: normalizeArea(merchant),
        lat,
        lng,
        isOpen,
        isBanned,
        isOperational: isOpen && !isBanned,
        insideZone,
        rating: merchant.rating ?? 0,
        totalOrders: merchant.totalOrders ?? 0,
        balance: merchant.balance ?? 0,
        totalUnpaidCommission: merchant.totalUnpaidCommission ?? 0,
        createdAt: merchant.createdAt ?? null,
        risk: !insideZone
          ? "OUT_OF_ZONE"
          : isOpen && !isBanned
          ? "NORMAL"
          : "INACTIVE",
        raw: merchant,
      };
    });

  const driverList = allDrivers.map((driver: any) => {
    const lat = getLat(driver);
    const lng = getLng(driver);
    const hasLocation = lat !== 0 && lng !== 0;
    const insideZone =
      hasLocation && zonePolygon.length >= 3
        ? pointInPolygon({ lat, lng }, zonePolygon)
        : false;

    const freshness = buildDriverFreshness(driver);
    const isOnline = driver?.isOnline === true;
    const speed = safeNumber(driver?.speed || 0);
    const isMoving = speed > 3;

    let risk = "NORMAL";
    if (!hasLocation) risk = "NO_LOCATION";
    else if (!insideZone) risk = "OUT_OF_ZONE";
    else if (!isOnline) risk = "OFFLINE";
    else if (freshness === "OFFLINE_SIGNAL") risk = "NO_SIGNAL";
    else if (freshness === "STALE") risk = "STALE";
    else if (!isMoving) risk = "IDLE";

    return {
      id: driver.id,
      type: "DRIVER",
      name: driver.name ?? "Unnamed Driver",
      phone: driver.phone ?? null,
      email: driver.email ?? null,
      area: normalizeArea(driver),
      lat,
      lng,
      hasLocation,
      isOnline,
      isVerified: driver?.isVerified === true,
      isBanned: driver?.isBanned === true,
      speed,
      isMoving,
      freshness,
      insideZone,
      risk,
      updatedAt: safeNumber(
        driver?.locationUpdatedAt || driver?.updatedAt || driver?.lastSeenAt || 0
      ),
      vehicleBrand: driver.vehicleBrand ?? null,
      plateNumber: driver.plateNumber ?? null,
      balance: driver.balance ?? 0,
      totalUnpaidCommission: driver.totalUnpaidCommission ?? 0,
      createdAt: driver.createdAt ?? null,
      raw: driver,
    };
  });

  const driverMarkers = driverList.filter((driver) => driver.hasLocation);

  const areaMap = new Map<
    string,
    {
      area: string;
      totalMerchants: number;
      openMerchants: number;
      totalDrivers: number;
      onlineDrivers: number;
      insideDrivers: number;
      totalOrders: number;
      latSum: number;
      lngSum: number;
      pointCount: number;
      merchants: Array<{
        id: string;
        name: string;
        address: string;
        phone: string;
        isOperational: boolean;
        insideZone: boolean;
      }>;
      drivers: Array<{
        id: string;
        name: string;
        phone: string;
        freshness: string;
        isOnline: boolean;
      }>;
    }
  >();

  merchantMarkers.forEach((item) => {
    const prev = areaMap.get(item.area) || {
      area: item.area,
      totalMerchants: 0,
      openMerchants: 0,
      totalDrivers: 0,
      onlineDrivers: 0,
      insideDrivers: 0,
      totalOrders: 0,
      latSum: 0,
      lngSum: 0,
      pointCount: 0,
      merchants: [],
      drivers: [],
    };

    prev.totalMerchants += 1;
    if (item.isOperational) prev.openMerchants += 1;
    prev.latSum += item.lat;
    prev.lngSum += item.lng;
    prev.pointCount += 1;
    prev.merchants.push({
      id: item.id,
      name: item.name,
      address: item.address ?? "-",
      phone: item.phone ?? "-",
      isOperational: item.isOperational,
      insideZone: item.insideZone,
    });

    areaMap.set(item.area, prev);
  });

  driverMarkers.forEach((item) => {
    const prev = areaMap.get(item.area) || {
      area: item.area,
      totalMerchants: 0,
      openMerchants: 0,
      totalDrivers: 0,
      onlineDrivers: 0,
      insideDrivers: 0,
      totalOrders: 0,
      latSum: 0,
      lngSum: 0,
      pointCount: 0,
      merchants: [],
      drivers: [],
    };

    prev.totalDrivers += 1;
    if (item.isOnline) prev.onlineDrivers += 1;
    if (item.insideZone) prev.insideDrivers += 1;
    prev.latSum += item.lat;
    prev.lngSum += item.lng;
    prev.pointCount += 1;
    prev.drivers.push({
      id: item.id,
      name: item.name,
      phone: item.phone ?? "-",
      freshness: item.freshness,
      isOnline: item.isOnline,
    });

    areaMap.set(item.area, prev);
  });

  activeOrders.forEach((order: any) => {
    const area = normalizeArea(order);

    const prev = areaMap.get(area) || {
      area,
      totalMerchants: 0,
      openMerchants: 0,
      totalDrivers: 0,
      onlineDrivers: 0,
      insideDrivers: 0,
      totalOrders: 0,
      latSum: 0,
      lngSum: 0,
      pointCount: 0,
      merchants: [],
      drivers: [],
    };

    prev.totalOrders += 1;
    areaMap.set(area, prev);
  });

  const zoneMarkers = Array.from(areaMap.values()).map((item) => {
    const centerLat = item.pointCount ? item.latSum / item.pointCount : 0;
    const centerLng = item.pointCount ? item.lngSum / item.pointCount : 0;

    let status = "STABLE";
    if (item.totalOrders > 0 && item.openMerchants === 0) status = "NEED_MERCHANT";
    else if (item.totalOrders > item.onlineDrivers * 2) status = "NEED_DRIVER";
    else if (item.totalOrders === 0 && item.totalMerchants > 0) status = "LOW_ACTIVITY";

    return {
      type: "ZONE",
      ...item,
      centerLat,
      centerLng,
      status,
    };
  });

  const mainZoneInsight = {
    type: "AREA",
    name: "Operational Area",
    area: "Main Zone",
    status: zonePolygon.length >= 3 ? "ACTIVE" : "DRAFT",
    points: zonePolygon.length,
    totalMerchants: merchantMarkers.length,
    openMerchants: merchantMarkers.filter((item) => item.isOperational).length,
    totalDrivers: driverMarkers.length,
    onlineDrivers: driverMarkers.filter((item) => item.isOnline).length,
    totalOrders: activeOrders.length,
    merchants: merchantMarkers
      .filter((item) => item.insideZone)
      .map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address ?? "-",
        phone: item.phone ?? "-",
        isOperational: item.isOperational,
        insideZone: item.insideZone,
      })),
    drivers: driverMarkers
      .filter((item) => item.insideZone)
      .map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone ?? "-",
        freshness: item.freshness,
        isOnline: item.isOnline,
      })),
  };

  const allPoints = [...merchantMarkers, ...driverMarkers];
  const mapCenter =
    allPoints.length > 0
      ? {
          lat: allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length,
          lng: allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length,
        }
      : {
          lat: safeNumber(settings?.center?.lat) || 2.3802,
          lng: safeNumber(settings?.center?.lng) || 97.9892,
        };

  return {
    mapCenter,
    zonePolygon,
    merchantMarkers,
    driverMarkers,
    driverList,
    zoneMarkers,
    mainZoneInsight,
    summary: {
      merchantsInZone: merchantMarkers.filter((m) => m.insideZone).length,
      merchantsOutOfZone: merchantMarkers.filter((m) => !m.insideZone).length,
      driversInZone: driverMarkers.filter((d) => d.insideZone).length,
      driversOutOfZone: driverMarkers.filter((d) => !d.insideZone).length,
      liveDrivers: driverMarkers.filter((d) => d.freshness === "LIVE").length,
      staleDrivers: driverMarkers.filter((d) => d.freshness !== "LIVE").length,
      activeOrders: activeOrders.length,
      weakZones: zoneMarkers.filter((z) => z.status !== "STABLE").length,
    },
  };
};
