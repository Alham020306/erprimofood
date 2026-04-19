const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");

const isCompletedOrder = (order: any) =>
  safeString(order?.status).toUpperCase() === "COMPLETED";

const isCancelledOrder = (order: any) => {
  const status = safeString(order?.status).toUpperCase();
  return status === "CANCELLED" || status === "REJECTED";
};

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

export const buildCEOOperationsFeed = (raw: any) => {
  const orders = safeArray(raw?.orders);
  const reviews = safeArray(raw?.reviews);
  const driverReviews = safeArray(raw?.driverReviews);

  return {
    latestOrders: [...orders]
      .sort(
        (a, b) =>
          safeNumber(b?.updatedAt || b?.timestamp) -
          safeNumber(a?.updatedAt || a?.timestamp)
      )
      .slice(0, 5)
      .map((order: any) => ({
        id: order?.id || "",
        restaurantName: order?.restaurantName || "-",
        customerName: order?.customerName || "-",
        driverName: order?.driverName || "-",
        status: order?.status || "-",
        updatedAt: safeNumber(order?.updatedAt || order?.timestamp),
      })),
    latestRestaurantReviews: [...reviews]
      .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
      .slice(0, 3)
      .map((review: any) => ({
        id: review?.id || "",
        customerName: review?.customerName || review?.customerId || "-",
        comment: review?.comment || "Tanpa komentar.",
        orderId: review?.orderId || "-",
        createdAt: safeNumber(review?.createdAt),
      })),
    latestDriverReviews: [...driverReviews]
      .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
      .slice(0, 3)
      .map((review: any) => ({
        id: review?.id || "",
        driverId: review?.driverId || "-",
        rating: review?.rating ?? "-",
        customerName: review?.customerName || review?.customerId || "-",
        orderId: review?.orderId || "-",
      })),
  };
};

export const buildCEOOverview = (raw: any) => {
  const users = safeArray(raw?.users);
  const restaurants = safeArray(raw?.restaurants);
  const orders = safeArray(raw?.orders);
  const reviews = safeArray(raw?.reviews);
  const driverReviews = safeArray(raw?.driverReviews);
  const campaigns = safeArray(raw?.cmoCampaigns || raw?.campaigns);
  const employees = safeArray(raw?.erpEmployees);

  const completedOrders = orders.filter(isCompletedOrder);
  const cancelledOrders = orders.filter(isCancelledOrder);
  const readyCookingOrders = orders.filter((order: any) => {
    const status = safeString(order?.status).toUpperCase();
    return status === "READY" || status === "COOKING";
  });

  const totalRevenue = completedOrders.reduce(
    (sum: number, order: any) => sum + safeNumber(order?.total),
    0
  );

  const cancelRate =
    orders.length > 0
      ? Number(((cancelledOrders.length / orders.length) * 100).toFixed(1))
      : 0;

  return {
    totalRevenue,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    readyCookingOrders: readyCookingOrders.length,
    cancelRate,
    totalUsers: users.length,
    totalMerchants: restaurants.length,
    totalCampaigns: campaigns.length,
    totalEmployees: employees.length,
    totalRestaurantReviews: reviews.length,
    totalDriverReviews: driverReviews.length,
  };
};

export const buildCEORoleReports = (raw: any) => {
  const users = safeArray(raw?.users);
  const restaurants = safeArray(raw?.restaurants);
  const orders = safeArray(raw?.orders);
  const campaigns = safeArray(raw?.cmoCampaigns || raw?.campaigns);
  const employees = safeArray(raw?.erpEmployees);

  const drivers = users.filter(
    (u: any) => safeString(u?.role).trim().toUpperCase() === "DRIVER"
  );

  const verifiedDrivers = drivers.filter((d: any) => d?.isVerified === true);
  const onlineDrivers = drivers.filter((d: any) => d?.isOnline === true);
  const activeCampaigns = campaigns.filter((c: any) => c?.status === "ACTIVE");

  return [
    {
      role: "CTO",
      title: "Technology & Systems",
      summary: `${onlineDrivers.length} driver signal online, ${restaurants.length} merchant data monitored`,
      status: "ACTIVE",
    },
    {
      role: "COO",
      title: "Operations",
      summary: `${orders.length} total orders, ${completedOrdersCount(orders)} completed, ${pendingOrdersCount(orders)} pending`,
      status: "ACTIVE",
    },
    {
      role: "CFO",
      title: "Finance",
      summary: `Revenue Rp ${completedOrdersRevenue(orders).toLocaleString("id-ID")}, cancel rate ${cancelRateValue(orders)}%`,
      status: "MONITORED",
    },
    {
      role: "CMO",
      title: "Marketing",
      summary: `${campaigns.length} campaigns, ${activeCampaigns.length} active campaigns`,
      status: "ACTIVE",
    },
    {
      role: "HR",
      title: "Human Resources",
      summary: `${drivers.length} drivers, ${verifiedDrivers.length} verified, ${employees.length} employees`,
      status: "ACTIVE",
    },
    {
      role: "SECRETARY",
      title: "Executive Coordination",
      summary: `Cross-role follow-up and reporting coordination active`,
      status: "ACTIVE",
    },
  ];
};

