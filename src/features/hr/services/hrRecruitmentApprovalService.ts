import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { createApprovalRequest } from "../../approval/services/approvalService";
import { UserRole } from "../../../core/types/roles";

const COLLECTION_NAME = "hr_recruitment_requests";

export type RecruitmentPositionLevel = "ENTRY" | "MID" | "SENIOR" | "MANAGER" | "EXECUTIVE";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
export type RecruitmentStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface RecruitmentRequest {
  id?: string;
  // Request Info
  title: string;
  department: string;
  position: string;
  positionLevel: RecruitmentPositionLevel;
  employmentType: EmploymentType;
  quantity: number;
  
  // Justification
  reason: string;
  jobDescription: string;
  requirements: string;
  
  // Budget
  budgetApproval?: boolean;
  budgetAmount?: number;
  
  // Status
  status: RecruitmentStatus;
  
  // Requester
  requestedByUid: string;
  requestedByName: string;
  requestedByRole: UserRole;
  requestedByDepartment?: string;
  
  // Approval Flow
  approvalId?: string; // Link to approval_requests collection
  approvedBy?: string;
  approvedAt?: number;
  rejectionReason?: string;
  
  // Target Approver
  targetApprovalRole: UserRole;
  targetDepartment?: string; // For cross-division requests
  
  // Timestamps
  createdAt?: number;
  updatedAt?: number;
  targetStartDate?: string;
  
  // Result (filled after recruitment complete)
  hiredCandidates?: string[]; // IDs of hired candidates
  notes?: string;
}

// Create recruitment request (submitted by any division to HR)
export const createRecruitmentRequest = async (
  request: Omit<RecruitmentRequest, "id" | "createdAt" | "updatedAt" | "approvalId">,
  submitForApproval: boolean = false
): Promise<string> => {
  const now = Date.now();
  
  const docData: any = {
    ...request,
    status: submitForApproval ? "SUBMITTED" : "DRAFT",
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  };

  // If submitting for approval, create approval request
  if (submitForApproval) {
    const approvalId = await createApprovalRequest({
      title: `Recruitment Request: ${request.position} (${request.quantity} person)`,
      description: `
**Department:** ${request.department}
**Position:** ${request.position}
**Level:** ${request.positionLevel}
**Quantity:** ${request.quantity}
**Employment Type:** ${request.employmentType}

**Reason:**
${request.reason}

**Job Description:**
${request.jobDescription}

**Requirements:**
${request.requirements}

**Target Start Date:** ${request.targetStartDate || "ASAP"}
      `.trim(),
      requestType: "RECRUITMENT_REQUEST",
      requestedByUid: request.requestedByUid,
      requestedByName: request.requestedByName,
      requestedByRole: request.requestedByRole,
      targetRole: request.targetApprovalRole,
      priority: request.positionLevel === "EXECUTIVE" || request.positionLevel === "MANAGER" ? "HIGH" : "MEDIUM",
      relatedModule: "HR_RECRUITMENT",
      relatedEntityId: undefined,
    });
    
    docData.approvalId = approvalId;
  }

  const docRef = await addDoc(collection(dbCLevel, COLLECTION_NAME), docData);
  return docRef.id;
};

