import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { dbCLevel, storageCLevel } from "../../../core/firebase/firebaseCLevel";

const ATTENDANCE_CLOCK_COLLECTION = "hr_clock_attendance";

// Attendance Status Types
export type ClockAttendanceStatus = 
  | "PRESENT"      // Hadir normal
  | "LATE"         // Terlambat
  | "ABSENT"       // Tidak hadir
  | "SICK"         // Sakit
  | "LEAVE"        // Cuti
  | "WFA";         // Work From Anywhere

// Clock In/Out Record
export interface ClockRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  role: string;  // C-Level role
  
  // Clock In
  clockInAt: number;
  clockInPhoto: string;  // URL foto
  clockInLocation?: { lat: number; lng: number };
  clockInNotes?: string;
  
  // Clock Out (optional, can be null if not clocked out yet)
  clockOutAt?: number;
  clockOutPhoto?: string;
  clockOutLocation?: { lat: number; lng: number };
  clockOutNotes?: string;
  
  // Calculated fields
  workDurationHours: number;  // Total jam kerja
  status: ClockAttendanceStatus;
  
  // Date info
  date: string;  // YYYY-MM-DD
  month: number;
  year: number;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

// Daily summary for HR view
export interface DailyAttendanceSummary {
  date: string;
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  sickCount: number;
  leaveCount: number;
  wfaCount: number;
  notYetClockIn: number;
}

// Convert blob to base64 for Firestore fallback
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Upload photo to Firebase Storage (with Firestore fallback)
export const uploadAttendancePhoto = async (
  employeeId: string,
  dateStr: string,
  type: "in" | "out",
  photoBlob: Blob
): Promise<string> => {
  try {
    console.log("Starting photo upload...", { employeeId, dateStr, type, blobSize: photoBlob.size });
    
    const filename = `${employeeId}_${dateStr}_${type}_${Date.now()}.jpg`;
    const path = `internal/karyawan/absen/${filename}`;
    console.log("Upload path:", path);
    
    const storageRef = ref(storageCLevel, path);
    console.log("Storage ref created");
    
    const uploadResult = await uploadBytes(storageRef, photoBlob);
    console.log("Upload successful:", uploadResult);
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log("Download URL obtained:", downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error("Error uploading photo:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // If permission error, return base64 for Firestore storage (fallback)
    if (error.code === "storage/unauthorized" || error.code === "storage/permission-denied") {
      console.log("Storage permission denied, using base64 fallback...");
      const base64 = await blobToBase64(photoBlob);
      console.log("Base64 generated (length:", base64.length, ")");
      return base64; // Store as base64 in Firestore field
    }
    
    throw new Error(`Failed to upload photo: ${error.message || error.code || "Unknown error"}`);
  }
};

// Clock In
export const clockIn = async (
  employeeId: string,
  employeeName: string,
  department: string,
  position: string,
  role: string,
  photoBlob: Blob,
  location?: { lat: number; lng: number },
  notes?: string
): Promise<string> => {
  console.log("clockIn service called:", { employeeId, employeeName, blobSize: photoBlob.size });
  
  const now = Date.now();
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  
  // Check if already clocked in today
  const existing = await getTodayAttendance(employeeId, dateStr);
  if (existing && existing.clockInAt) {
    throw new Error("Anda sudah absen masuk hari ini. Silakan absen pulang terlebih dahulu untuk absen lagi besok.");
  }
  
  // Check if there's previous day not clocked out
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterdayAttendance = await getTodayAttendance(employeeId, yesterdayStr);
  
  if (yesterdayAttendance && !yesterdayAttendance.clockOutAt) {
    // Auto clock out yesterday with warning
    await autoClockOut(yesterdayAttendance.id!, yesterdayAttendance.clockInAt);
  }
  
  // Upload photo
  const photoUrl = await uploadAttendancePhoto(employeeId, dateStr, "in", photoBlob);
  
  // Determine status (check if late - after 9 AM)
  const hour = date.getHours();
  const minute = date.getMinutes();
  const isLate = hour > 9 || (hour === 9 && minute > 0);
  
  const attendanceData: Omit<ClockRecord, "id"> = {
    employeeId,
    employeeName,
    department,
    position,
    role,
    clockInAt: now,
    clockInPhoto: photoUrl,
    clockInLocation: location,
    clockInNotes: notes || "",
    workDurationHours: 0,
    status: isLate ? "LATE" : "PRESENT",
    date: dateStr,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    createdAt: now,
    updatedAt: now,
  };
  
  console.log("Saving attendance to Firestore...");
  const docRef = await addDoc(collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION), {
    ...attendanceData,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });
  console.log("Attendance saved to Firestore:", docRef.id);
  
  return docRef.id;
};

// Clock Out
export const clockOut = async (
  attendanceId: string,
  photoBlob: Blob,
  location?: { lat: number; lng: number },
  notes?: string
): Promise<void> => {
  console.log("clockOut service called:", { attendanceId, blobSize: photoBlob.size });
  
  const now = Date.now();
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  
  // Get current attendance
  const ref = doc(dbCLevel, ATTENDANCE_CLOCK_COLLECTION, attendanceId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    throw new Error("Data absensi tidak ditemukan");
  }
  
  const data = snap.data() as ClockRecord;
  
  if (!data.clockInAt) {
    throw new Error("Anda belum absen masuk hari ini");
  }
  
  if (data.clockOutAt) {
    throw new Error("Anda sudah absen pulang hari ini");
  }
  
  // Check minimum 8 hours
  const hoursWorked = (now - data.clockInAt) / (1000 * 60 * 60);
  
  if (hoursWorked < 8) {
    throw new Error(`Belum 8 jam kerja. Anda baru bekerja ${Math.floor(hoursWorked)} jam ${Math.floor((hoursWorked % 1) * 60)} menit. Minimum 8 jam untuk absen pulang.`);
  }
  
  // Upload photo
  const photoUrl = await uploadAttendancePhoto(data.employeeId, dateStr, "out", photoBlob);
  
  // Update attendance
  await updateDoc(ref, {
    clockOutAt: now,
    clockOutPhoto: photoUrl,
    clockOutLocation: location,
    clockOutNotes: notes || "",
    workDurationHours: Math.round(hoursWorked * 100) / 100,
    status: data.status === "LATE" ? "LATE" : "PRESENT",
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });
};

// Auto clock out for yesterday's attendance
const autoClockOut = async (attendanceId: string, clockInAt: number): Promise<void> => {
  const ref = doc(dbCLevel, ATTENDANCE_CLOCK_COLLECTION, attendanceId);
  const now = Date.now();
  const hoursWorked = (now - clockInAt) / (1000 * 60 * 60);
  
  await updateDoc(ref, {
    clockOutAt: now,
    clockOutNotes: "Auto clock out - tidak absen pulang",
    workDurationHours: Math.min(Math.round(hoursWorked * 100) / 100, 24), // Max 24 hours
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });
};

// Get today's attendance for employee
export const getTodayAttendance = async (
  employeeId: string,
  dateStr: string
): Promise<ClockRecord | null> => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION),
    where("employeeId", "==", employeeId),
    where("date", "==", dateStr),
    limit(1)
  );
  
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as ClockRecord;
};

