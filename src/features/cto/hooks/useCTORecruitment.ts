import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export type RecruitmentType = "DRIVER" | "MERCHANT" | "OPERATIONAL_STAFF" | "TECHNICAL" | "MARKETING" | "OTHER";
export type RecruitmentPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RecruitmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";

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
  createdAt: any;
  updatedAt: any;
  hrResponse?: string;
  hrNotes?: string;
  approvedBy?: string;
  approvedAt?: any;
}

export interface RecruitmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
  completed: number;
  urgent: number;
}

const typeLabels: Record<RecruitmentType, string> = {
  DRIVER: "Driver",
  MERCHANT: "Merchant",
  OPERATIONAL_STAFF: "Staff Operasional",
  TECHNICAL: "Teknis/IT",
  MARKETING: "Marketing",
  OTHER: "Lainnya",
};

const priorityLabels: Record<RecruitmentPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const statusLabels: Record<RecruitmentStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  IN_PROGRESS: "Dalam Proses",
  COMPLETED: "Selesai",
};

export const useCTORecruitment = (user: any) => {
  const [myRequests, setMyRequests] = useState<RecruitmentRequest[]>([]);
  const [allRequests, setAllRequests] = useState<RecruitmentRequest[]>([]);
  const [stats, setStats] = useState<RecruitmentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to my requests
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(dbCLevel, "cto_recruitment_requests"),
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecruitmentRequest));
        setMyRequests(data);
        setLoading(false);
      },
      (err) => {
        console.error("Recruitment error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // Subscribe to all requests (for CTO overview)
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "cto_recruitment_requests"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecruitmentRequest));
      setAllRequests(data);
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === "PENDING").length,
        approved: data.filter(r => r.status === "APPROVED").length,
        rejected: data.filter(r => r.status === "REJECTED").length,
        inProgress: data.filter(r => r.status === "IN_PROGRESS").length,
        completed: data.filter(r => r.status === "COMPLETED").length,
        urgent: data.filter(r => r.priority === "URGENT" && r.status !== "COMPLETED").length,
      });
    }, (err) => {
      console.error("All requests error:", err);
    });

    return () => unsub();
  }, []);

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

      const requestRef = doc(collection(dbCLevel, "cto_recruitment_requests"));
      await setDoc(requestRef, {
        requesterId: user.uid,
        requesterName: user.name || user.email || "CTO",
        requesterRole: user.role || "CTO",
        ...data,
        status: "PENDING" as RecruitmentStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (err) {
      console.error("Submit request error:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  // Cancel request
  const cancelRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const requestRef = doc(dbCLevel, "cto_recruitment_requests", requestId);
      await setDoc(requestRef, {
        status: "REJECTED",
        updatedAt: serverTimestamp(),
        cancelledBy: user?.uid,
        cancellationReason: "Cancelled by requester",
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Cancel request error:", err);
      return false;
    }
  }, [user?.uid]);

  // Get type label
  const getTypeLabel = (type: RecruitmentType): string => typeLabels[type] || type;
  
  // Get priority label
  const getPriorityLabel = (priority: RecruitmentPriority): string => priorityLabels[priority] || priority;
  
  // Get status label
  const getStatusLabel = (status: RecruitmentStatus): string => statusLabels[status] || status;

  // Get priority color
  const getPriorityColor = (priority: RecruitmentPriority): string => {
    const colors: Record<RecruitmentPriority, string> = {
      LOW: "bg-slate-100 text-slate-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-amber-100 text-amber-700",
      URGENT: "bg-rose-100 text-rose-700",
    };
    return colors[priority] || "bg-slate-100 text-slate-700";
  };

  // Get status color
  const getStatusColor = (status: RecruitmentStatus): string => {
    const colors: Record<RecruitmentStatus, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-rose-100 text-rose-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-purple-100 text-purple-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return {
    loading,
    submitting,
    myRequests,
    allRequests,
    stats,
    submitRequest,
    cancelRequest,
    getTypeLabel,
    getPriorityLabel,
    getStatusLabel,
    getPriorityColor,
    getStatusColor,
  };
};

export default useCTORecruitment;
