import { useState, useRef, useCallback } from "react";
import { 
  Clock, 
  CheckCircle, 
  Camera,
  MapPin,
  Loader2,
  Calendar,
  Coffee,
  Home,
  FileText
} from "lucide-react";
import { ClockRecord, ClockAttendanceStatus } from "../hooks/useCOOAttendance";

interface Props {
  user: any;
  todayAttendance: ClockRecord | null;
  stats: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    sickDays: number;
    leaveDays: number;
    wfaDays: number;
    averageWorkHours: number;
  };
  doClockIn: (photoBlob: Blob, location?: { lat: number; lng: number }, notes?: string) => Promise<any>;
  doClockOut: (photoBlob: Blob, location?: { lat: number; lng: number }, notes?: string) => Promise<void>;
  processing: boolean;
  getStatusLabel: (status: ClockAttendanceStatus) => string;
  getStatusColor: (status: ClockAttendanceStatus) => string;
}

export default function COOAttendancePanelV2({
  user,
  todayAttendance,
  stats,
  doClockIn,
  doClockOut,
  processing,
  getStatusLabel,
  getStatusColor,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [mode, setMode] = useState<"in" | "out" | null>(null);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasCheckedIn = !!todayAttendance?.clockInAt;
  const hasCheckedOut = !!todayAttendance?.clockOutAt;

  // Get location
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Tidak dapat mengakses lokasi. Pastikan izin lokasi diaktifkan.");
          setLocation(undefined);
        }
      );
    } else {
      setLocationError("Browser tidak mendukung geolocation");
    }
  }, []);

  // Start camera
  const startCamera = async (clockMode: "in" | "out") => {
    setMode(clockMode);
    getLocation();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
    setCapturedPhoto(null);
    setPhotoBlob(null);
    setMode(null);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0);
      
      const photoData = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedPhoto(photoData);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
        }
      }, "image/jpeg", 0.8);
      
      // Stop stream
      stopCamera();
    }
  };

  // Submit clock in/out
  const handleSubmit = async () => {
    if (!photoBlob || !mode) return;

    try {
      if (mode === "in") {
        await doClockIn(photoBlob, location, notes);
        alert("✅ Clock In berhasil!");
      } else {
        await doClockOut(photoBlob, location, notes);
        alert("✅ Clock Out berhasil!");
      }
      
      // Reset
      setCapturedPhoto(null);
      setPhotoBlob(null);
      setNotes("");
      setMode(null);
    } catch (error: any) {
      alert(`❌ Error: ${error.message || "Terjadi kesalahan"}`);
    }
  };

  // Format time
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format duration
  const formatDuration = (hours?: number) => {
    if (!hours) return "-";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}j ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Clock In/Out Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            Absensi Hari Ini
          </h3>
          <span className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </span>
        </div>

        {todayAttendance ? (
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(todayAttendance.status)}`}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{getStatusLabel(todayAttendance.status)}</p>
                  <p className="text-sm text-slate-500">
                    Clock In: {formatTime(todayAttendance.clockInAt)}
                  </p>
                  {todayAttendance.clockOutAt && (
                    <p className="text-sm text-slate-500">
                      Clock Out: {formatTime(todayAttendance.clockOutAt)}
                    </p>
                  )}
                  {todayAttendance.workDurationHours > 0 && (
                    <p className="text-sm text-emerald-600 font-medium">
                      Durasi: {formatDuration(todayAttendance.workDurationHours)}
                    </p>
                  )}
                </div>
              </div>
              {!hasCheckedOut && (
                <button
                  onClick={() => startCamera("out")}
                  disabled={processing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  Clock Out
                </button>
              )}
            </div>
            
            {/* Show photo if available */}
            {todayAttendance.clockInPhoto && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <FileText size={14} />
                <span>Foto check-in tersimpan</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => startCamera("in")}
              disabled={processing || hasCheckedIn}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              {processing ? "Memproses..." : "Clock In"}
            </button>
          </div>
        )}
      </div>

      {/* Monthly Stats - HR Style */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar size={16} /> Ringkasan Bulan Ini
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-xl font-black text-emerald-600">{stats?.presentDays || 0}</p>
            <p className="text-xs text-emerald-700 font-medium">Hadir</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xl font-black text-amber-600">{stats?.lateDays || 0}</p>
            <p className="text-xs text-amber-700 font-medium">Terlambat</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xl font-black text-blue-600">{stats?.sickDays || 0}</p>
            <p className="text-xs text-blue-700 font-medium">Sakit</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50 border border-purple-200">
            <p className="text-xl font-black text-purple-600">{stats?.leaveDays || 0}</p>
            <p className="text-xs text-purple-700 font-medium">Cuti</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-cyan-50 border border-cyan-200">
            <p className="text-xl font-black text-cyan-600">{stats?.wfaDays || 0}</p>
            <p className="text-xs text-cyan-700 font-medium">WFH</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-rose-50 border border-rose-200">
            <p className="text-xl font-black text-rose-600">{stats?.absentDays || 0}</p>
            <p className="text-xs text-rose-700 font-medium">Absen</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
            <p className="text-xl font-black text-slate-600">{stats?.averageWorkHours.toFixed(1) || 0}j</p>
            <p className="text-xs text-slate-700 font-medium">Rata-rata Jam Kerja</p>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {mode === "in" ? "Clock In" : "Clock Out"}
              </h3>
              <button onClick={stopCamera} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            </div>
            
            {locationError && (
              <div className="mt-2 p-2 bg-amber-50 text-amber-700 text-sm rounded-lg">
                ⚠️ {locationError}
              </div>
            )}
            
            {location && (
              <div className="mt-2 p-2 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
                <MapPin size={14} />
                Lokasi tersimpan
              </div>
            )}
            
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Tambahkan catatan..."
              />
            </div>
            
            <button
              onClick={capturePhoto}
              className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Ambil Foto
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {capturedPhoto && !showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Konfirmasi {mode === "in" ? "Clock In" : "Clock Out"}
            </h3>
            
            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
              <img 
                src={capturedPhoto} 
                alt="Captured" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setCapturedPhoto(null);
                  setPhotoBlob(null);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Ulangi
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {processing ? "Memproses..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
