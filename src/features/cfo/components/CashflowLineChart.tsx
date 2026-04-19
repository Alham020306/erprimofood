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

type Props = {
  data: { date: string; cashIn: number; cashOut: number; net: number }[];
};

export default function CashflowLineChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Cashflow Trend</h2>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cashIn" stroke="#16a34a" strokeWidth={2} />
            <Line type="monotone" dataKey="cashOut" stroke="#dc2626" strokeWidth={2} />
            <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}