import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export type LetterType = "REQUEST" | "PERMIT" | "LEAVE" | "RESIGNATION" | "APOLOGY" | "OFFICIAL" | "OTHER";
export type LetterPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LetterStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED" | "ARCHIVED";

export interface LetterAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface LetterToCEO {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderDepartment?: string;
  type: LetterType;
  subject: string;
  content: string;
  attachments: LetterAttachment[];
  priority: LetterPriority;
  status: LetterStatus;
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  ceoDecision?: string;
  ceoNotes?: string;
  approvedAmount?: number; // For financial requests
  approvedDates?: { start: any; end: any }; // For leave/permit
}

export interface LetterStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  byType: Record<LetterType, number>;
  urgent: number;
}

const typeLabels: Record<LetterType, string> = {
  REQUEST: "Permohonan/Pengajuan",
  PERMIT: "Izin",
  LEAVE: "Cuti",
  RESIGNATION: "Pengunduran Diri",
  APOLOGY: "Permintaan Maaf",
  OFFICIAL: "Surat Dinas",
  OTHER: "Lainnya",
};

const priorityLabels: Record<LetterPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const statusLabels: Record<LetterStatus, string> = {
  PENDING: "Menunggu",
  UNDER_REVIEW: "Sedang Ditinjau",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  COMPLETED: "Selesai",
  ARCHIVED: "Diarsipkan",
};

export const useCEOLetters = (user: any) => {
  const [letters, setLetters] = useState<LetterToCEO[]>([]);
  const [myLetters, setMyLetters] = useState<LetterToCEO[]>([]);
  const [stats, setStats] = useState<LetterStats>({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    byType: {
      REQUEST: 0,
      PERMIT: 0,
      LEAVE: 0,
      RESIGNATION: 0,
      APOLOGY: 0,
      OFFICIAL: 0,
      OTHER: 0,
    },
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to all letters (CEO view)
  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(dbCLevel, "ceo_letters")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as LetterToCEO))
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          });
        setLetters(data);

        // Calculate stats
        const byType: Record<LetterType, number> = {
          REQUEST: 0,
          PERMIT: 0,
          LEAVE: 0,
          RESIGNATION: 0,
          APOLOGY: 0,
          OFFICIAL: 0,
          OTHER: 0,
        };

        data.forEach((l) => {
          byType[l.type] = (byType[l.type] || 0) + 1;
        });

        setStats({
          total: data.length,
          pending: data.filter((l) => l.status === "PENDING").length,
          underReview: data.filter((l) => l.status === "UNDER_REVIEW").length,
          approved: data.filter((l) => l.status === "APPROVED").length,
          rejected: data.filter((l) => l.status === "REJECTED").length,
          byType,
          urgent: data.filter((l) => l.priority === "URGENT" && l.status !== "ARCHIVED").length,
        });

        setLoading(false);
      },
      (err) => {
        console.error("Letters error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Subscribe to my letters (for sender)
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(dbCLevel, "ceo_letters"),
      where("senderId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as LetterToCEO))
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          });
        setMyLetters(data);
      },
      (err) => {
        console.error("My letters error:", err);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // Send letter to CEO
  const sendLetter = useCallback(
    async (data: {
      type: LetterType;
      subject: string;
      content: string;
      attachments: LetterAttachment[];
      priority: LetterPriority;
    }): Promise<boolean> => {
      if (!user?.uid) return false;

      try {
        setSubmitting(true);

        const letterRef = doc(collection(dbCLevel, "ceo_letters"));
        await setDoc(letterRef, {
          senderId: user.uid,
          senderName: user.name || user.email || "Unknown",
          senderRole: user.role || user.primaryRole || "STAFF",
          senderDepartment: user.department || null,
          ...data,
          status: "PENDING" as LetterStatus,
          createdAt: serverTimestamp(),
        });

        return true;
      } catch (err) {
        console.error("Send letter error:", err);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user]
  );

  // Review letter (CEO only)
  const reviewLetter = useCallback(
    async (
      letterId: string,
      action: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED",
      decision?: string,
      notes?: string,
      approvedAmount?: number,
      approvedDates?: { start: any; end: any }
    ): Promise<boolean> => {
      try {
        const letterRef = doc(dbCLevel, "ceo_letters", letterId);
        const updateData: any = {
          status: action,
          reviewedAt: serverTimestamp(),
          reviewedBy: user?.uid,
        };

        if (decision) updateData.ceoDecision = decision;
        if (notes) updateData.ceoNotes = notes;
        if (approvedAmount !== undefined) updateData.approvedAmount = approvedAmount;
        if (approvedDates) updateData.approvedDates = approvedDates;

        await updateDoc(letterRef, updateData);
        return true;
      } catch (err) {
        console.error("Review letter error:", err);
        return false;
      }
    },
    [user?.uid]
  );

  // Archive letter
  const archiveLetter = useCallback(async (letterId: string): Promise<boolean> => {
    try {
      const letterRef = doc(dbCLevel, "ceo_letters", letterId);
      await updateDoc(letterRef, {
        status: "ARCHIVED",
        archivedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Archive letter error:", err);
      return false;
    }
  }, []);

  // Get letters by type
  const getLettersByType = useCallback(
    (type: LetterType) => {
      return letters.filter((l) => l.type === type);
    },
    [letters]
  );

  // Get letters by status
  const getLettersByStatus = useCallback(
    (status: LetterStatus) => {
      return letters.filter((l) => l.status === status);
    },
    [letters]
  );

  // Get pending letters
  const getPendingLetters = useCallback(() => {
    return letters.filter((l) => l.status === "PENDING" || l.status === "UNDER_REVIEW");
  }, [letters]);

  // Get urgent letters
  const getUrgentLetters = useCallback(() => {
    return letters.filter((l) => l.priority === "URGENT" && l.status !== "ARCHIVED" && l.status !== "COMPLETED");
  }, [letters]);

  // Get type label
  const getTypeLabel = (type: LetterType): string => typeLabels[type] || type;

  // Get priority label
  const getPriorityLabel = (priority: LetterPriority): string => priorityLabels[priority] || priority;

  // Get status label
  const getStatusLabel = (status: LetterStatus): string => statusLabels[status] || status;

  // Get priority color
  const getPriorityColor = (priority: LetterPriority): string => {
    const colors: Record<LetterPriority, string> = {
      LOW: "bg-slate-100 text-slate-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-amber-100 text-amber-700",
      URGENT: "bg-rose-100 text-rose-700",
    };
    return colors[priority] || "bg-slate-100 text-slate-700";
  };

  // Get status color
  const getStatusColor = (status: LetterStatus): string => {
    const colors: Record<LetterStatus, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      UNDER_REVIEW: "bg-blue-100 text-blue-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-rose-100 text-rose-700",
      COMPLETED: "bg-purple-100 text-purple-700",
      ARCHIVED: "bg-slate-100 text-slate-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return {
    loading,
    submitting,
    letters,
    myLetters,
    stats,
    sendLetter,
    reviewLetter,
    archiveLetter,
    getLettersByType,
    getLettersByStatus,
    getPendingLetters,
    getUrgentLetters,
    getTypeLabel,
    getPriorityLabel,
    getStatusLabel,
    getPriorityColor,
    getStatusColor,
  };
};

export default useCEOLetters;
