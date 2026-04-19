import { useEffect, useMemo, useState } from "react";
import { UserRole } from "../../../core/types/roles";
import {
  provisionDirectorUser,
  subscribeDirectorUsers,
  updateDirectorUserStatus,
} from "../services/entityManagementService";
import {
  subscribeDirectorRoles,
  subscribeRolePermissions,
} from "../services/directorCoreService";

type Props = {
  user: any;
};

const MetricCard = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

export default function InternalUsersPage({ user }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [roleDocs, setRoleDocs] = useState<any[]>([]);
  const [permissionDocs, setPermissionDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    primaryRole: UserRole.COO,
    title: "",
    department: "",
  });

  useEffect(() => {
    const unsub = subscribeDirectorUsers((rows) => {
      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubRoles = subscribeDirectorRoles((rows) => setRoleDocs(rows));
    const unsubPermissions = subscribeRolePermissions((rows) =>
      setPermissionDocs(rows)
    );

    return () => {
      unsubRoles();
      unsubPermissions();
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = [item.fullName, item.email, item.department]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesRole =
        roleFilter === "ALL"
          ? true
          : String(item.primaryRole || "").toUpperCase() === roleFilter;

      return matchesQuery && matchesRole;
    });
  }, [items, query, roleFilter]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((item) => item.isActive !== false).length,
      suspended: items.filter((item) => item.isSuspended === true).length,
      multiRole: items.filter((item) => Array.isArray(item.roles) && item.roles.length > 1)
        .length,
      roleDefinitions: roleDocs.length,
      permissionSets: permissionDocs.length,
    };
  }, [items, permissionDocs.length, roleDocs.length]);

  const submit = async () => {
    setSubmitting(true);
    setErrorText("");

    try {
      await provisionDirectorUser({
        ...form,
        actorUid: user?.uid || "",
        actorRole: user?.primaryRole || "CTO",
      });

      setForm({
        fullName: "",
        email: "",
        password: "",
        primaryRole: UserRole.COO,
        title: "",
        department: "",
      });
    } catch (error: any) {
      setErrorText(error?.message || "Gagal membuat akun internal.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (patch: {
    isActive?: boolean;
    isSuspended?: boolean;
  }) => {
    if (!selectedUser?.uid) return;

    await updateDirectorUserStatus({
      uid: selectedUser.uid,
      actorUid: user?.uid || "",
      actorRole: user?.primaryRole || "CTO",
      ...patch,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Internal Users" value={summary.total} />
        <MetricCard title="Active" value={summary.active} />
        <MetricCard title="Suspended" value={summary.suspended} />
        <MetricCard title="Multi Role" value={summary.multiRole} />
        <MetricCard title="Role Docs" value={summary.roleDefinitions} />
        <MetricCard title="Permission Sets" value={summary.permissionSets} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, email, department"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="ALL">All Roles</option>
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.uid}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedUser(item)}
                  >
                    <td className="py-3 font-medium">{item.fullName || "-"}</td>
                    <td>{item.email || "-"}</td>
                    <td>{item.primaryRole || "-"}</td>
                    <td>
                      {item.isSuspended
                        ? "Suspended"
                        : item.isActive === false
                        ? "Inactive"
                        : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && !filteredItems.length ? (
            <div className="pt-4 text-sm text-slate-500">Belum ada akun internal.</div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Provision Internal User</h2>
          <p className="mt-1 text-sm text-slate-500">
            Membuat akun auth dan profil `direction_users` sekaligus.
          </p>

          <div className="mt-4 space-y-3">
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <input
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Temporary password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <select
              value={form.primaryRole}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  primaryRole: event.target.value as UserRole,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <input
              value={form.department}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, department: event.target.value }))
              }
              placeholder="Department"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          {errorText ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorText}
            </div>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Provisioning..." : "Create Internal User"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900">Selected User</h2>

        {!selectedUser ? (
          <p className="mt-3 text-sm text-slate-500">
            Pilih user untuk melihat detail dan menjalankan aksi.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Name:</span> {selectedUser.fullName || "-"}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {selectedUser.email || "-"}
              </div>
              <div>
                <span className="font-semibold">Primary Role:</span>{" "}
                {selectedUser.primaryRole || "-"}
              </div>
              <div>
                <span className="font-semibold">Department:</span>{" "}
                {selectedUser.department || "-"}
              </div>
              <div>
                <span className="font-semibold">Title:</span> {selectedUser.title || "-"}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => updateStatus({ isActive: selectedUser.isActive === false })}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                {selectedUser.isActive === false ? "Activate User" : "Deactivate User"}
              </button>
              <button
                type="button"
                onClick={() =>
                  updateStatus({ isSuspended: selectedUser.isSuspended !== true })
                }
                className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
              >
                {selectedUser.isSuspended ? "Unsuspend User" : "Suspend User"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Director Roles Registry</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dokumen role inti yang sekarang otomatis dibentuk saat bootstrap akun
            direksi.
          </p>

          <div className="mt-4 space-y-3">
            {roleDocs.length ? (
              roleDocs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-900">
                      {item.roleKey || item.id}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Level {item.hierarchyLevel ?? "-"}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-500">
                    {item.roleName || "Role definition"}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                Belum ada role registry di database `direksi`.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Permission Baselines</h2>
          <p className="mt-1 text-sm text-slate-500">
            Baseline permission set yang ikut dibuat saat role pertama kali
            dipakai.
          </p>

          <div className="mt-4 space-y-3">
            {permissionDocs.length ? (
              permissionDocs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-900">
                      {item.roleKey || item.id}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {Object.keys(item.modules || {}).length} modules
                    </span>
                  </div>
                  <p className="mt-2 text-slate-500">
                    {Object.keys(item.modules || {}).join(", ") || "Belum ada module map."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                Belum ada baseline permission di database `direksi`.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
