import { useState } from "react";
import { useCMOCampaigns } from "../hooks/useCMOCampaigns";
import CMOMetricCard from "../components/CMOMetricCard";
import CMOCampaignTable from "../components/CMOCampaignTable";

type Props = {
  user: any;
};

export default function CMOCampaignPage({ user }: Props) {
  const { loading, items, summary, createCampaign, setStatus } = useCMOCampaigns({
    user,
  });

  const [title, setTitle] = useState("");
  const [type, setType] = useState("DISCOUNT");
  const [targetType, setTargetType] = useState("ALL_USERS");
  const [targetArea, setTargetArea] = useState("");
  const [budget, setBudget] = useState("");

  if (loading) return <div>Loading CMO campaigns...</div>;

  const submit = async () => {
    if (!title) return;

    await createCampaign({
      title,
      type,
      targetType,
      targetArea: targetArea || null,
      budget: budget ? Number(budget) : 0,
      status: "DRAFT",
    });

    setTitle("");
    setType("DISCOUNT");
    setTargetType("ALL_USERS");
    setTargetArea("");
    setBudget("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CMOMetricCard title="Total Campaigns" value={summary.total} />
        <CMOMetricCard title="Active" value={summary.active} />
        <CMOMetricCard title="Draft" value={summary.draft} />
        <CMOMetricCard title="Paused" value={summary.paused} />
      </div>

      <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Create Campaign</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Campaign title"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3"
          >
            <option value="DISCOUNT">DISCOUNT</option>
            <option value="FREE_DELIVERY">FREE_DELIVERY</option>
            <option value="LOYALTY">LOYALTY</option>
            <option value="REACTIVATION">REACTIVATION</option>
          </select>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3"
          >
            <option value="ALL_USERS">ALL_USERS</option>
            <option value="NEW_USERS">NEW_USERS</option>
            <option value="VIP_USERS">VIP_USERS</option>
            <option value="CHURN_RISK">CHURN_RISK</option>
            <option value="AREA_BASED">AREA_BASED</option>
          </select>
          <input
            value={targetArea}
            onChange={(e) => setTargetArea(e.target.value)}
            placeholder="Target area"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget"
            className="rounded-2xl border border-slate-200 px-4 py-3"
          />
        </div>

        <button
          onClick={submit}
          className="mt-4 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Create Campaign
        </button>
      </div>

      <CMOCampaignTable rows={items} onSetStatus={setStatus} />
    </div>
  );
}