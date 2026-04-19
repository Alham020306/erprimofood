import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, getDocs } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export type ReportType = "FINANCIAL" | "OPERATIONAL" | "TECHNICAL" | "MARKETING" | "HR" | "GENERAL" | "EXECUTIVE";
export type ReportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ReportStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED" | "ARCHIVED";

export interface ReportAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ReportToCEO {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  type: ReportType;
  title: string;
  content: string;
  summary?: string;
  attachments: ReportAttachment[];
  priority: ReportPriority;
  status: ReportStatus;
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  ceoNotes?: string;
  ceoAction?: string;
}

export interface ReportStats {
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  rejected: number;
  byType: Record<ReportType, number>;
  urgent: number;
}

const typeLabels: Record<ReportType, string> = {
  FINANCIAL: "Laporan Keuangan",
  OPERATIONAL: "Laporan Operasional",
  TECHNICAL: "Laporan Teknis",
  MARKETING: "Laporan Marketing",
  HR: "Laporan HR",
  GENERAL: "Laporan Umum",
  EXECUTIVE: "Laporan Eksekutif",
};

const priorityLabels: Record<ReportPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const statusLabels: Record<ReportStatus, string> = {
  PENDING: "Menunggu Review",
  REVIEWED: "Sudah Direview",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  ARCHIVED: "Diarsipkan",
};

export const useCEOReports = (user: any) => {
  const [reports, setReports] = useState<ReportToCEO[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
    byType: {
      FINANCIAL: 0,
      OPERATIONAL: 0,
      TECHNICAL: 0,
      MARKETING: 0,
      HR: 0,
      GENERAL: 0,
      EXECUTIVE: 0,
    },
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to reports
  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(dbCLevel, "ceo_reports")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ReportToCEO))
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          });
        setReports(data);

        // Calculate stats
        const byType: Record<ReportType, number> = {
          FINANCIAL: 0,
          OPERATIONAL: 0,
          TECHNICAL: 0,
          MARKETING: 0,
          HR: 0,
          GENERAL: 0,
          EXECUTIVE: 0,
        };

        data.forEach((r) => {
          byType[r.type] = (byType[r.type] || 0) + 1;
        });

        setStats({
          total: data.length,
          pending: data.filter((r) => r.status === "PENDING").length,
          reviewed: data.filter((r) => r.status === "REVIEWED").length,
          approved: data.filter((r) => r.status === "APPROVED").length,
          rejected: data.filter((r) => r.status === "REJECTED").length,
          byType,
          urgent: data.filter((r) => r.priority === "URGENT" && r.status === "PENDING").length,
        });

        setLoading(false);
      },
      (err) => {
        console.error("Reports error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Send report to CEO (for any role)
  const sendReport = useCallback(
    async (data: {
      type: ReportType;
      title: string;
      content: string;
      summary?: string;
      attachments: ReportAttachment[];
      priority: ReportPriority;
    }): Promise<boolean> => {
      if (!user?.uid) return false;

      try {
        setSubmitting(true);

        const reportRef = doc(collection(dbCLevel, "ceo_reports"));
        await setDoc(reportRef, {
          senderId: user.uid,
          senderName: user.name || user.email || "Unknown",
          senderRole: user.role || user.primaryRole || "STAFF",
          ...data,
          status: "PENDING" as ReportStatus,
          createdAt: serverTimestamp(),
        });

        return true;
      } catch (err) {
        console.error("Send report error:", err);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user]
  );

  // Review report (CEO only)
  const reviewReport = useCallback(
    async (
      reportId: string,
      action: "REVIEWED" | "APPROVED" | "REJECTED",
      notes?: string
    ): Promise<boolean> => {
      try {
        const reportRef = doc(dbCLevel, "ceo_reports", reportId);
        await updateDoc(reportRef, {
          status: action,
          reviewedAt: serverTimestamp(),
          reviewedBy: user?.uid,
          ceoNotes: notes || null,
        });
        return true;
      } catch (err) {
        console.error("Review report error:", err);
        return false;
      }
    },
    [user?.uid]
  );

  // Archive report
  const archiveReport = useCallback(async (reportId: string): Promise<boolean> => {
    try {
      const reportRef = doc(dbCLevel, "ceo_reports", reportId);
      await updateDoc(reportRef, {
        status: "ARCHIVED",
        archivedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Archive report error:", err);
      return false;
    }
  }, []);

  // Get reports by type
  const getReportsByType = useCallback(
    (type: ReportType) => {
      return reports.filter((r) => r.type === type);
    },
    [reports]
  );

  // Get reports by sender role
  const getReportsByRole = useCallback(
    (role: string) => {
      return reports.filter((r) => r.senderRole === role);
    },
    [reports]
  );

  // Get pending reports
  const getPendingReports = useCallback(() => {
    return reports.filter((r) => r.status === "PENDING");
  }, [reports]);

  // Get urgent reports
  const getUrgentReports = useCallback(() => {
    return reports.filter((r) => r.priority === "URGENT" && r.status !== "ARCHIVED");
  }, [reports]);

  // Get type label
  const getTypeLabel = (type: ReportType): string => typeLabels[type] || type;

  // Get priority label
  const getPriorityLabel = (priority: ReportPriority): string => priorityLabels[priority] || priority;

  // Get status label
  const getStatusLabel = (status: ReportStatus): string => statusLabels[status] || status;

  // Get priority color
  const getPriorityColor = (priority: ReportPriority): string => {
    const colors: Record<ReportPriority, string> = {
      LOW: "bg-slate-100 text-slate-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-amber-100 text-amber-700",
      URGENT: "bg-rose-100 text-rose-700",
    };
    return colors[priority] || "bg-slate-100 text-slate-700";
  };

  // Get status color
  const getStatusColor = (status: ReportStatus): string => {
    const colors: Record<ReportStatus, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      REVIEWED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-rose-100 text-rose-700",
      ARCHIVED: "bg-slate-100 text-slate-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return {
    loading,
    submitting,
    reports,
    stats,
    sendReport,
    reviewReport,
    archiveReport,
    getReportsByType,
    getReportsByRole,
    getPendingReports,
    getUrgentReports,
    getTypeLabel,
    getPriorityLabel,
    getStatusLabel,
    getPriorityColor,
    getStatusColor,
  };
};

export default useCEOReports;
