const Item = ({ title, value }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
  </div>
);

type Props = {
  stats: {
    totalMerchants: number;
    openMerchants: number;
    totalDrivers: number;
    onlineDrivers: number;
    totalOrders: number;
    pendingOrders: number;
    cookingOrders: number;
    readyOrders: number;
  };
};

export default function LiveOpsStatusGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Item title="Total Merchants" value={stats.totalMerchants} />
      <Item title="Open Merchants" value={stats.openMerchants} />
      <Item title="Total Drivers" value={stats.totalDrivers} />
      <Item title="Online Drivers" value={stats.onlineDrivers} />
      <Item title="Total Orders" value={stats.totalOrders} />
      <Item title="Pending Orders" value={stats.pendingOrders} />
      <Item title="Cooking Orders" value={stats.cookingOrders} />
      <Item title="Ready Orders" value={stats.readyOrders} />
    </div>
  );
}