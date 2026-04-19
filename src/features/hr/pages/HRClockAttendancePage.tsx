import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Briefcase,
  Moon,
  Sun,
  Filter,
  Download,
  ImageIcon,
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
  const isHR = user.primaryRole === UserRole.HR;
  const isCEO = user.primaryRole === UserRole.CEO;
  const isCOO = user.primaryRole === UserRole.COO;
  const isCFO = user.primaryRole === UserRole.CFO;
  const isCTO = user.primaryRole === UserRole.CTO;
  const isCMO = user.primaryRole === UserRole.CMO;
  const isADMIN = user.primaryRole === UserRole.ADMIN;
  const isSECRETARY = user.primaryRole === UserRole.SECRETARY;
  const canViewAll = isHR || isCEO || isCFO; // HR, CEO, and CFO can view all records

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
  } = useHRClockAttendance(userForHook, employeeData, isHR, isCEO, isCOO, isCFO, isCTO, isCMO, isADMIN, isSECRETARY);

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
  const [selectedDate, setSelectedDate] = useState(todayStr);
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
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
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
        <div className="flex gap-2">
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

          {/* Attendance Table */}
          <div className="rounded-xl bg-white shadow-sm">
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
