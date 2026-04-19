export type ApprovalRequestType =
  | "FUND_REQUEST"
  | "TECH_REQUEST"
  | "MEETING_REQUEST"
  | "ACCESS_REQUEST"
  | "BUDGET_REQUEST"
  | "OPS_ESCALATION"
  | "DOCUMENT_APPROVAL"
  | "RECRUITMENT_REQUEST"
  | "GENERAL_REQUEST";

export type ApprovalStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUIRED"
  | "CANCELLED";

export type ApprovalPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ApprovalAttachment = {
  id: string;
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  uploadedAt: number;
};

export type ApprovalRequest = {
  id: string;
  title: string;
  description: string;
  requestType: ApprovalRequestType;

  requestedByUid: string;
  requestedByName: string;
  requestedByRole: string;

  targetRole: string;
  targetUid?: string | null;

  amount?: number | null;
  currency?: string | null;

  priority: ApprovalPriority;
  status: ApprovalStatus;

  relatedModule?: string | null;
  relatedEntityId?: string | null;

  attachments: ApprovalAttachment[];

  createdAt: number;
  updatedAt: number;
};

export type ApprovalActivityLog = {
  id: string;
  approvalId: string;
  action: "CREATED" | "APPROVED" | "REJECTED" | "REVISION_REQUIRED" | "COMMENTED";
  actorUid: string;
  actorName: string;
  actorRole: string;
  note?: string;
  createdAt: number;
};