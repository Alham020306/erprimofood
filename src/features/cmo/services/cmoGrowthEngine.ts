const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getOrderTimestamp = (order: any) =>
  safeNumber(
    order?.timestamp ||
      order?.createdAt ||
      order?.updatedAt ||
      order?.createdAtMs ||
      0
  );

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

const isCompletedOrder = (order: any) =>
  safeString(order?.status).toUpperCase() === "COMPLETED";

const isCancelledOrder = (order: any) => {
  const status = safeString(order?.status).toUpperCase();
  return status === "CANCELLED" || status === "REJECTED";
};

export const buildCMOGrowthOverview = (raw: any) => {
  const users = safeArray(raw?.users);
  const orders = safeArray(raw?.orders);
  const restaurants = safeArray(raw?.restaurants);
  const banners = safeArray(raw?.banners || raw?.ads);
  const categories = safeArray(raw?.categories);
  const menus = safeArray(raw?.menus);

  const todayStart = startOfDay(new Date());
  const last7d = daysAgo(7);
  const last30d = daysAgo(30);

  const usersLast7d = users.filter((u: any) => safeNumber(u?.createdAt) >= last7d);
  const usersLast30d = users.filter((u: any) => safeNumber(u?.createdAt) >= last30d);

  const ordersLast7d = orders.filter((o: any) => getOrderTimestamp(o) >= last7d);
  const ordersLast30d = orders.filter((o: any) => getOrderTimestamp(o) >= last30d);
  const ordersToday = orders.filter((o: any) => getOrderTimestamp(o) >= todayStart);

  const completedLast30d = ordersLast30d.filter(isCompletedOrder);
  const cancelledLast30d = ordersLast30d.filter(isCancelledOrder);

  const grossRevenue30d = completedLast30d.reduce(
    (sum: number, order: any) => sum + safeNumber(order?.total),
    0
  );

  const uniqueCustomers30d = new Set(
    completedLast30d
      .map((o: any) => safeString(o?.customerId))
      .filter(Boolean)
  ).size;

  const activeAds = banners.length;
  const promoMenus = menus.filter((menu: any) => menu?.isPromo === true).length;
  const trendingMenus = menus.filter((menu: any) => menu?.isTrending === true).length;
  const availableMenus = menus.filter((menu: any) => menu?.isAvailable !== false).length;
  const brandedRestaurants = restaurants.filter((item: any) => !!safeString(item?.image)).length;

  const conversionRate =
    usersLast30d.length > 0
      ? Number(((uniqueCustomers30d / usersLast30d.length) * 100).toFixed(1))
      : 0;

  const cancelRate =
    ordersLast30d.length > 0
      ? Number(((cancelledLast30d.length / ordersLast30d.length) * 100).toFixed(1))
      : 0;

  return {
    totalUsers: users.length,
    newUsers7d: usersLast7d.length,
    newUsers30d: usersLast30d.length,
    ordersToday: ordersToday.length,
    orders7d: ordersLast7d.length,
    orders30d: ordersLast30d.length,
    completed30d: completedLast30d.length,
    cancelled30d: cancelledLast30d.length,
    grossRevenue30d,
    restaurantsCount: restaurants.length,
    activeAds,
    totalCategories: categories.length,
    totalMenus: menus.length,
    availableMenus,
    promoMenus,
    trendingMenus,
    brandedRestaurants,
    uniqueCustomers30d,
    conversionRate,
    cancelRate,
  };
};

export const buildCMOUserInsights = (raw: any) => {
  const users = safeArray(raw?.users);
  const orders = safeArray(raw?.orders);

  const completedOrders = orders.filter(isCompletedOrder);
  const last30d = daysAgo(30);
  const last60d = daysAgo(60);

  return users
    .map((user: any) => {
      const userOrders = completedOrders.filter(
        (o: any) => safeString(o?.customerId) === safeString(user?.id)
      );

      const recent30d = userOrders.filter(
        (o: any) => getOrderTimestamp(o) >= last30d
      );
      const recent60d = userOrders.filter(
        (o: any) => getOrderTimestamp(o) >= last60d
      );

      const totalSpend = userOrders.reduce(
        (sum: number, o: any) => sum + safeNumber(o?.total),
        0
      );

      let segment = "NEW";
      if (userOrders.length >= 10 || totalSpend >= 500000) segment = "VIP";
      else if (userOrders.length >= 3) segment = "LOYAL";
      else if (userOrders.length >= 1) segment = "ACTIVE";

      let churnRisk = "LOW";
      if (recent30d.length === 0 && recent60d.length > 0) churnRisk = "HIGH";
      else if (recent30d.length === 0 && userOrders.length > 0) churnRisk = "MEDIUM";

      return {
        id: user?.id,
        name: user?.name ?? "-",
        email: user?.email ?? "-",
        phone: user?.phone ?? "-",
        createdAt: user?.createdAt ?? 0,
        totalOrders: userOrders.length,
        totalSpend,
        segment,
        churnRisk,
        lastOrderAt: userOrders.length
          ? Math.max(...userOrders.map((o: any) => getOrderTimestamp(o)))
          : 0,
      };
    })
    .filter((u: any) => !!u.id)
    .sort((a: any, b: any) => b.totalSpend - a.totalSpend);
};

