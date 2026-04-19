import { useState } from "react";
import { createApprovalRequest } from "../services/approvalService";
import { uploadDirectorDocument } from "../services/documentService";
import { ApprovalAttachment } from "../../../core/types/approval";

type Params = {
  user: any;
};

export const useApprovalComposer = ({ user }: Params) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState("GENERAL_REQUEST");
  const [targetRole, setTargetRole] = useState("CFO");
  const [priority, setPriority] = useState("MEDIUM");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);

    try {
      const uploadedAttachments: ApprovalAttachment[] = [];

      for (const file of files) {
        const uploaded = await uploadDirectorDocument({
          file,
          title: file.name,
          documentType: "ATTACHMENT",
          uploadedByUid: user.uid,
          uploadedByName: user.fullName,
          uploadedByRole: user.primaryRole,
          notes,
        });

        uploadedAttachments.push({
          id: uploaded.id,
          name: uploaded.fileName,
          url: uploaded.fileUrl,
          contentType: uploaded.contentType,
          size: uploaded.size,
          uploadedAt: uploaded.uploadedAt,
        });
      }

      await createApprovalRequest({
        title,
        description,
        requestType: requestType as any,
        requestedByUid: user.uid,
        requestedByName: user.fullName,
        requestedByRole: user.primaryRole,
        targetRole,
        amount: amount ? Number(amount) : null,
        priority: priority as any,
        attachments: uploadedAttachments,
      });

      setTitle("");
      setDescription("");
      setRequestType("GENERAL_REQUEST");
      setTargetRole("CFO");
      setPriority("MEDIUM");
      setAmount("");
      setNotes("");
      setFiles([]);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    requestType,
    setRequestType,
    targetRole,
    setTargetRole,
    priority,
    setPriority,
    amount,
    setAmount,
    notes,
    setNotes,
    files,
    setFiles,
    submitting,
    submit,
  };
};
