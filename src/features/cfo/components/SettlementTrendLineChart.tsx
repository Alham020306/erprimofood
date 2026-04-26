import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../utils/formatters";

type TrendRow = {
  label: string;
  allRevenue: number;
  allPaid: number;
  allUnpaid: number;
  restaurantRevenue: number;
  restaurantPaid: number;
  restaurantUnpaid: number;
  driverRevenue: number;
  driverPaid: number;
  driverUnpaid: number;
};

type Mode = "ALL" | "RESTAURANT" | "DRIVER";

type Props = {
  data: TrendRow[];
  mode: Mode;
};

const lineConfig: Record<
  Mode,
  {
    revenueKey: keyof TrendRow;
    paidKey: keyof TrendRow;
    unpaidKey: keyof TrendRow;
  }
> = {
  ALL: {
    revenueKey: "allRevenue",
    paidKey: "allPaid",
    unpaidKey: "allUnpaid",
  },
  RESTAURANT: {
    revenueKey: "restaurantRevenue",
    paidKey: "restaurantPaid",
    unpaidKey: "restaurantUnpaid",
  },
  DRIVER: {
    revenueKey: "driverRevenue",
    paidKey: "driverPaid",
    unpaidKey: "driverUnpaid",
  },
};

export default function SettlementTrendLineChart({ data, mode }: Props) {
  const config = lineConfig[mode];

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => `${Math.round(Number(value || 0) / 1000)}k`}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line
            type="monotone"
            dataKey={config.revenueKey}
            name="Total Revenue"
            stroke="#0f172a"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey={config.paidKey}
            name="Terbayar"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey={config.unpaidKey}
            name="Belum Dibayar"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
