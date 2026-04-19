import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  where,
  setDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { uploadEmployeeDocument, deleteEmployeeDocument } from "./hrStorageService";

const COLLECTION_NAME = "hr_employees";

export interface HREmployee {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  nik: string; // KTP Number
  npwp?: string; // Tax ID
  position: string;
  department: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TERMINATED";
  joinDate: string;
  birthDate?: string;
  birthPlace?: string;
  gender: "MALE" | "FEMALE";
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  salary?: number;
  documents?: {
    ktpUrl?: string;
    npwpUrl?: string;
    kkUrl?: string; // Family card
    bpjsKesehatanUrl?: string;
    bpjsKetenagakerjaanUrl?: string;
    ijazahUrl?: string;
    photoUrl?: string;
    contractUrl?: string;
  };
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
}

// Subscribe to employees real-time
export const subscribeHREmployees = (callback: (rows: HREmployee[]) => void) => {
  const q = query(
    collection(dbCLevel, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HREmployee[];
    callback(rows);
  });
};

// Create new employee
export const createHREmployee = async (
  employee: Omit<HREmployee, "id" | "createdAt" | "updatedAt">,
  createdBy?: string
): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(dbCLevel, COLLECTION_NAME), {
    ...employee,
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || "system",
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });
  return docRef.id;
};

// Update employee
export const updateHREmployee = async (
  employeeId: string,
  updates: Partial<HREmployee>
): Promise<void> => {
  const ref = doc(dbCLevel, COLLECTION_NAME, employeeId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};

// Delete employee
export const deleteHREmployee = async (employeeId: string): Promise<void> => {
  await deleteDoc(doc(dbCLevel, COLLECTION_NAME, employeeId));
};

// Upload employee document and update record
export const uploadEmployeeFile = async (
  employeeId: string,
  docType: "ktp" | "npwp" | "kk" | "bpjsKesehatan" | "bpjsKetenagakerjaan" | "ijazah" | "photo" | "contract",
  file: File,
  uploadedBy?: string
): Promise<string> => {
  // Upload to storage at internal/karyawan/administrasi/{employeeId}/{docType}/
  const path = `internal/karyawan/administrasi/${employeeId}/${docType}`;
  const fileName = `${Date.now()}_${file.name}`;
  
  // Upload and get URL
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const { storageCLevel } = await import("../../../core/firebase/firebaseCLevel");
  
  const storageRef = ref(storageCLevel, `${path}/${fileName}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  // Update employee document record
  const employeeRef = doc(dbCLevel, COLLECTION_NAME, employeeId);
  const docFieldMap: Record<string, string> = {
    ktp: "documents.ktpUrl",
    npwp: "documents.npwpUrl",
    kk: "documents.kkUrl",
    bpjsKesehatan: "documents.bpjsKesehatanUrl",
    bpjsKetenagakerjaan: "documents.bpjsKetenagakerjaanUrl",
    ijazah: "documents.ijazahUrl",
    photo: "documents.photoUrl",
    contract: "documents.contractUrl",
  };

  await updateDoc(employeeRef, {
    [docFieldMap[docType]]: downloadUrl,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  return downloadUrl;
};

// Get employee statistics
export const getHREmployeeStats = async () => {
  const snap = await getDocs(collection(dbCLevel, COLLECTION_NAME));
  const employees = snap.docs.map((d) => d.data() as HREmployee);

  return {
    total: employees.length,
    active: employees.filter((e) => e.status === "ACTIVE").length,
    inactive: employees.filter((e) => e.status === "INACTIVE").length,
    suspended: employees.filter((e) => e.status === "SUSPENDED").length,
    terminated: employees.filter((e) => e.status === "TERMINATED").length,
    byDepartment: employees.reduce((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPosition: employees.reduce((acc, e) => {
      acc[e.position] = (acc[e.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};

// Seed initial HR employee data
export const seedHREmployees = async () => {
  const now = Date.now();
  const batchEmployees: Omit<HREmployee, "id">[] = [
    {
      fullName: "Budi Santoso",
      email: "budi.santoso@rimofood.com",
      phone: "081234567890",
      nik: "3171234567890001",
      npwp: "09.123.456.7-123.000",
      position: "Senior HR Specialist",
      department: "Human Resources",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      joinDate: "2023-01-15",
      birthDate: "1990-05-20",
      birthPlace: "Jakarta",
      gender: "MALE",
      address: "Jl. Sudirman No. 123, Jakarta Selatan",
      emergencyContact: {
        name: "Ani Santoso",
        phone: "081234567891",
        relation: "Istri",
      },
      bankAccount: {
        bankName: "BCA",
        accountNumber: "1234567890",
        accountHolder: "Budi Santoso",
      },
      salary: 15000000,
    },
    {
      fullName: "Dewi Kusuma",
      email: "dewi.kusuma@rimofood.com",
      phone: "082345678901",
      nik: "3171234567890002",
      position: "HR Admin",
      department: "Human Resources",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      joinDate: "2023-03-01",
      birthDate: "1995-08-15",
      birthPlace: "Bandung",
      gender: "FEMALE",
      address: "Jl. Thamrin No. 45, Jakarta Pusat",
      emergencyContact: {
        name: "Rudi Kusuma",
        phone: "082345678902",
        relation: "Suami",
      },
      bankAccount: {
        bankName: "Mandiri",
        accountNumber: "0987654321",
        accountHolder: "Dewi Kusuma",
      },
      salary: 8000000,
    },
    {
      fullName: "Ahmad Fauzi",
      email: "ahmad.fauzi@rimofood.com",
      phone: "083456789012",
      nik: "3171234567890003",
      npwp: "09.987.654.3-321.000",
      position: "Driver Recruitment Specialist",
      department: "Human Resources",
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      joinDate: "2023-06-20",
      birthDate: "1988-12-10",
      birthPlace: "Surabaya",
      gender: "MALE",
      address: "Jl. Gatot Subroto No. 88, Jakarta Selatan",
      emergencyContact: {
        name: "Siti Aminah",
        phone: "083456789013",
        relation: "Istri",
      },
      bankAccount: {
        bankName: "BNI",
        accountNumber: "5678901234",
        accountHolder: "Ahmad Fauzi",
      },
      salary: 12000000,
    },
  ];

  for (const employee of batchEmployees) {
    const docRef = doc(collection(dbCLevel, COLLECTION_NAME));
    await setDoc(docRef, {
      ...employee,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
  }

  return { seededCount: batchEmployees.length };
};

// Check if employees collection exists and has data
export const checkHREmployeesCollection = async (): Promise<boolean> => {
  const snap = await getDocs(collection(dbCLevel, COLLECTION_NAME));
  return !snap.empty;
};
