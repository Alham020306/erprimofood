type Props = {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
};

export default function ApprovalsFilters({
  statusFilter,
  onStatusFilterChange,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Filter Status Approval
      </label>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="ALL">Semua</option>
        <option value="SUBMITTED">SUBMITTED</option>
        <option value="IN_REVIEW">IN_REVIEW</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
        <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
    </div>
  );
}