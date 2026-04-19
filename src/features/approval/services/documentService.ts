import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { dbCLevel, storageCLevel } from "../../../core/firebase/firebaseCLevel";
import { DirectorDocumentType } from "../../../core/types/document";
import { createAuditLog } from "../../shared/services/governanceCoreService";

type UploadDirectorDocumentParams = {
  file: File;
  title: string;
  documentType: DirectorDocumentType;
  uploadedByUid: string;
  uploadedByName: string;
  uploadedByRole: string;
  relatedApprovalId?: string | null;
  notes?: string;
};

export const uploadDirectorDocument = async ({
  file,
  title,
  documentType,
  uploadedByUid,
  uploadedByName,
  uploadedByRole,
  relatedApprovalId = null,
  notes = "",
}: UploadDirectorDocumentParams) => {
  const now = Date.now();
  const safeName = file.name.replace(/\s+/g, "_");
  const storagePath = `director_documents/${uploadedByUid}/${now}_${safeName}`;
  const storageRef = ref(storageCLevel, storagePath);

  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);

  const docRef = await addDoc(collection(dbCLevel, "director_documents"), {
    title,
    fileName: file.name,
    fileUrl,
    contentType: file.type || "",
    size: file.size || 0,
    documentType,
    uploadedByUid,
    uploadedByName,
    uploadedByRole,
    relatedApprovalId,
    notes,
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: uploadedByUid,
    actorRole: uploadedByRole,
    action: "DIRECTOR_DOCUMENT_UPLOADED",
    entityType: "director_documents",
    entityId: docRef.id,
    after: {
      title,
      documentType,
      relatedApprovalId,
      storagePath,
    },
  });

  return {
    id: docRef.id,
    fileUrl,
    fileName: file.name,
    size: file.size,
    contentType: file.type,
    uploadedAt: now,
  };
};