// Update recruitment request
export const updateRecruitmentRequest = async (
  requestId: string,
  updates: Partial<RecruitmentRequest>
): Promise<void> => {
  const ref = doc(dbCLevel, COLLECTION_NAME, requestId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};

// Approve recruitment request (by HR or other approver)
export const approveRecruitmentRequest = async (
  requestId: string,
  approverUid: string,
  approverName: string,
  approverRole: UserRole,
  notes?: string
): Promise<void> => {
  const ref = doc(dbCLevel, COLLECTION_NAME, requestId);
  await updateDoc(ref, {
    status: "APPROVED",
    approvedBy: approverUid,
    approvedByName: approverName,
    approvedByRole: approverRole,
    approvedAt: Date.now(),
    notes: notes || "",
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};

// Reject recruitment request
export const rejectRecruitmentRequest = async (
  requestId: string,
  rejectionReason: string
): Promise<void> => {
  const ref = doc(dbCLevel, COLLECTION_NAME, requestId);
  await updateDoc(ref, {
    status: "REJECTED",
    rejectionReason,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};

// Subscribe to all recruitment requests (for HR dashboard)
export const subscribeAllRecruitmentRequests = (
  callback: (rows: RecruitmentRequest[]) => void
) => {
  const q = query(
    collection(dbCLevel, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RecruitmentRequest[];
    callback(rows);
  });
};

// Subscribe to recruitment requests by requester
export const subscribeMyRecruitmentRequests = (
  requesterUid: string,
  callback: (rows: RecruitmentRequest[]) => void
) => {
  const q = query(
    collection(dbCLevel, COLLECTION_NAME),
    where("requestedByUid", "==", requesterUid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RecruitmentRequest[];
    callback(rows);
  });
};

// Subscribe to pending requests for approval (for HR)
export const subscribePendingRecruitmentRequests = (
  approverRole: UserRole,
  callback: (rows: RecruitmentRequest[]) => void
) => {
  const q = query(
    collection(dbCLevel, COLLECTION_NAME),
    where("status", "in", ["SUBMITTED", "DRAFT"]),
    where("targetApprovalRole", "==", approverRole),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RecruitmentRequest[];
    callback(rows);
  });
};

// Get recruitment statistics
export const getRecruitmentStats = async () => {
  const snap = await getDocs(collection(dbCLevel, COLLECTION_NAME));
  const requests = snap.docs.map((d) => d.data() as RecruitmentRequest);

  return {
    total: requests.length,
    draft: requests.filter((r) => r.status === "DRAFT").length,
    pending: requests.filter((r) => r.status === "SUBMITTED").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
    inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
    byDepartment: requests.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};

// Check if collection exists and has data
export const checkRecruitmentCollection = async (): Promise<boolean> => {
  const snap = await getDocs(collection(dbCLevel, COLLECTION_NAME));
  return !snap.empty;
};

// Seed sample recruitment requests
export const seedRecruitmentRequests = async () => {
  const now = Date.now();
  
  const sampleRequests: Omit<RecruitmentRequest, "id" | "createdAt" | "updatedAt" | "approvalId">[] = [
    {
      title: "Frontend Developer Hiring",
      department: "Technology",
      position: "Senior Frontend Developer",
      positionLevel: "SENIOR",
      employmentType: "FULL_TIME",
      quantity: 2,
      reason: "Expansion of development team for new product features",
      jobDescription: "Develop and maintain React-based web applications, collaborate with backend team, implement UI/UX designs",
      requirements: "3+ years React experience, TypeScript, Tailwind CSS, Firebase knowledge",
      budgetApproval: true,
      budgetAmount: 25000000,
      status: "APPROVED",
      requestedByUid: "cto-sample",
      requestedByName: "CTO Sample",
      requestedByRole: UserRole.CTO,
      targetApprovalRole: UserRole.HR,
      targetStartDate: "2024-03-01",
    },
    {
      title: "Marketing Specialist",
      department: "Marketing",
      position: "Digital Marketing Specialist",
      positionLevel: "MID",
      employmentType: "FULL_TIME",
      quantity: 1,
      reason: "New campaign launching requires additional marketing support",
      jobDescription: "Manage digital marketing campaigns, social media management, content creation, SEO optimization",
      requirements: "2+ years digital marketing experience, familiar with Google Ads, Meta Ads, content creation",
      budgetApproval: false,
      status: "SUBMITTED",
      requestedByUid: "cmo-sample",
      requestedByName: "CMO Sample",
      requestedByRole: UserRole.CMO,
      targetApprovalRole: UserRole.HR,
      targetStartDate: "2024-02-15",
    },
    {
      title: "Driver Fleet Expansion",
      department: "Operations",
      position: "Delivery Driver",
      positionLevel: "ENTRY",
      employmentType: "FULL_TIME",
      quantity: 10,
      reason: "High demand in new area coverage, need more drivers",
      jobDescription: "Deliver food orders safely and on time, maintain vehicle condition, provide excellent customer service",
      requirements: "Valid SIM C, own motorcycle, smartphone, familiar with Jakarta area",
      budgetApproval: true,
      status: "IN_PROGRESS",
      requestedByUid: "coo-sample",
      requestedByName: "COO Sample",
      requestedByRole: UserRole.COO,
      targetApprovalRole: UserRole.HR,
      targetStartDate: "2024-01-20",
    },
    // HR requesting for their own department (self-approval scenario)
    {
      title: "HR Admin Assistant",
      department: "Human Resources",
      position: "HR Admin",
      positionLevel: "ENTRY",
      employmentType: "FULL_TIME",
      quantity: 1,
      reason: "Current HR team overwhelmed with recruitment volume, need additional admin support",
      jobDescription: "Assist in recruitment administration, document management, employee data entry, scheduling interviews",
      requirements: "Fresh graduate welcome, administration background, detail-oriented, good communication",
      budgetApproval: false,
      status: "DRAFT",
      requestedByUid: "hr-sample",
      requestedByName: "HR Manager",
      requestedByRole: UserRole.HR,
      targetApprovalRole: UserRole.CEO, // Needs CEO approval for their own hiring
      targetStartDate: "2024-02-01",
    },
  ];

  for (const request of sampleRequests) {
    const docRef = doc(collection(dbCLevel, COLLECTION_NAME));
    await addDoc(collection(dbCLevel, COLLECTION_NAME), {
      ...request,
      createdAt: now,
      updatedAt: now,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
  }

  return { seededCount: sampleRequests.length };
};
