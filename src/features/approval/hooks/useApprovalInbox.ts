import { useEffect, useMemo, useState } from "react";
import { subscribeApprovalActivityLogs, subscribeInboxApprovals, updateApprovalStatus } from "../services/approvalService";

type Params = {
  user: any;
};

export const useApprovalInbox = ({ user }: Params) => {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.primaryRole) return;

    setLoading(true);
    const unsub = subscribeInboxApprovals(user.primaryRole, (rows) => {
      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!selectedApproval?.id) {
      setActivityLogs([]);
      return;
    }

    const unsub = subscribeApprovalActivityLogs(selectedApproval.id, setActivityLogs);
    return () => unsub();
  }, [selectedApproval]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter(
      (item) => String(item?.status || "").toUpperCase() === statusFilter.toUpperCase()
    );
  }, [items, statusFilter]);

  const summary = useMemo(() => {
    const submitted = items.filter((i) => i.status === "SUBMITTED").length;
    const inReview = items.filter((i) => i.status === "IN_REVIEW").length;
    const approved = items.filter((i) => i.status === "APPROVED").length;
    const rejected = items.filter((i) => i.status === "REJECTED").length;

    return {
      total: items.length,
      submitted,
      inReview,
      approved,
      rejected,
    };
  }, [items]);

  const approve = async (note = "") => {
    if (!selectedApproval?.id) return;
    await updateApprovalStatus({
      approvalId: selectedApproval.id,
      status: "APPROVED",
      actorUid: user.uid,
      actorName: user.fullName,
      actorRole: user.primaryRole,
      note,
    });
  };

  const reject = async (note = "") => {
    if (!selectedApproval?.id) return;
    await updateApprovalStatus({
      approvalId: selectedApproval.id,
      status: "REJECTED",
      actorUid: user.uid,
      actorName: user.fullName,
      actorRole: user.primaryRole,
      note,
    });
  };

  const requestRevision = async (note = "") => {
    if (!selectedApproval?.id) return;
    await updateApprovalStatus({
      approvalId: selectedApproval.id,
      status: "REVISION_REQUIRED",
      actorUid: user.uid,
      actorName: user.fullName,
      actorRole: user.primaryRole,
      note,
    });
  };

  return {
    loading,
    items: filtered,
    summary,
    statusFilter,
    setStatusFilter,
    selectedApproval,
    setSelectedApproval,
    activityLogs,
    approve,
    reject,
    requestRevision,
  };
};