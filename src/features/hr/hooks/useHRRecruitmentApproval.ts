import { useEffect, useMemo, useState } from "react";
import {
  subscribeAllRecruitmentRequests,
  subscribeMyRecruitmentRequests,
  subscribePendingRecruitmentRequests,
  RecruitmentRequest,
  createRecruitmentRequest,
  approveRecruitmentRequest,
  rejectRecruitmentRequest,
  getRecruitmentStats,
} from "../services/hrRecruitmentApprovalService";
import { UserRole } from "../../../core/types/roles";

export const useHRRecruitmentApproval = (user?: { uid: string; fullName: string; primaryRole: UserRole }) => {
  const [allRequests, setAllRequests] = useState<RecruitmentRequest[]>([]);
  const [myRequests, setMyRequests] = useState<RecruitmentRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RecruitmentRequest[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    completed: 0,
    byDepartment: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RecruitmentRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userRole = user?.primaryRole || UserRole.HR;

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubs = [
      subscribeAllRecruitmentRequests(setAllRequests),
      subscribeMyRecruitmentRequests(user.uid, setMyRequests),
      subscribePendingRecruitmentRequests(userRole, setPendingRequests),
    ];

    // Load stats
    getRecruitmentStats().then(setStats).catch(console.error);

    setLoading(false);

    return () => unsubs.forEach((u) => u());
  }, [user?.uid, userRole]);

  // Filter requests by status
  const requestsByStatus = useMemo(() => {
    return {
      draft: allRequests.filter((r) => r.status === "DRAFT"),
      pending: allRequests.filter((r) => r.status === "SUBMITTED"),
      approved: allRequests.filter((r) => r.status === "APPROVED"),
      rejected: allRequests.filter((r) => r.status === "REJECTED"),
      inProgress: allRequests.filter((r) => r.status === "IN_PROGRESS"),
      completed: allRequests.filter((r) => r.status === "COMPLETED"),
    };
  }, [allRequests]);

  // Can user approve this request?
  const canApprove = (request: RecruitmentRequest): boolean => {
    if (!user) return false;
    
    // HR can approve requests targeting HR
    if (request.targetApprovalRole === UserRole.HR && userRole === UserRole.HR) {
      return true;
    }
    
    // User has the target role
    if (request.targetApprovalRole === userRole) {
      return true;
    }
    
    return false;
  };

  // Actions
  const submitNewRequest = async (
    request: Omit<RecruitmentRequest, "id" | "createdAt" | "updatedAt" | "approvalId" | "requestedByUid" | "requestedByName" | "requestedByRole">,
    submitForApproval: boolean = false
  ) => {
    if (!user) throw new Error("User not authenticated");
    
    return await createRecruitmentRequest(
      {
        ...request,
        requestedByUid: user.uid,
        requestedByName: user.fullName,
        requestedByRole: userRole,
      },
      submitForApproval
    );
  };

  const approve = async (requestId: string, notes?: string) => {
    if (!user) throw new Error("User not authenticated");
    
    await approveRecruitmentRequest(
      requestId,
      user.uid,
      user.fullName,
      userRole,
      notes
    );
  };

  const reject = async (requestId: string, reason: string) => {
    await rejectRecruitmentRequest(requestId, reason);
  };

  return {
    loading,
    allRequests,
    myRequests,
    pendingRequests,
    requestsByStatus,
    stats,
    selectedRequest,
    setSelectedRequest,
    isModalOpen,
    setIsModalOpen,
    canApprove,
    submitNewRequest,
    approve,
    reject,
  };
};
