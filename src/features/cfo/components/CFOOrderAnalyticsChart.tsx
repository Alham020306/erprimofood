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

type Props = {
  data: { label: string; orders: number; revenue: number }[];
};

export default function CFOOrderAnalyticsChart({ data }: Props) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => `${Math.round(Number(value || 0) / 1000)}k`}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Revenue"
                ? formatCurrency(Number(value || 0))
                : Number(value || 0).toLocaleString("id-ID")
            }
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
