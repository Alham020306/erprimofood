import { useEffect, useState, useCallback, useMemo } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export type RecruitmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";
export type RecruitmentPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RecruitmentType = "DRIVER" | "MERCHANT" | "OPERATIONAL_STAFF" | "TECHNICAL" | "MARKETING" | "OTHER";

export interface RecruitmentRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  type: RecruitmentType;
  position: string;
  department: string;
  quantity: number;
  priority: RecruitmentPriority;
  reason: string;
  requirements: string;
  status: RecruitmentStatus;
  approvedBy?: string;
  approvedAt?: any;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

interface RecruitmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

export const useCOORecruitment = (user: any) => {
  const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
  const [myRequests, setMyRequests] = useState<RecruitmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to all recruitment requests
  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(dbCLevel, "coo_recruitment_requests"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecruitmentRequest));
      setRequests(data);
      setLoading(false);
    }, (err) => {
      console.error("recruitment error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter my requests
  useEffect(() => {
    if (!user?.uid) return;
    const mine = requests.filter((r) => r.requesterId === user.uid);
    setMyRequests(mine);
  }, [requests, user?.uid]);

  // Stats
  const stats: RecruitmentStats = useMemo(() => {
    return {
      total: myRequests.length,
      pending: myRequests.filter((r) => r.status === "PENDING").length,
      approved: myRequests.filter((r) => r.status === "APPROVED").length,
      rejected: myRequests.filter((r) => r.status === "REJECTED").length,
      completed: myRequests.filter((r) => r.status === "COMPLETED").length,
    };
  }, [myRequests]);

  // Submit new request
  const submitRequest = useCallback(async (data: {
    type: RecruitmentType;
    position: string;
    department: string;
    quantity: number;
    priority: RecruitmentPriority;
    reason: string;
    requirements: string;
  }): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setSubmitting(true);

      await addDoc(collection(dbCLevel, "coo_recruitment_requests"), {
        requesterId: user.uid,
        requesterName: user.name || user.email || "Unknown",
        requesterRole: user.role || "COO",
        ...data,
        status: "PENDING",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Submit recruitment error:", error);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  return {
    loading,
    submitting,
    requests,
    myRequests,
    stats,
    submitRequest,
  };
};
