import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ImageIcon,
  Users,
  BarChart3,
} from "lucide-react";
import { useHRClockAttendance } from "../hooks/useHRClockAttendance";
import { useHREmployees } from "../hooks/useHREmployees";
import { DirectorUser } from "../../../core/types/auth";
import { UserRole } from "../../../core/types/roles";

interface Props {
  user: DirectorUser;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PRESENT: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Hadir" },
  LATE: { bg: "bg-amber-100", text: "text-amber-700", label: "Terlambat" },
  ABSENT: { bg: "bg-rose-100", text: "text-rose-700", label: "Tidak Hadir" },
  SICK: { bg: "bg-blue-100", text: "text-blue-700", label: "Sakit" },
  LEAVE: { bg: "bg-violet-100", text: "text-violet-700", label: "Cuti" },
  WFA: { bg: "bg-cyan-100", text: "text-cyan-700", label: "WFA" },
};

export default function HRClockAttendancePage({ user }: Props) {
  const now = new Date();
  const isHR = user.primaryRole === UserRole.HR;
  const isCEO = user.primaryRole === UserRole.CEO;
  const isCOO = user.primaryRole === UserRole.COO;
  const isCFO = user.primaryRole === UserRole.CFO;
  const isCTO = user.primaryRole === UserRole.CTO;
  const isCMO = user.primaryRole === UserRole.CMO;
  const isADMIN = user.primaryRole === UserRole.ADMIN;
  const isSECRETARY = user.primaryRole === UserRole.SECRETARY;
  const canViewAll = isHR || isCEO;
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split("T")[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { items: allEmployees } = useHREmployees();
  const myEmployee = allEmployees.find((e) => e.id === user.uid);

  // Create user object for hook
  const userForHook = {
    uid: user.uid,
    fullName: user.fullName,
    role: user.primaryRole,
  };

  // Create fallback employee data from user profile if not found in HR employees
  const employeeData = myEmployee || {
    id: user.uid,
    fullName: user.fullName,
    email: user.email || "",
    phone: "",
    nik: "",
    position: user.primaryRole || "Director",
    department: user.department || "Management",
    employmentType: "FULL_TIME" as const,
    status: "ACTIVE" as const,
    joinDate: new Date().toISOString().split("T")[0],
    gender: "MALE" as const,
  };

  // Debug logging
  console.log("User data:", { uid: user.uid, fullName: user.fullName, role: user.primaryRole });
  console.log("All employees count:", allEmployees.length);
  console.log("My employee found:", myEmployee);
  console.log("Employee data used:", employeeData);

  const {
    todayAttendance,
    myAttendanceHistory,
    allAttendance,
    monthlyAttendance,
    dailySummary,
    stats,
    loading,
    todayStr,
    currentMonth,
    currentYear,
    checkClockIn,
    checkClockOut,
    doClockIn,
    doClockOut,
    markStatus,
    canViewAllRecords,
  } = useHRClockAttendance(
    userForHook,
    employeeData,
    selectedDate,
    selectedMonth,
    selectedYear,
    isHR,
    isCEO,
    isCOO,
    isCFO,
    isCTO,
    isCMO,
    isADMIN,
    isSECRETARY
  );

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"in" | "out" | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<"my" | "all">(canViewAll ? "all" : "my");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Check clock status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const inStatus = await checkClockIn();
    if (!inStatus.canClock) {
      await checkClockOut();
    }
  };

  // Start camera
  const startCamera = async (mode: "in" | "out") => {
    setCameraMode(mode);
    setCameraOpen(true);
    setCapturedImage(null);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraOpen(false);
    setCapturedImage(null);
  };

  // Capture photo
  const capturePhoto = () => {
    console.log("Capturing photo...");
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Canvas context not available");
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    console.log("Canvas size:", canvas.width, "x", canvas.height);

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    console.log("Image captured, size:", imageData.length);
    
    // Save captured image
    setCapturedImage(imageData);
    
    // Close camera modal (but keep capturedImage for preview)
    setCameraOpen(false);
    
    // Stop camera tracks
    if (video.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!capturedImage || !cameraMode) return;

    setProcessing(true);
    setError(null);

    try {
      console.log("Submitting attendance...", cameraMode);
      
      // Convert base64 to blob
      console.log("Converting base64 to blob...");
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      console.log("Blob created:", { size: blob.size, type: blob.type });

      if (blob.size === 0) {
        throw new Error("Foto kosong. Silakan ambil ulang.");
      }

      // Get location
      let location: { lat: number; lng: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        console.log("Location obtained:", location);
      } catch {
        console.log("Location not obtained (optional)");
      }

      console.log("Calling clock function...");
      if (cameraMode === "in") {
        await doClockIn(blob, location);
        setSuccess("Berhasil absen masuk! Selamat bekerja.");
      } else {
        await doClockOut(blob, location);
        setSuccess("Berhasil absen pulang! Hati-hati di jalan.");
      }
      console.log("Attendance submitted successfully");

      setCapturedImage(null);
      setCameraMode(null);
    } catch (err: any) {
      console.error("Error in submitAttendance:", err);
      setError(err?.message || "Gagal absen. Silakan coba lagi.");
    } finally {
      setProcessing(false);
    }
  };

  // Get unique departments for filter
  const departments = [...new Set(allEmployees.map((e) => e.department))];

  // Filter attendance
  const filteredAttendance = allAttendance.filter((record) => {
    if (filterDepartment !== "all" && record.department !== filterDepartment) return false;
    if (filterStatus !== "all" && record.status !== filterStatus) return false;
    return true;
  });

  const monthlyAttendanceByEmployee = allEmployees.map((employee) => {
    const records = monthlyAttendance
      .filter((record) => record.employeeId === employee.id)
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    const presentCount = records.filter((record) => record.status === "PRESENT").length;
    const lateCount = records.filter((record) => record.status === "LATE").length;
    const absentCount = records.filter((record) => record.status === "ABSENT").length;
    const sickCount = records.filter((record) => record.status === "SICK").length;
    const leaveCount = records.filter((record) => record.status === "LEAVE").length;
    const wfaCount = records.filter((record) => record.status === "WFA").length;
    const attendanceDates = records
      .filter((record) => record.status === "PRESENT" || record.status === "LATE")
      .map((record) => record.date);

    return {
      employee,
      records,
      presentCount,
      lateCount,
      absentCount,
      sickCount,
      leaveCount,
      wfaCount,
      totalAttendance: presentCount + lateCount,
      attendanceDates,
      averageWorkHours:
        records.length > 0
          ? Math.round(
              (records.reduce((acc, record) => acc + (record.workDurationHours || 0), 0) /
                records.length) *
                100
            ) / 100
          : 0,
    };
  });

  const selectedEmployeeMonthly = monthlyAttendanceByEmployee.find(
    (item) => item.employee.id === selectedEmployeeId
  );

  const monthSummary = monthlyAttendance.reduce(
    (acc, record) => {
      acc.totalRecords += 1;
      if (record.status === "PRESENT") acc.present += 1;
      if (record.status === "LATE") acc.late += 1;
      if (record.status === "ABSENT") acc.absent += 1;
      if (record.status === "SICK") acc.sick += 1;
      if (record.status === "LEAVE") acc.leave += 1;
      if (record.status === "WFA") acc.wfa += 1;
      return acc;
    },
    { totalRecords: 0, present: 0, late: 0, absent: 0, sick: 0, leave: 0, wfa: 0 }
  );
  const ongoingTodayRecords = monthlyAttendance.filter(
    (record) =>
      record.date === todayStr &&
      !!record.clockInAt &&
      !record.clockOutAt
  );

  // Format time
  const formatTime = (timestamp: number) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  // Format duration
  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return "-";
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}j ${m}m`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Sistem Absensi</h1>
          <p className="text-slate-500">Absen masuk & pulang dengan foto</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-900">
            {new Date(selectedDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-slate-500">{new Date().toLocaleTimeString("id-ID")}</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        </div>
      )}

      {/* Main Clock In/Out Card */}
      <div className="rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-white shadow-2xl">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold">{myEmployee?.fullName || user.fullName}</h2>
            <p className="text-emerald-100">{myEmployee?.department || user.department} • {myEmployee?.position || user.primaryRole}</p>
            
            {todayAttendance ? (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
                  <p className="text-xs text-emerald-100">Masuk</p>
                  <p className="text-xl font-bold">{formatTime(todayAttendance.clockInAt)}</p>
                </div>
                {todayAttendance.clockOutAt ? (
                  <div className="rounded-xl bg-white/20 p-3 backdrop-blur">
                    <p className="text-xs text-emerald-100">Pulang</p>
                    <p className="text-xl font-bold">{formatTime(todayAttendance.clockOutAt)}</p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-400/30 p-3 backdrop-blur">
                    <p className="text-xs text-amber-100">Sedang Bekerja</p>
                    <p className="text-sm">{formatDuration((Date.now() - todayAttendance.clockInAt) / (1000 * 60 * 60))}</p>
                  </div>
                )}
                <div className={`rounded-xl p-3 ${STATUS_COLORS[todayAttendance.status]?.bg || "bg-white/20"}`}>
                  <span className={`font-bold ${STATUS_COLORS[todayAttendance.status]?.text || "text-white"}`}>
                    {STATUS_COLORS[todayAttendance.status]?.label || todayAttendance.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-emerald-100">Belum absen hari ini</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {!todayAttendance?.clockInAt ? (
              <button
                onClick={() => startCamera("in")}
                disabled={cameraOpen}
                className="flex items-center gap-3 rounded-xl bg-white px-8 py-4 font-bold text-emerald-600 shadow-lg transition hover:scale-105 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Camera size={24} />
                Absen Masuk
              </button>
            ) : !todayAttendance?.clockOutAt ? (
              <button
                onClick={() => startCamera("out")}
                disabled={cameraOpen}
                className="flex items-center gap-3 rounded-xl bg-amber-400 px-8 py-4 font-bold text-amber-900 shadow-lg transition hover:scale-105 hover:bg-amber-300 disabled:opacity-50"
              >
                <Clock size={24} />
                Absen Pulang
              </button>
            ) : (
              <div className="rounded-xl bg-white/20 p-4 text-center backdrop-blur">
                <CheckCircle size={32} className="mx-auto mb-2" />
                <p className="font-bold">Selesai Hari Ini</p>
                <p className="text-sm text-emerald-100">Total: {formatDuration(todayAttendance.workDurationHours)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4">
            <h3 className="mb-4 text-center text-xl font-bold">
              {cameraMode === "in" ? "Absen Masuk" : "Absen Pulang"} - Ambil Foto
            </h3>
            
            <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={capturePhoto}
                className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
              >
                <Camera size={20} className="mx-auto" />
                Ambil Foto
              </button>
              <button
                onClick={stopCamera}
                className="rounded-xl bg-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {capturedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4">
            <h3 className="mb-4 text-center text-xl font-bold">Konfirmasi Foto</h3>
            
            <img
              src={capturedImage}
              alt="Captured"
              className="aspect-video w-full rounded-xl object-cover"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={submitAttendance}
                disabled={processing}
                className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {processing ? "Memproses..." : `Konfirmasi ${cameraMode === "in" ? "Masuk" : "Pulang"}`}
              </button>
              <button
                onClick={() => startCamera(cameraMode!)}
                disabled={processing}
                className="rounded-xl bg-amber-100 px-6 py-3 font-bold text-amber-700 hover:bg-amber-200"
              >
                Ulangi
              </button>
              <button
                onClick={() => setCapturedImage(null)}
                disabled={processing}
                className="rounded-xl bg-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-600">Hadir</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.presentDays}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm text-amber-600">Terlambat</p>
          <p className="text-2xl font-bold text-amber-700">{stats.lateDays}</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-4">
          <p className="text-sm text-rose-600">Tidak Hadir</p>
          <p className="text-2xl font-bold text-rose-700">{stats.absentDays}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-blue-600">Rata-rata Jam</p>
          <p className="text-2xl font-bold text-blue-700">{stats.averageWorkHours}j</p>
        </div>
      </div>

      {/* View Toggle (HR/CEO only) */}
      {canViewAll && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode("my")}
              className={`rounded-xl px-4 py-2 font-semibold ${viewMode === "my" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              Absensi Saya
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`rounded-xl px-4 py-2 font-semibold ${viewMode === "all" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              Rekap Semua Karyawan
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const nextMonth = Number(e.target.value);
                setSelectedMonth(nextMonth);
                const currentDay = new Date(selectedDate).getDate();
                const maxDay = new Date(selectedYear, nextMonth, 0).getDate();
                const safeDay = Math.min(currentDay, maxDay);
                setSelectedDate(
                  `${selectedYear}-${String(nextMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`
                );
              }}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2000, index, 1).toLocaleDateString("id-ID", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                const nextYear = Number(e.target.value);
                setSelectedYear(nextYear);
                const currentDay = new Date(selectedDate).getDate();
                const maxDay = new Date(nextYear, selectedMonth, 0).getDate();
                const safeDay = Math.min(currentDay, maxDay);
                setSelectedDate(
                  `${nextYear}-${String(selectedMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`
                );
              }}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              {Array.from({ length: 5 }, (_, index) => now.getFullYear() - 2 + index).map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* All Attendance View (HR/CEO) */}
      {viewMode === "all" && canViewAll && (
        <div className="space-y-4">
          {/* Summary */}
          {dailySummary && (
            <div className="grid gap-4 md:grid-cols-6">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold">{dailySummary.totalEmployees}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Hadir</p>
                <p className="text-xl font-bold text-emerald-700">{dailySummary.presentCount}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Terlambat</p>
                <p className="text-xl font-bold text-amber-700">{dailySummary.lateCount}</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-xs text-rose-600">Sakit</p>
                <p className="text-xl font-bold text-rose-700">{dailySummary.sickCount}</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-xs text-violet-600">Cuti</p>
                <p className="text-xl font-bold text-violet-700">{dailySummary.leaveCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Belum Pulang</p>
                <p className="text-xl font-bold">{dailySummary.notYetClockIn}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Rekap Bulanan</p>
              <p className="text-xl font-bold">{monthSummary.totalRecords}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-600">Hadir Bulanan</p>
              <p className="text-xl font-bold text-emerald-700">{monthSummary.present}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Terlambat Bulanan</p>
              <p className="text-xl font-bold text-amber-700">{monthSummary.late}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-xs text-rose-600">Tidak Hadir Bulanan</p>
              <p className="text-xl font-bold text-rose-700">{monthSummary.absent}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Sakit Bulanan</p>
              <p className="text-xl font-bold text-blue-700">{monthSummary.sick}</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs text-violet-600">Cuti / WFA</p>
              <p className="text-xl font-bold text-violet-700">{monthSummary.leave + monthSummary.wfa}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900">Absensi Hari Ini yang Sedang Berlangsung</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Karyawan yang sudah absen masuk hari ini tetapi belum absen pulang.
              </p>
            </div>
            <div className="p-4">
              {ongoingTodayRecords.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {ongoingTodayRecords.map((record) => (
                    <div key={record.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-slate-900">{record.employeeName}</p>
                      <p className="text-sm text-slate-500">{record.department} • {record.position}</p>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Masuk</span>
                        <span className="font-semibold text-amber-700">{formatTime(record.clockInAt)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Durasi berjalan</span>
                        <span className="font-semibold text-slate-900">
                          {formatDuration((Date.now() - record.clockInAt) / (1000 * 60 * 60))}
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                          Sedang bekerja
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Tidak ada absensi yang sedang berlangsung hari ini.</p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="all">Semua Divisi</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="all">Semua Status</option>
              <option value="PRESENT">Hadir</option>
              <option value="LATE">Terlambat</option>
              <option value="ABSENT">Tidak Hadir</option>
              <option value="SICK">Sakit</option>
              <option value="LEAVE">Cuti</option>
              <option value="WFA">WFA</option>
            </select>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-slate-400" />
                  <h3 className="text-lg font-bold text-slate-900">Rekap Bulanan per Karyawan</h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Klik satu karyawan untuk melihat total hadir bulan ini dan tanggal absennya secara rinci.
                </p>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Karyawan</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Hadir</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Terlambat</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Absen</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Rata-rata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyAttendanceByEmployee.map((item) => (
                      <tr
                        key={item.employee.id}
                        onClick={() => setSelectedEmployeeId(item.employee.id || null)}
                        className={`cursor-pointer transition hover:bg-slate-50 ${
                          selectedEmployeeId === item.employee.id ? "bg-emerald-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{item.employee.fullName}</p>
                          <p className="text-xs text-slate-500">{item.employee.department} • {item.employee.position}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-700">{item.totalAttendance}</td>
                        <td className="px-4 py-3 text-center font-semibold text-amber-700">{item.lateCount}</td>
                        <td className="px-4 py-3 text-center font-semibold text-rose-700">{item.absentCount}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-700">{item.averageWorkHours}j</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              {selectedEmployeeMonthly ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 size={18} className="text-slate-400" />
                      <h3 className="text-lg font-bold text-slate-900">Detail Rekap Karyawan</h3>
                    </div>
                    <p className="mt-2 text-base font-semibold text-slate-900">{selectedEmployeeMonthly.employee.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {selectedEmployeeMonthly.employee.department} • {selectedEmployeeMonthly.employee.position}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-600">Total Hadir</p>
                      <p className="text-xl font-bold text-emerald-700">{selectedEmployeeMonthly.totalAttendance}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs text-amber-600">Terlambat</p>
                      <p className="text-xl font-bold text-amber-700">{selectedEmployeeMonthly.lateCount}</p>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-3">
                      <p className="text-xs text-rose-600">Tidak Hadir</p>
                      <p className="text-xl font-bold text-rose-700">{selectedEmployeeMonthly.absentCount}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Rata-rata Jam</p>
                      <p className="text-xl font-bold text-blue-700">{selectedEmployeeMonthly.averageWorkHours}j</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">Tanggal Hadir Bulan Ini</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedEmployeeMonthly.attendanceDates.length > 0 ? (
                        selectedEmployeeMonthly.attendanceDates.map((date) => (
                          <span
                            key={date}
                            className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">Belum ada tanggal hadir di bulan ini.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">Riwayat Tanggal Lengkap</p>
                    <div className="mt-3 max-h-[260px] space-y-2 overflow-auto">
                      {selectedEmployeeMonthly.records.length > 0 ? (
                        selectedEmployeeMonthly.records.map((record) => (
                          <div key={record.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {new Date(record.date).toLocaleDateString("id-ID", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatTime(record.clockInAt)} - {formatTime(record.clockOutAt || 0)}
                              </p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[record.status]?.bg} ${STATUS_COLORS[record.status]?.text}`}>
                              {STATUS_COLORS[record.status]?.label || record.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">Belum ada riwayat untuk karyawan ini pada bulan tersebut.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <Users size={48} className="mb-3 text-slate-300" />
                  <p className="text-base font-semibold text-slate-600">Pilih karyawan</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Total hadir bulanan dan daftar tanggal absennya akan muncul di sini.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Rekap Harian {new Date(selectedDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Data ini bisa diganti ke hari lain, lalu dibandingkan dengan rekap bulanannya.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Karyawan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Divisi</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Masuk</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Pulang</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Durasi</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Foto</th>
                    {isHR && <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{record.employeeName}</p>
                        <p className="text-xs text-slate-500">{record.position}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{record.department}</td>
                      <td className="px-4 py-3 text-center">{formatTime(record.clockInAt)}</td>
                      <td className="px-4 py-3 text-center">{formatTime(record.clockOutAt || 0)}</td>
                      <td className="px-4 py-3 text-center">{formatDuration(record.workDurationHours)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[record.status]?.bg} ${STATUS_COLORS[record.status]?.text}`}>
                          {STATUS_COLORS[record.status]?.label || record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {record.clockInPhoto && (
                            <button
                              onClick={() => window.open(record.clockInPhoto, "_blank")}
                              className="rounded bg-emerald-100 p-1 text-emerald-600"
                              title="Foto Masuk"
                            >
                              <ImageIcon size={16} />
                            </button>
                          )}
                          {record.clockOutPhoto && (
                            <button
                              onClick={() => window.open(record.clockOutPhoto, "_blank")}
                              className="rounded bg-amber-100 p-1 text-amber-600"
                              title="Foto Pulang"
                            >
                              <ImageIcon size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      {isHR && (
                        <td className="px-4 py-3 text-center">
                          {!record.clockInAt && (
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => markStatus(record.id!, "SICK", "Ditandai HR sebagai sakit")}
                                className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                              >
                                Sakit
                              </button>
                              <button
                                onClick={() => markStatus(record.id!, "LEAVE", "Ditandai HR sebagai cuti")}
                                className="rounded bg-violet-100 px-2 py-1 text-xs text-violet-700"
                              >
                                Cuti
                              </button>
                              <button
                                onClick={() => markStatus(record.id!, "ABSENT", "Ditandai HR sebagai tidak hadir")}
                                className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-700"
                              >
                                Absen
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* My Attendance View */}
      {viewMode === "my" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Riwayat Absensi Bulan Ini</h3>
          <div className="space-y-3">
            {myAttendanceHistory.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${STATUS_COLORS[record.status]?.bg || "bg-slate-100"}`}>
                    <span className={`text-lg font-bold ${STATUS_COLORS[record.status]?.text || "text-slate-600"}`}>
                      {new Date(record.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{new Date(record.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}</p>
                    <div className="flex gap-3 text-sm text-slate-500">
                      <span>Masuk: {formatTime(record.clockInAt)}</span>
                      <span>Pulang: {formatTime(record.clockOutAt || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[record.status]?.bg} ${STATUS_COLORS[record.status]?.text}`}>
                    {STATUS_COLORS[record.status]?.label || record.status}
                  </span>
                  <p className="mt-1 text-sm text-slate-500">{formatDuration(record.workDurationHours)}</p>
                </div>
              </div>
            ))}
            {myAttendanceHistory.length === 0 && (
              <p className="py-8 text-center text-slate-400">Belum ada riwayat absensi bulan ini</p>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
