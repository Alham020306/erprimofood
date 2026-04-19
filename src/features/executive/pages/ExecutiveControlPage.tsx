import { UserRole } from "../../../core/types/roles";
import { useExecutiveControl } from "../hooks/useExecutiveControl";

type Props = {
  user: any;
};

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

export default function ExecutiveControlPage({ user }: Props) {
  const {
    loading,
    tasks,
    risks,
    summary,
    selectedTask,
    setSelectedTask,
    selectedRisk,
    setSelectedRisk,
    taskForm,
    setTaskForm,
    riskForm,
    setRiskForm,
    submitTask,
    submitRisk,
    setTaskStatus,
    setRiskStatus,
  } = useExecutiveControl({ user });

  if (loading) return <div>Loading executive control...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card title="Tasks" value={summary.totalTasks} />
        <Card title="Blocked Tasks" value={summary.blockedTasks} />
        <Card title="Open Risks" value={summary.openRisks} />
        <Card title="Monitoring Risks" value={summary.monitoringRisks} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Executive Tasks</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedTask(item)}
                  >
                    <td className="py-3 font-medium">{item.title || "-"}</td>
                    <td>{item.assignedToRole || "-"}</td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Task title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <textarea
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Task description"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={taskForm.assignedTo}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    assignedTo: event.target.value,
                  }))
                }
                placeholder="Assigned uid/name"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <select
                value={taskForm.assignedToRole}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    assignedToRole: event.target.value as UserRole,
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
            <button
              type="button"
              onClick={submitTask}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Create Executive Task
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Risk Register</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedRisk(item)}
                  >
                    <td className="py-3 font-medium">{item.title || "-"}</td>
                    <td>{item.ownerRole || "-"}</td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={riskForm.category}
                onChange={(event) =>
                  setRiskForm((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
                placeholder="Category"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <select
                value={riskForm.ownerRole}
                onChange={(event) =>
                  setRiskForm((prev) => ({
                    ...prev,
                    ownerRole: event.target.value as UserRole,
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={riskForm.title}
              onChange={(event) =>
                setRiskForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Risk title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <textarea
              value={riskForm.description}
              onChange={(event) =>
                setRiskForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Risk description"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={riskForm.impact}
                onChange={(event) =>
                  setRiskForm((prev) => ({ ...prev, impact: event.target.value }))
                }
                placeholder="Impact"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <input
                value={riskForm.likelihood}
                onChange={(event) =>
                  setRiskForm((prev) => ({
                    ...prev,
                    likelihood: event.target.value,
                  }))
                }
                placeholder="Likelihood"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
            <textarea
              value={riskForm.mitigationPlan}
              onChange={(event) =>
                setRiskForm((prev) => ({
                  ...prev,
                  mitigationPlan: event.target.value,
                }))
              }
              placeholder="Mitigation plan"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <button
              type="button"
              onClick={submitRisk}
              className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Create Risk Item
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Selected Task</h2>
          {!selectedTask ? (
            <p className="mt-3 text-sm text-slate-500">Pilih task untuk update status.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Title:</span> {selectedTask.title}
              </div>
              <div>
                <span className="font-semibold">Assigned Role:</span>{" "}
                {selectedTask.assignedToRole}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{" "}
                {selectedTask.description || "-"}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskStatus("IN_PROGRESS")}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setTaskStatus("DONE")}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => setTaskStatus("BLOCKED")}
                  className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Blocked
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Selected Risk</h2>
          {!selectedRisk ? (
            <p className="mt-3 text-sm text-slate-500">Pilih risk untuk update status.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Title:</span> {selectedRisk.title}
              </div>
              <div>
                <span className="font-semibold">Category:</span> {selectedRisk.category}
              </div>
              <div>
                <span className="font-semibold">Owner:</span> {selectedRisk.ownerRole}
              </div>
              <div>
                <span className="font-semibold">Mitigation:</span>{" "}
                {selectedRisk.mitigationPlan || "-"}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRiskStatus("MONITORING")}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Monitoring
                </button>
                <button
                  type="button"
                  onClick={() => setRiskStatus("MITIGATED")}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Mitigated
                </button>
                <button
                  type="button"
                  onClick={() => setRiskStatus("CLOSED")}
                  className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
