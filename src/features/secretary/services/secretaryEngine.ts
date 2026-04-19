const safeArray = (v: any) => (Array.isArray(v) ? v : []);
const safeString = (v: any) => String(v || "");

export const buildSecretaryTasks = (raw: any) => {
  const orders = safeArray(raw?.orders);
  const users = safeArray(raw?.users);
  const ads = safeArray(raw?.ads);

  const tasks: any[] = [];

  // 🔴 COO ISSUE
  const pendingOrders = orders.filter((o: any) => o.status === "PENDING");
  if (pendingOrders.length > 10) {
    tasks.push({
      id: "ops-delay",
      title: "High Pending Orders",
      priority: "HIGH",
      source: "COO",
      action: "Investigate driver distribution",
    });
  }

  // 🟡 HR ISSUE
  const inactiveDrivers = users.filter(
    (u: any) => u.role === "DRIVER" && !u.isOnline
  );
  if (inactiveDrivers.length > 5) {
    tasks.push({
      id: "driver-inactive",
      title: "Driver Inactive Spike",
      priority: "MEDIUM",
      source: "HR",
      action: "Contact inactive drivers",
    });
  }

  // 🔵 CMO ISSUE
  const inactiveAds = ads.filter((a: any) => !a.isActive);
  if (inactiveAds.length > 3) {
    tasks.push({
      id: "ads-off",
      title: "Campaigns Not Running",
      priority: "LOW",
      source: "CMO",
      action: "Review campaign activation",
    });
  }

  return tasks;
};

export const buildNotifications = (raw: any) => {
  const tasks = buildSecretaryTasks(raw);

  return tasks.map((t) => ({
    id: t.id,
    message: `[${t.source}] ${t.title}`,
    priority: t.priority,
    time: Date.now(),
  }));
};