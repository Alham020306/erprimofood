import { isMerchantOperational } from "../../shared/utils/merchantOperationalStatus";

export const calculateCOOMetrics = (data: any) => {
  const restaurants = Array.isArray(data?.restaurants) ? data.restaurants : [];
  const users = Array.isArray(data?.users) ? data.users : [];
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const reviews = Array.isArray(data?.reviews) ? data.reviews : [];
  const driverReviews = Array.isArray(data?.driverReviews) ? data.driverReviews : [];

  const drivers = users.filter(
    (u: any) => String(u?.role || "").toUpperCase() === "DRIVER"
  );

  const activeDrivers = drivers.filter((d: any) => d?.isOnline === true);

  const activeMerchants = restaurants.filter((r: any) => isMerchantOperational(r));

  const activeOrders = orders.filter((o: any) => {
    const status = String(o?.status || "").toUpperCase();
    return !["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
  });

  const completedOrders = orders.filter(
    (o: any) => String(o?.status || "").toUpperCase() === "COMPLETED"
  );

  const cancelledOrders = orders.filter((o: any) => {
    const status = String(o?.status || "").toUpperCase();
    return status === "CANCELLED" || status === "REJECTED";
  });
  const readyCookingOrders = orders.filter((o: any) =>
    ["READY", "COOKING"].includes(String(o?.status || "").toUpperCase())
  );
  const customerCancels = orders.filter(
    (o: any) => String(o?.cancelledBy || "").toUpperCase() === "CUSTOMER"
  );

  const incidents: string[] = [];

  if (drivers.length > 0 && activeDrivers.length === 0) {
    incidents.push("Tidak ada driver online");
  }

  if (orders.length > 5 && activeDrivers.length < 2) {
    incidents.push("Driver kurang untuk jumlah order");
  }

  if (restaurants.length > 0 && activeMerchants.length === 0) {
    incidents.push("Semua merchant sedang tutup");
  }

  if (cancelledOrders.length >= 5) {
    incidents.push("Tingkat pembatalan order sedang tinggi");
  }

  if (reviews.length === 0 && completedOrders.length > 0) {
    incidents.push("Belum ada review restoran yang masuk");
  }

  if (driverReviews.length === 0 && completedOrders.length > 0) {
    incidents.push("Belum ada review driver yang masuk");
  }

  return {
    totalMerchants: restaurants.length,
    activeMerchants: activeMerchants.length,
    totalDrivers: drivers.length,
    activeDrivers: activeDrivers.length,
    offlineDrivers: drivers.length - activeDrivers.length,
    activeOrders: activeOrders.length,
    totalOrders: orders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    readyCookingOrders: readyCookingOrders.length,
    customerCancels: customerCancels.length,
    totalReviews: reviews.length,
    totalDriverReviews: driverReviews.length,
    incidents,
  };
};
