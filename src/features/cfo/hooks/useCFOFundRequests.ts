import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, doc, serverTimestamp, limit } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const useCFOFundRequests = (user: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to all fund requests
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "cfo_fund_requests"),
      orderBy("requestDate", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRequests(data);
      
      // Filter for CFO approval (pending with CFO as approver)
      const pending = data.filter((r: any) => 
        r.status === "PENDING" && 
        r.approvals?.some((a: any) => a.role === "CFO" && a.status === "PENDING")
      );
      setPendingApprovals(pending);
      
      // Filter my requests
      const mine = data.filter((r: any) => r.requestedBy?.uid === user?.uid);
      setMyRequests(mine);
      
      setLoading(false);
    }, (error) => {
      console.error("Fund requests error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Create new fund request
  const createRequest = useCallback(async (data: {
    purpose: string;
    description: string;
    amount: number;
    category: string;
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }) => {
    const newRequest = {
      requestId: `FR-${Date.now()}`,
      requestDate: Date.now(),
      requestedBy: {
        uid: user?.uid,
        name: user?.fullName || user?.displayName,
        role: user?.primaryRole,
        department: user?.department || "Finance"
      },
      ...data,
      currency: "IDR",
      status: "PENDING",
      approvals: [
        { level: 1, role: "CFO", status: "PENDING", approvedBy: null, approvedAt: null, notes: null },
        { level: 2, role: "CEO", status: "PENDING", condition: "IF_AMOUNT_OVER_50M" }
      ],
      ledgerEntryId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(dbCLevel, "cfo_fund_requests"), newRequest);
    return docRef.id;
  }, [user]);

  // Approve/reject request (CFO action)
  const processApproval = useCallback(async (
    requestId: string,
    action: "APPROVE" | "REJECT",
    notes?: string
  ) => {
    const requestRef = doc(dbCLevel, "cfo_fund_requests", requestId);
    
    await updateDoc(requestRef, {
      "approvals.0.status": action === "APPROVE" ? "APPROVED" : "REJECTED",
      "approvals.0.approvedBy": user?.uid,
      "approvals.0.approvedAt": Date.now(),
      "approvals.0.notes": notes || "",
      status: action === "APPROVE" ? "PENDING_CEO" : "REJECTED",
      updatedAt: serverTimestamp()
    });
  }, [user]);

  return {
    loading,
    requests,
    myRequests,
    pendingApprovals,
    createRequest,
    processApproval
  };
};
