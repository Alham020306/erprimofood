const isValidLedgerRow = (row: any) => {
  return row && typeof row === "object" && Object.keys(row).length > 0;
};

const isDriver = (user: any) =>
  String(user?.role || "").toUpperCase() === "DRIVER";

const toDateKey = (row: any) => String(row?.date || "UNKNOWN");

const groupByDate = (rows: any[]) => {
  const map = new Map<string, { date: string; cashIn: number; cashOut: number; net: number }>();

  rows.forEach((row) => {
    const date = toDateKey(row);
    const prev = map.get(date) || { date, cashIn: 0, cashOut: 0, net: 0 };

    const amount = Number(row?.amount || 0);
    const type = String(row?.type || "").toUpperCase();

    if (type === "IN") prev.cashIn += amount;
    if (type === "OUT") prev.cashOut += amount;

    prev.net = prev.cashIn - prev.cashOut;
    map.set(date, prev);
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const groupByCategory = (rows: any[]) => {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    const category = String(row?.category || "Uncategorized");
    const amount = Number(row?.amount || 0);
    map.set(category, (map.get(category) || 0) + amount);
  });

  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
};

const getTopExpenses = (rows: any[]) => {
  return [...rows]
    .filter((row) => String(row?.type || "").toUpperCase() === "OUT")
    .sort((a, b) => Number(b?.amount || 0) - Number(a?.amount || 0))
    .slice(0, 10);
};

const buildTopRestaurantExposure = (restaurants: any[]) =>
  [...restaurants]
    .sort(
      (a: any, b: any) =>
        Number(b?.totalUnpaidCommission || 0) - Number(a?.totalUnpaidCommission || 0)
    )
    .slice(0, 5)
    .map((item: any) => ({
      id: item?.id,
      name: item?.name || item?.id || "-",
      totalUnpaidCommission: Number(item?.totalUnpaidCommission || 0),
      balance: Number(item?.balance || 0),
    }));

const buildTopDriverExposure = (drivers: any[]) =>
  [...drivers]
    .sort(
      (a: any, b: any) =>
        Number(b?.totalUnpaidCommission || 0) - Number(a?.totalUnpaidCommission || 0)
    )
    .slice(0, 5)
    .map((item: any) => ({
      id: item?.id,
      name: item?.name || item?.id || "-",
      totalUnpaidCommission: Number(item?.totalUnpaidCommission || 0),
      balance: Number(item?.balance || 0),
    }));

const buildOrderStatusSummary = (orders: any[]) =>
  orders.reduce((acc: Record<string, number>, order: any) => {
    const status = String(order?.status || "UNKNOWN").toUpperCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

const inDateRange = (row: any, dateFrom?: string, dateTo?: string) => {
  const rowDate = String(row?.date || "");
  const fromOk = dateFrom ? rowDate >= dateFrom : true;
  const toOk = dateTo ? rowDate <= dateTo : true;
  return fromOk && toOk;
};

export const calculateCFOMetrics = (
  data: any,
  filters?: { dateFrom?: string; dateTo?: string }
) => {
  const operationalLedgerRaw = Array.isArray(data?.operationalLedger)
    ? data.operationalLedger
    : [];
  const restaurants = Array.isArray(data?.restaurants) ? data.restaurants : [];
  const users = Array.isArray(data?.users) ? data.users : [];
  const orders = Array.isArray(data?.orders) ? data.orders : [];

  const dateFrom = filters?.dateFrom || "";
  const dateTo = filters?.dateTo || "";

  const operationalLedger = operationalLedgerRaw
    .filter(isValidLedgerRow)
    .filter((row: any) => inDateRange(row, dateFrom, dateTo));

  const drivers = users.filter(isDriver);

  const totalCashIn = operationalLedger
    .filter((row: any) => String(row?.type || "").toUpperCase() === "IN")
    .reduce((sum: number, row: any) => sum + Number(row?.amount || 0), 0);

  const totalCashOut = operationalLedger
    .filter((row: any) => String(row?.type || "").toUpperCase() === "OUT")
    .reduce((sum: number, row: any) => sum + Number(row?.amount || 0), 0);

  const netCashflow = totalCashIn - totalCashOut;

  const totalRestaurantBalance = restaurants.reduce(
    (sum: number, item: any) => sum + Number(item?.balance || 0),
    0
  );

  const totalDriverBalance = drivers.reduce(
    (sum: number, item: any) => sum + Number(item?.balance || 0),
    0
  );

  const unpaidRestaurantCommission = restaurants.reduce(
    (sum: number, item: any) => sum + Number(item?.totalUnpaidCommission || 0),
    0
  );

  const unpaidDriverCommission = drivers.reduce(
    (sum: number, item: any) => sum + Number(item?.totalUnpaidCommission || 0),
    0
  );

  const totalUnpaidCommission =
    unpaidRestaurantCommission + unpaidDriverCommission;
  const verifiedRestaurants = restaurants.filter((item: any) => item?.isVerified === true);
  const verifiedDrivers = drivers.filter((item: any) => item?.isVerified === true);
  const averageTransactionValue =
    operationalLedger.length > 0 ? Math.round((totalCashIn + totalCashOut) / operationalLedger.length) : 0;

  const cashflowSeries = groupByDate(operationalLedger);
  const categorySeries = groupByCategory(operationalLedger);
  const topExpenses = getTopExpenses(operationalLedger);
  const topRestaurantExposure = buildTopRestaurantExposure(restaurants);
  const topDriverExposure = buildTopDriverExposure(drivers);
  const orderStatusSummary = buildOrderStatusSummary(orders);

  const latestTransactions = [...operationalLedger]
    .sort((a: any, b: any) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0))
    .slice(0, 20);

  const financeAlerts: string[] = [];

  if (totalCashOut > totalCashIn) {
    financeAlerts.push("Cash out lebih besar dari cash in");
  }

  if (totalUnpaidCommission > 0) {
    financeAlerts.push("Masih ada unpaid commission");
  }

  if (operationalLedger.length === 0) {
    financeAlerts.push("Belum ada data ledger operasional pada periode ini");
  }

  if (topExpenses.length > 0 && Number(topExpenses[0]?.amount || 0) > 10000000) {
    financeAlerts.push("Ada pengeluaran besar yang perlu perhatian");
  }

  return {
    summary: {
      totalCashIn,
      totalCashOut,
      netCashflow,
      totalRestaurantBalance,
      totalDriverBalance,
      unpaidRestaurantCommission,
      unpaidDriverCommission,
      totalUnpaidCommission,
      totalTransactions: operationalLedger.length,
      totalOrders: orders.length,
      verifiedRestaurants: verifiedRestaurants.length,
      verifiedDrivers: verifiedDrivers.length,
      averageTransactionValue,
    },
    cashflowSeries,
    categorySeries,
    topExpenses,
    topRestaurantExposure,
    topDriverExposure,
    orderStatusSummary,
    latestTransactions,
    financeAlerts,
    raw: {
      operationalLedger,
      restaurants,
      users,
      orders,
      drivers,
    },
  };
};