export const buildCMOAreaGrowth = (raw: any) => {
  const orders = safeArray(raw?.orders).filter(isCompletedOrder);
  const restaurants = safeArray(raw?.restaurants);

  const areaMap = new Map<
    string,
    {
      area: string;
      orders: number;
      revenue: number;
      merchants: number;
    }
  >();

  restaurants.forEach((merchant: any) => {
    const area = normalizeArea(merchant);
    const prev = areaMap.get(area) || {
      area,
      orders: 0,
      revenue: 0,
      merchants: 0,
    };
    prev.merchants += 1;
    areaMap.set(area, prev);
  });

  orders.forEach((order: any) => {
    const area = normalizeArea(order);
    const prev = areaMap.get(area) || {
      area,
      orders: 0,
      revenue: 0,
      merchants: 0,
    };
    prev.orders += 1;
    prev.revenue += safeNumber(order?.total);
    areaMap.set(area, prev);
  });

  return Array.from(areaMap.values())
    .map((item) => {
      let signal = "STABLE";
      if (item.orders >= 20 && item.merchants <= 2) signal = "HIGH_DEMAND";
      else if (item.orders === 0 && item.merchants > 0) signal = "LOW_CONVERSION";

      return {
        ...item,
        signal,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
};

export const buildCMODailyGrowthSeries = (raw: any, days = 14) => {
  const orders = safeArray(raw?.orders).filter(isCompletedOrder);

  const result: { date: string; orders: number; revenue: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = startOfDay(d);
    const end = start + 24 * 60 * 60 * 1000;

    const dayOrders = orders.filter((o: any) => {
      const ts = getOrderTimestamp(o);
      return ts >= start && ts < end;
    });

    result.push({
      date: new Date(start).toISOString().slice(0, 10),
      orders: dayOrders.length,
      revenue: dayOrders.reduce(
        (sum: number, o: any) => sum + safeNumber(o?.total),
        0
      ),
    });
  }

  return result;
};

export const buildCMOSegmentSummary = (rows: any[]) => {
  const vip = rows.filter((r: any) => r.segment === "VIP");
  const loyal = rows.filter((r: any) => r.segment === "LOYAL");
  const active = rows.filter((r: any) => r.segment === "ACTIVE");
  const highRisk = rows.filter((r: any) => r.churnRisk === "HIGH");

  return {
    vipCount: vip.length,
    loyalCount: loyal.length,
    activeCount: active.length,
    highRiskCount: highRisk.length,
    vipRevenue: vip.reduce((sum: number, r: any) => sum + safeNumber(r.totalSpend), 0),
    loyalRevenue: loyal.reduce((sum: number, r: any) => sum + safeNumber(r.totalSpend), 0),
  };
};

export const buildCampaignROI = (campaigns: any[], raw: any) => {
  const orders = safeArray(raw?.orders).filter(isCompletedOrder);

  return campaigns.map((campaign: any) => {
    const budget = safeNumber(campaign?.budget);
    const title = safeString(campaign?.title).toLowerCase();
    const targetArea = safeString(campaign?.targetArea).toLowerCase();

    const relatedOrders = orders.filter((o: any) => {
      const area = normalizeArea(o).toLowerCase();
      if (targetArea && targetArea !== "all" && area.includes(targetArea)) return true;
      return title && title !== "" ? area.includes(targetArea) || targetArea === "" : false;
    });

    const attributedRevenue = relatedOrders.reduce(
      (sum: number, o: any) => sum + safeNumber(o?.total),
      0
    );

    const roi =
      budget > 0
        ? Number((((attributedRevenue - budget) / budget) * 100).toFixed(1))
        : 0;

    return {
      ...campaign,
      attributedOrders: relatedOrders.length,
      attributedRevenue,
      roi,
    };
  });
};

export const buildCMODashboardSnapshot = (raw: any) => {
  const userInsights = buildCMOUserInsights(raw);

  return {
    ...buildCMOGrowthOverview(raw),
    areaGrowth: buildCMOAreaGrowth(raw),
    dailySeries: buildCMODailyGrowthSeries(raw, 14),
    segmentSummary: buildCMOSegmentSummary(userInsights),
    highRiskUsers: userInsights
      .filter((item: any) => item.churnRisk === "HIGH")
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        churnRisk: item.churnRisk,
        lastOrderAt: item.lastOrderAt,
      })),
  };
};
