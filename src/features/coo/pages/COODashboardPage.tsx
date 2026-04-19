import { useMemo, useState } from "react";
import { useCOOLandingDashboard } from "../hooks/useCOOLandingDashboard";
import MerchantTable from "../components/MerchantTable";
import DriverTable from "../components/DriverTable";
import OrderTable from "../components/OrderTable";
import COOFilters from "../components/COOFilters";
import COOActionBar from "../components/COOActionBar";
import MerchantDetailPanel from "../components/MerchantDetailPanel";
import DriverDetailPanel from "../components/DriverDetailPanel";
import OrderDetailPanel from "../components/OrderDetailPanel";
import ReviewsMonitorPanel from "../components/ReviewsMonitorPanel";
import { useCOOMerchantDetail } from "../hooks/useCOOMerchantDetail";
import { useCOODriverDetail } from "../hooks/useCOODriverDetail";
import { useCOOReviewMonitor } from "../hooks/useCOOReviewMonitor";

const Card = ({ title, value }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="text-3xl font-bold text-slate-900 mt-2">{value}</h2>
  </div>
);

const isValidOrder = (order: any) => {
  return order && Object.keys(order).length > 0;
};

export default function COODashboardPage() {
  const [merchantQuery, setMerchantQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("ALL");

  const [merchantStatus, setMerchantStatus] = useState("ALL");
  const [driverStatus, setDriverStatus] = useState("ALL");
  const [orderSort, setOrderSort] = useState("NEWEST");

  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { metrics, loading, raw } = useCOOLandingDashboard();
  const merchantDetail = useCOOMerchantDetail(selectedMerchant);
  const driverDetail = useCOODriverDetail(selectedDriver);
  const reviewMonitor = useCOOReviewMonitor();

  const merchantList = useMemo(() => {
    const base = raw?.restaurants || [];

    return base
      .filter((merchant: any) =>
        String(merchant?.name || "")
          .toLowerCase()
          .includes(merchantQuery.toLowerCase())
      )
      .filter((merchant: any) => {
        if (merchantStatus === "ALL") return true;
        const isOpen = merchant?.isOpen ?? true;
        return merchantStatus === "OPEN" ? isOpen : !isOpen;
      });
  }, [raw, merchantQuery, merchantStatus]);

  const driverList = useMemo(() => {
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

  const orderList = useMemo(() => {
    const base = (raw?.orders || []).filter(isValidOrder);

    const filtered =
      orderStatus === "ALL"
        ? base
        : base.filter(
            (order: any) =>
              String(order?.status || "").toUpperCase() ===
              orderStatus.toUpperCase()
          );

    const sorted = [...filtered].sort((a: any, b: any) => {
      const aTime = Number(a?.timestamp || 0);
      const bTime = Number(b?.timestamp || 0);

      return orderSort === "NEWEST" ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  }, [raw, orderStatus, orderSort]);

  const handleResetSelection = () => {
    setSelectedMerchant(null);
    setSelectedDriver(null);
    setSelectedOrder(null);
  };

  if (loading) return <div>Loading COO realtime...</div>;
  if (!metrics) return <div>No data</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total Merchants" value={metrics.totalMerchants} />
        <Card title="Active Merchants" value={metrics.activeMerchants} />
        <Card title="Total Drivers" value={metrics.totalDrivers} />
        <Card title="Active Drivers" value={metrics.activeDrivers} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Offline Drivers" value={metrics.offlineDrivers} />
        <Card title="Total Orders" value={metrics.totalOrders} />
        <Card title="Active Orders" value={metrics.activeOrders} />
        <Card title="Completed Orders" value={metrics.completedOrders} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Cancelled Orders" value={metrics.cancelledOrders} />
        <Card
          title="Operational Alerts"
          value={metrics.incidents?.length ?? 0}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card title="Restaurant Reviews" value={metrics.totalReviews} />
        <Card title="Driver Reviews" value={metrics.totalDriverReviews} />
        <Card
          title="Ready / Cooking Monitor"
          value={metrics.readyCookingOrders}
        />
        <Card
          title="Customer Cancels"
          value={metrics.customerCancels}
        />
      </div>

      <COOFilters
        merchantQuery={merchantQuery}
        onMerchantQueryChange={setMerchantQuery}
        driverQuery={driverQuery}
        onDriverQueryChange={setDriverQuery}
        orderStatus={orderStatus}
        onOrderStatusChange={setOrderStatus}
      />

      <COOActionBar
        merchantStatus={merchantStatus}
        onMerchantStatusChange={setMerchantStatus}
        driverStatus={driverStatus}
        onDriverStatusChange={setDriverStatus}
        orderSort={orderSort}
        onOrderSortChange={setOrderSort}
        onResetSelection={handleResetSelection}
      />

      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-bold mb-3">Operational Alerts</h2>

        {metrics.incidents?.length ? (
          <div className="space-y-2">
            {metrics.incidents.map((incident: string, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700"
              >
                {incident}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            Semua operasional normal
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <MerchantTable data={merchantList} onSelect={setSelectedMerchant} />
        <DriverTable data={driverList} onSelect={setSelectedDriver} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <MerchantDetailPanel
          merchant={selectedMerchant}
          orders={merchantDetail.orders}
          reviews={merchantDetail.reviews}
          menus={merchantDetail.menus}
        />
        <DriverDetailPanel
          driver={selectedDriver}
          orders={driverDetail.orders}
          reviews={driverDetail.reviews}
        />
        <OrderDetailPanel order={selectedOrder} />
      </div>

      <OrderTable data={orderList} onSelect={setSelectedOrder} />

      <ReviewsMonitorPanel
        restaurantReviews={reviewMonitor.restaurantReviews}
        driverReviews={reviewMonitor.driverReviews}
      />
    </div>
  );
}
