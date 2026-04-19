import { useCFOSettlements } from "../hooks/useCFOSettlements";
import SettlementSummaryCards from "../components/SettlementSummaryCards";
import SettlementsTable from "../components/SettlementsTable";
import SettlementDetailPanel from "../components/SettlementDetailPanel";
import SettlementRiskPanel from "../components/SettlementRiskPanel";

export default function CFOSettlementsPage() {
  const {
    loading,
    entityType,
    setEntityType,
    currentList,
    selectedEntity,
    setSelectedEntity,
    summary,
  } = useCFOSettlements();

  if (loading) return <div>Loading CFO settlements...</div>;

  const restaurants =
    entityType === "RESTAURANT" ? currentList : [];
  const drivers =
    entityType === "DRIVER" ? currentList : [];

  return (
    <div className="space-y-6">
      <SettlementSummaryCards summary={summary} />

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Entity Type
        </label>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as any)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="RESTAURANT">RESTAURANT</option>
          <option value="DRIVER">DRIVER</option>
        </select>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettlementsTable
          data={currentList}
          onSelect={setSelectedEntity}
        />
        <SettlementDetailPanel
          item={selectedEntity}
          entityType={entityType}
        />
      </div>

      <SettlementRiskPanel
        restaurants={entityType === "RESTAURANT" ? restaurants : []}
        drivers={entityType === "DRIVER" ? drivers : []}
      />
    </div>
  );
}