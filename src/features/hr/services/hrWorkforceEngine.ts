const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");

const normalizeArea = (item: any) => {
  const raw =
    item?.operationalArea ||
    item?.district ||
    item?.area ||
    item?.city ||
    item?.address ||
    "UNKNOWN_AREA";

  return safeString(raw).trim() || "UNKNOWN_AREA";
};

const isDriver = (user: any) =>
  safeString(user?.role).trim().toUpperCase() === "DRIVER";

const isCompletedOrder = (order: any) =>
  safeString(order?.status).toUpperCase() === "COMPLETED";

export const buildHRDashboardOverview = (raw: any) => {
  const users = safeArray(raw?.users);
  const erpEmployees = safeArray(raw?.erpEmployees);

  const drivers = users.filter(isDriver);
  const pendingDriverVerification = drivers.filter(
    (d: any) => d?.isVerified !== true
  );
  const verifiedDrivers = drivers.filter((d: any) => d?.isVerified === true);
  const bannedDrivers = drivers.filter((d: any) => d?.isBanned === true);

  return {
    totalDrivers: drivers.length,
    verifiedDrivers: verifiedDrivers.length,
    pendingDriverVerification: pendingDriverVerification.length,
    bannedDrivers: bannedDrivers.length,
    totalEmployees: erpEmployees.length,
  };
};

export const buildHRDriverRecruitmentRows = (raw: any) => {
  const users = safeArray(raw?.users);
  const drivers = users.filter(isDriver);

  return drivers
    .map((driver: any) => ({
      id: driver?.id,
      name: driver?.name ?? "-",
      email: driver?.email ?? "-",
      phone: driver?.phone ?? "-",
      area: normalizeArea(driver),
      vehicleBrand: driver?.vehicleBrand ?? "-",
      plateNumber: driver?.plateNumber ?? "-",
      isVerified: driver?.isVerified === true,
      isTokenVerified: driver?.isTokenVerified === true,
      isOnline: driver?.isOnline === true,
      isBanned: driver?.isBanned === true,
      createdAt: safeNumber(driver?.createdAt),
      raw: driver,
    }))
    .sort((a: any, b: any) => b.createdAt - a.createdAt);
};

export const buildHRWorkforceDemand = (raw: any) => {
  const users = safeArray(raw?.users);
  const orders = safeArray(raw?.orders).filter(isCompletedOrder);

  const drivers = users.filter(isDriver);

  const areaMap = new Map<
    string,
    {
      area: string;
      drivers: number;
      verifiedDrivers: number;
      onlineDrivers: number;
      orders: number;
    }
  >();

  drivers.forEach((driver: any) => {
    const area = normalizeArea(driver);

    const prev = areaMap.get(area) || {
      area,
      drivers: 0,
      verifiedDrivers: 0,
      onlineDrivers: 0,
      orders: 0,
    };

    prev.drivers += 1;
    if (driver?.isVerified === true) prev.verifiedDrivers += 1;
    if (driver?.isOnline === true) prev.onlineDrivers += 1;

    areaMap.set(area, prev);
  });

  orders.forEach((order: any) => {
    const area = normalizeArea(order);

    const prev = areaMap.get(area) || {
      area,
      drivers: 0,
      verifiedDrivers: 0,
      onlineDrivers: 0,
      orders: 0,
    };

    prev.orders += 1;
    areaMap.set(area, prev);
  });

  return Array.from(areaMap.values())
    .map((item) => {
      let recommendation = "STABLE";
      if (item.orders >= 20 && item.verifiedDrivers < 3) {
        recommendation = "URGENT_HIRING";
      } else if (item.orders >= 10 && item.verifiedDrivers < 2) {
        recommendation = "NEED_HIRING";
      } else if (item.orders === 0 && item.drivers >= 5) {
        recommendation = "OVERSTAFFED";
      }

      return {
        ...item,
        recommendation,
      };
    })
    .sort((a: any, b: any) => b.orders - a.orders);
};

export const buildHREmployeeRows = (raw: any) => {
  const employees = safeArray(raw?.erpEmployees);

  return employees
    .map((item: any) => ({
      id: item?.id,
      name: item?.name ?? "-",
      email: item?.email ?? "-",
      phone: item?.phone ?? "-",
      department: item?.department ?? "-",
      role: item?.role ?? "-",
      status: item?.status ?? "ACTIVE",
      createdAt: safeNumber(item?.createdAt),
      raw: item,
    }))
    .sort((a: any, b: any) => b.createdAt - a.createdAt);
};

export const buildHRDashboardSnapshot = (raw: any) => ({
  ...buildHRDashboardOverview(raw),
  workforceDemand: buildHRWorkforceDemand(raw),
});