// Check if employee can clock in
export const canClockIn = async (employeeId: string): Promise<{
  canClock: boolean;
  message: string;
  todayAttendance?: ClockRecord;
}> => {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  
  const today = await getTodayAttendance(employeeId, dateStr);
  
  if (today) {
    if (today.clockOutAt) {
      return { 
        canClock: false, 
        message: "Anda sudah absen masuk dan pulang hari ini. Silakan absen lagi besok.",
        todayAttendance: today 
      };
    }
    return { 
      canClock: false, 
      message: "Anda sudah absen masuk. Silakan absen pulang setelah 8 jam kerja.",
      todayAttendance: today 
    };
  }
  
  return { canClock: true, message: "Silakan absen masuk dengan foto" };
};

// Check if employee can clock out
export const canClockOut = async (employeeId: string): Promise<{
  canClock: boolean;
  message: string;
  todayAttendance?: ClockRecord;
  hoursWorked?: number;
}> => {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  
  const today = await getTodayAttendance(employeeId, dateStr);
  
  if (!today) {
    return { canClock: false, message: "Anda belum absen masuk hari ini" };
  }
  
  if (today.clockOutAt) {
    return { 
      canClock: false, 
      message: "Anda sudah absen pulang hari ini",
      todayAttendance: today 
    };
  }
  
  const hoursWorked = (Date.now() - today.clockInAt) / (1000 * 60 * 60);
  
  if (hoursWorked < 8) {
    return { 
      canClock: false, 
      message: `Belum 8 jam. Anda baru bekerja ${Math.floor(hoursWorked)} jam ${Math.floor((hoursWorked % 1) * 60)} menit.`,
      todayAttendance: today,
      hoursWorked 
    };
  }
  
  return { 
    canClock: true, 
    message: "Silakan absen pulang dengan foto",
    todayAttendance: today,
    hoursWorked 
  };
};

