import { formatCurrency } from "../utils/formatters";

type Props = {
  restaurants: any[];
  drivers: any[];
};

export default function SettlementRiskPanel({ restaurants, drivers }: Props) {
  const riskyRestaurants = [...restaurants]
    .filter((item) => Number(item?.totalUnpaidCommission || 0) > 0)
    .sort(
      (a, b) =>
        Number(b?.totalUnpaidCommission || 0) -
        Number(a?.totalUnpaidCommission || 0)
    )
    .slice(0, 5);

  const riskyDrivers = [...drivers]
    .filter((item) => Number(item?.totalUnpaidCommission || 0) > 0)
    .sort(
      (a, b) =>
        Number(b?.totalUnpaidCommission || 0) -
        Number(a?.totalUnpaidCommission || 0)
    )
    .slice(0, 5);

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Settlement Risk</h2>

      <div className="space-y-5">
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">
            Top Risk Restaurants
          </h3>
          {!riskyRestaurants.length ? (
            <p className="text-sm text-slate-500">Tidak ada risiko utama.</p>
          ) : (
            <div className="space-y-2">
              {riskyRestaurants.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-sm text-amber-700">
                    Unpaid: {formatCurrency(item.totalUnpaidCommission)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Top Risk Drivers</h3>
          {!riskyDrivers.length ? (
            <p className="text-sm text-slate-500">Tidak ada risiko utama.</p>
          ) : (
            <div className="space-y-2">
              {riskyDrivers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-sm text-amber-700">
                    Unpaid: {formatCurrency(item.totalUnpaidCommission)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}