export const buildCEOAlerts = (raw: any) => {
  const users = safeArray(raw?.users);
  const restaurants = safeArray(raw?.restaurants);
  const orders = safeArray(raw?.orders);
  const campaigns = safeArray(raw?.cmoCampaigns || raw?.campaigns);

  const alerts: any[] = [];

  const drivers = users.filter(
    (u: any) => safeString(u?.role).trim().toUpperCase() === "DRIVER"
  );
  const onlineDrivers = drivers.filter((d: any) => d?.isOnline === true);
  const cancelledOrders = orders.filter(isCancelledOrder);

  const cancelRate =
    orders.length > 0
      ? Number(((cancelledOrders.length / orders.length) * 100).toFixed(1))
      : 0;

  if (onlineDrivers.length === 0 && drivers.length > 0) {
    alerts.push({
      id: "no-online-drivers",
      severity: "HIGH",
      source: "COO",
      title: "No Online Drivers",
      message: "Tidak ada driver online saat ini.",
    });
  }

  if (cancelRate >= 20) {
    alerts.push({
      id: "high-cancel-rate",
      severity: "HIGH",
      source: "CFO/COO",
      title: "High Cancel Rate",
      message: `Cancel rate mencapai ${cancelRate}%.`,
    });
  }

  const inactiveMerchants = restaurants.filter((r: any) => {
    const isOpen = r?.isOpen ?? true;
    const isBanned = r?.isBanned === true;
    return !isOpen || isBanned;
  });

  if (inactiveMerchants.length >= 5) {
    alerts.push({
      id: "inactive-merchants",
      severity: "MEDIUM",
      source: "COO",
      title: "Inactive Merchant Spike",
      message: `${inactiveMerchants.length} merchant sedang non-operasional.`,
    });
  }

  const activeCampaigns = campaigns.filter((c: any) => c?.status === "ACTIVE");
  if (campaigns.length > 0 && activeCampaigns.length === 0) {
    alerts.push({
      id: "no-active-campaign",
      severity: "LOW",
      source: "CMO",
      title: "No Active Campaign",
      message: "Tidak ada campaign marketing aktif.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "system-stable",
      severity: "INFO",
      source: "SYSTEM",
      title: "Executive Summary Stable",
      message: "Tidak ada alert kritikal saat ini.",
    });
  }

  return alerts;
};

export const buildCEODecisionItems = (raw: any) => {
  const orders = safeArray(raw?.orders).filter(isCompletedOrder);
  const users = safeArray(raw?.users);
  const campaigns = safeArray(raw?.cmoCampaigns || raw?.campaigns);
  const driverReviews = safeArray(raw?.driverReviews);

  const drivers = users.filter(
    (u: any) => safeString(u?.role).trim().toUpperCase() === "DRIVER"
  );

  const areaMap = new Map<
    string,
    {
      area: string;
      orders: number;
      drivers: number;
    }
  >();

  orders.forEach((order: any) => {
    const area = normalizeArea(order);
    const prev = areaMap.get(area) || { area, orders: 0, drivers: 0 };
    prev.orders += 1;
    areaMap.set(area, prev);
  });

  drivers.forEach((driver: any) => {
    const area = normalizeArea(driver);
    const prev = areaMap.get(area) || { area, orders: 0, drivers: 0 };
    prev.drivers += 1;
    areaMap.set(area, prev);
  });

  const decisions: any[] = [];

  Array.from(areaMap.values()).forEach((item) => {
    if (item.orders >= 20 && item.drivers < 3) {
      decisions.push({
        id: `hire-${item.area}`,
        title: `Tambah driver di area ${item.area}`,
        owner: "HR/COO",
        priority: "HIGH",
      });
    }
  });

  if (campaigns.filter((c: any) => c?.status === "ACTIVE").length === 0) {
    decisions.push({
      id: "activate-growth",
      title: "Aktifkan minimal 1 campaign growth",
      owner: "CMO",
      priority: "MEDIUM",
    });
  }

  const lowDriverRatings = driverReviews.filter((item: any) => safeNumber(item?.rating) <= 3);
  if (lowDriverRatings.length >= 3) {
    decisions.push({
      id: "driver-quality-review",
      title: "Audit kualitas layanan driver dan coaching area bermasalah",
      owner: "COO/HR",
      priority: "HIGH",
    });
  }

  if (decisions.length === 0) {
    decisions.push({
      id: "maintain-stability",
      title: "Maintain current execution and monitor key signals",
      owner: "ALL C-LEVEL",
      priority: "NORMAL",
    });
  }

  return decisions;
};

export const buildCEOExecutiveSnapshot = (raw: any) => ({
  ...buildCEOOverview(raw),
  ...buildCEOOperationsFeed(raw),
  alerts: buildCEOAlerts(raw),
  roleReports: buildCEORoleReports(raw),
  decisions: buildCEODecisionItems(raw),
});

const completedOrdersCount = (orders: any[]) =>
  orders.filter(isCompletedOrder).length;

const pendingOrdersCount = (orders: any[]) =>
  orders.filter((o: any) => safeString(o?.status).toUpperCase() === "PENDING").length;

const completedOrdersRevenue = (orders: any[]) =>
  orders
    .filter(isCompletedOrder)
    .reduce((sum: number, order: any) => sum + safeNumber(order?.total), 0);

const cancelRateValue = (orders: any[]) => {
  const cancelled = orders.filter(isCancelledOrder);
  return orders.length > 0
    ? Number(((cancelled.length / orders.length) * 100).toFixed(1))
    : 0;
};