// Mark attendance as SICK or LEAVE (for HR or auto)
export const markAttendanceStatus = async (
  attendanceId: string,
  status: "SICK" | "LEAVE" | "WFA" | "ABSENT",
  notes?: string
): Promise<void> => {
  const ref = doc(dbCLevel, ATTENDANCE_CLOCK_COLLECTION, attendanceId);
  const now = Date.now();
  
  await updateDoc(ref, {
    status,
    notes: notes || "",
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });
};

// Subscribe to all attendance (for HR/CEO view)
export const subscribeAllAttendance = (
  dateStr: string,
  callback: (records: ClockRecord[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION),
    where("date", "==", dateStr)
  );
  
  return onSnapshot(q, 
    (snap) => {
      try {
        const records = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as ClockRecord));
        records.sort((a, b) => (b.clockInAt || 0) - (a.clockInAt || 0));
        callback(records);
      } catch (err) {
        console.error("Error processing attendance snapshot:", err);
        if (onError) onError(err as Error);
      }
    },
    (error) => {
      console.error("Attendance subscription error:", error);
      if (onError) onError(error);
    }
  );
};

// Subscribe to employee's own attendance
export const subscribeMyAttendance = (
  employeeId: string,
  month: number,
  year: number,
  callback: (records: ClockRecord[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION),
    where("employeeId", "==", employeeId),
    where("month", "==", month),
    where("year", "==", year)
  );
  
  return onSnapshot(q, 
    (snap) => {
      try {
        const records = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as ClockRecord));
        records.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        callback(records);
      } catch (err) {
        console.error("Error processing my attendance snapshot:", err);
        if (onError) onError(err as Error);
      }
    },
    (error) => {
      console.error("My attendance subscription error:", error);
      if (onError) onError(error);
    }
  );
};

// Get daily summary
export const getDailySummary = async (dateStr: string): Promise<DailyAttendanceSummary> => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION),
    where("date", "==", dateStr)
  );
  
  const snap = await getDocs(q);
  const records = snap.docs.map((doc) => doc.data() as ClockRecord);
  
  return {
    date: dateStr,
    totalEmployees: records.length,
    presentCount: records.filter((r) => r.status === "PRESENT").length,
    lateCount: records.filter((r) => r.status === "LATE").length,
    absentCount: records.filter((r) => r.status === "ABSENT").length,
    sickCount: records.filter((r) => r.status === "SICK").length,
    leaveCount: records.filter((r) => r.status === "LEAVE").length,
    wfaCount: records.filter((r) => r.status === "WFA").length,
    notYetClockIn: records.filter((r) => r.clockInAt && !r.clockOutAt).length,
  };
};

// Auto mark absent for employees who didn't clock in by end of day
export const autoMarkAbsent = async (dateStr: string, allEmployeeIds: string[]): Promise<void> => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION),
    where("date", "==", dateStr)
  );
  
  const snap = await getDocs(q);
  const clockedInIds = new Set(snap.docs.map((doc) => (doc.data() as ClockRecord).employeeId));
  
  const absentIds = allEmployeeIds.filter((id) => !clockedInIds.has(id));
  
  // Create absent records for those who didn't clock in
  const now = Date.now();
  const date = new Date(dateStr);
  
  const promises = absentIds.map(async (employeeId) => {
    // Get employee info from users collection
    // This would need to be passed in or fetched
    const attendanceData = {
      employeeId,
      employeeName: "Unknown",  // Should be fetched
      department: "Unknown",
      position: "Unknown",
      role: "Unknown",
      clockInAt: 0,
      clockInPhoto: "",
      workDurationHours: 0,
      status: "ABSENT" as ClockAttendanceStatus,
      date: dateStr,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      createdAt: now,
      updatedAt: now,
    };
    
    await addDoc(collection(dbCLevel, ATTENDANCE_CLOCK_COLLECTION), {
      ...attendanceData,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
  });
  
  await Promise.all(promises);
};

// Get attendance statistics for a period
export const getAttendanceStats = (
  records: ClockRecord[]
): {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  sickDays: number;
  leaveDays: number;
  averageWorkHours: number;
} => {
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "PRESENT").length;
  const lateDays = records.filter((r) => r.status === "LATE").length;
  const absentDays = records.filter((r) => r.status === "ABSENT").length;
  const sickDays = records.filter((r) => r.status === "SICK").length;
  const leaveDays = records.filter((r) => r.status === "LEAVE").length;
  
  const totalWorkHours = records.reduce((acc, r) => acc + (r.workDurationHours || 0), 0);
  const averageWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;
  
  return {
    totalDays,
    presentDays,
    lateDays,
    absentDays,
    sickDays,
    leaveDays,
    averageWorkHours: Math.round(averageWorkHours * 100) / 100,
  };
};
