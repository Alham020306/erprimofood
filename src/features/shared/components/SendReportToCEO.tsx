import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Send,
  Paperclip,
  File,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useCEOReports } from "../../ceo/hooks/useCEOReports";

interface Props {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "FINANCIAL" | "OPERATIONAL" | "TECHNICAL" | "MARKETING" | "HR" | "GENERAL" | "EXECUTIVE";
}

const reportTypes = [
  { value: "FINANCIAL", label: "Laporan Keuangan", color: "bg-emerald-500" },
  { value: "OPERATIONAL", label: "Laporan Operasional", color: "bg-blue-500" },
  { value: "TECHNICAL", label: "Laporan Teknis", color: "bg-purple-500" },
  { value: "MARKETING", label: "Laporan Marketing", color: "bg-pink-500" },
  { value: "HR", label: "Laporan HR", color: "bg-amber-500" },
  { value: "GENERAL", label: "Laporan Umum", color: "bg-slate-500" },
  { value: "EXECUTIVE", label: "Laporan Eksekutif", color: "bg-cyan-500" },
];

const priorities = [
  { value: "LOW", label: "Rendah", color: "bg-slate-100 text-slate-700" },
  { value: "MEDIUM", label: "Sedang", color: "bg-blue-100 text-blue-700" },
  { value: "HIGH", label: "Tinggi", color: "bg-amber-100 text-amber-700" },
  { value: "URGENT", label: "Mendesak", color: "bg-rose-100 text-rose-700" },
];

export default function SendReportToCEO({ user, isOpen, onClose, defaultType = "GENERAL" }: Props) {
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; file?: File }[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendReport, submitting } = useCEOReports(user);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments = Array.from(files).map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    }));

    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon size={20} className="text-purple-400" />;
    if (type.includes("pdf")) return <FileText size={20} className="text-rose-400" />;
    return <File size={20} className="text-blue-400" />;
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!title.trim()) newErrors.push("Judul laporan wajib diisi");
    if (!content.trim()) newErrors.push("Isi laporan wajib diisi");
    if (title.length < 5) newErrors.push("Judul minimal 5 karakter");
    if (content.length < 20) newErrors.push("Isi laporan minimal 20 karakter");
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // TODO: Upload files to storage and get URLs
    const attachmentData = attachments.map((att) => ({
      name: att.name,
      url: "#", // Would be actual URL after upload
      type: att.type,
      size: att.size,
    }));

    const success = await sendReport({
      type: type as any,
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      attachments: attachmentData,
      priority,
    });

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        // Reset form
        setTitle("");
        setContent("");
        setSummary("");
        setAttachments([]);
        setPriority("MEDIUM");
        setType(defaultType);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="text-cyan-400" size={24} />
              Kirim Laporan ke CEO
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Sampaikan laporan penting kepada Chief Executive Officer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mx-6 mt-4 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={24} />
            <span className="text-emerald-400 font-medium">Laporan berhasil dikirim ke CEO!</span>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-rose-500/20 border border-rose-500/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-rose-400" size={20} />
              <span className="text-rose-400 font-medium">Mohon perbaiki:</span>
            </div>
            <ul className="list-disc list-inside text-rose-300 text-sm">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Jenis Laporan
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {reportTypes.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setType(rt.value as any)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all text-left ${
                    type === rt.value
                      ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400"
                      : "bg-slate-800 border-2 border-transparent text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${rt.color} mb-2`} />
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Prioritas
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    priority === p.value
                      ? p.color + " ring-2 ring-offset-2 ring-offset-slate-900 ring-current"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Judul Laporan *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul laporan..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Summary (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ringkasan <span className="text-slate-500">(Opsional)</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan singkat laporan..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Isi Laporan *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jelaskan detail laporan Anda di sini..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
            />
            <p className="text-slate-500 text-xs mt-1">Minimal 20 karakter</p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Lampiran <span className="text-slate-500">(Max 5 file)</span>
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />

            {attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(att.type)}
                      <div>
                        <p className="text-sm text-slate-200">{att.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-2 hover:bg-rose-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {attachments.length < 5 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 rounded-xl text-slate-400 transition-colors"
              >
                <Upload size={18} />
                <span className="text-sm">Upload Dokumen (PDF, Word, Excel, Gambar)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || showSuccess}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-900 font-bold rounded-xl transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send size={18} />
                Kirim ke CEO
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
