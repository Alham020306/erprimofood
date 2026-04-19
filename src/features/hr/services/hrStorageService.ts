import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storageCLevel } from "../../../core/firebase/firebaseCLevel";

const STORAGE_BASE_PATH = "internal/karyawan/administrasi";

export type EmployeeDocumentType = "surat" | "foto";

export interface EmployeeDocument {
  name: string;
  url: string;
  path: string;
  type: EmployeeDocumentType;
  uploadedAt: number;
}

/**
 * Upload dokumen karyawan ke storage
 * Path: internal/karyawan/administrasi/{employeeId}/{type}/{fileName}
 */
export const uploadEmployeeDocument = async (
  employeeId: string,
  type: EmployeeDocumentType,
  file: File
): Promise<string> => {
  const fileName = `${Date.now()}_${file.name}`;
  const path = `${STORAGE_BASE_PATH}/${employeeId}/${type}/${fileName}`;
  const storageRef = ref(storageCLevel, path);

  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  return downloadUrl;
};

/**
 * Get list dokumen karyawan
 */
export const listEmployeeDocuments = async (
  employeeId: string,
  type: EmployeeDocumentType
): Promise<EmployeeDocument[]> => {
  try {
    const path = `${STORAGE_BASE_PATH}/${employeeId}/${type}`;
    const folderRef = ref(storageCLevel, path);
    const result = await listAll(folderRef);

    const documents: EmployeeDocument[] = [];

    for (const item of result.items) {
      const url = await getDownloadURL(item);
      const name = item.name;
      // Extract timestamp from filename (format: {timestamp}_{originalName})
      const timestamp = parseInt(name.split("_")[0]) || Date.now();

      documents.push({
        name: name.substring(name.indexOf("_") + 1), // Remove timestamp prefix
        url,
        path: item.fullPath,
        type,
        uploadedAt: timestamp,
      });
    }

    // Sort by upload time (newest first)
    return documents.sort((a, b) => b.uploadedAt - a.uploadedAt);
  } catch {
    return [];
  }
};

/**
 * Get all documents for an employee (both surat and foto)
 */
export const getAllEmployeeDocuments = async (
  employeeId: string
): Promise<{ surat: EmployeeDocument[]; foto: EmployeeDocument[] }> => {
  const [surat, foto] = await Promise.all([
    listEmployeeDocuments(employeeId, "surat"),
    listEmployeeDocuments(employeeId, "foto"),
  ]);

  return { surat, foto };
};

/**
 * Delete dokumen karyawan
 */
export const deleteEmployeeDocument = async (path: string): Promise<void> => {
  const fileRef = ref(storageCLevel, path);
  await deleteObject(fileRef);
};

/**
 * Check if employee has documents
 */
export const checkEmployeeHasDocuments = async (
  employeeId: string
): Promise<{ hasSurat: boolean; hasFoto: boolean }> => {
  try {
    const { surat, foto } = await getAllEmployeeDocuments(employeeId);
    return {
      hasSurat: surat.length > 0,
      hasFoto: foto.length > 0,
    };
  } catch {
    return { hasSurat: false, hasFoto: false };
  }
};
