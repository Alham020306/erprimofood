import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const useCOOApprovals = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);

  useEffect(() => {
    const q = query(
      collection(dbCLevel, "approval_requests"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApprovals(rows);
        setLoading(false);
      },
      (error) => {
        console.error("COO approvals error:", error);
        setApprovals([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredApprovals = useMemo(() => {
    if (statusFilter === "ALL") return approvals;

    return approvals.filter(
      (item: any) =>
        String(item?.currentStatus || "").toUpperCase() ===
        statusFilter.toUpperCase()
    );
  }, [approvals, statusFilter]);

  const summary = useMemo(() => {
    const submitted = approvals.filter(
      (a: any) => String(a?.currentStatus || "").toUpperCase() === "SUBMITTED"
    ).length;

    const inReview = approvals.filter(
      (a: any) => String(a?.currentStatus || "").toUpperCase() === "IN_REVIEW"
    ).length;

    const approved = approvals.filter(
      (a: any) => String(a?.currentStatus || "").toUpperCase() === "APPROVED"
    ).length;

    const rejected = approvals.filter(
      (a: any) => String(a?.currentStatus || "").toUpperCase() === "REJECTED"
    ).length;

    return {
      total: approvals.length,
      submitted,
      inReview,
      approved,
      rejected,
    };
  }, [approvals]);

  return {
    loading,
    approvals: filteredApprovals,
    summary,
    statusFilter,
    setStatusFilter,
    selectedApproval,
    setSelectedApproval,
  };
};