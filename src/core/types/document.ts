export type DirectorDocumentType =
  | "LETTER"
  | "MEMO"
  | "PROPOSAL"
  | "REPORT"
  | "CONTRACT"
  | "ATTACHMENT"
  | "GENERAL";

export type DirectorDocument = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  contentType?: string;
  size?: number;
  documentType: DirectorDocumentType;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedByRole: string;
  relatedApprovalId?: string | null;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};