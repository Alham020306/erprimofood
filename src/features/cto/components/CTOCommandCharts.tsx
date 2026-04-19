import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

type Props = {
  activitySeries: Array<{ date: string; count: number }>;
  errorModuleSeries: Array<{ module: string; count: number }>;
};

export default function CTOCommandCharts({
  activitySeries,
  errorModuleSeries,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-cyan-300">Signal Throughput</h2>
          <p className="mt-1 text-sm text-slate-400">
            Daily event volume from recent log activity.
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activitySeries}>
              <defs>
                <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: 16,
                  color: "#e2e8f0",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22d3ee"
                fill="url(#activityFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-cyan-300">Error Pressure by Module</h2>
          <p className="mt-1 text-sm text-slate-400">
            Fast scan for modules generating the highest error density.
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorModuleSeries.slice(0, 8)} layout="vertical">
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="module" type="category" stroke="#64748b" width={90} />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: 16,
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
