import { useState, useRef, FormEvent } from "react";
import { X, Upload, User, Briefcase, DollarSign, Calendar, Phone, Mail, MapPin, CreditCard, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { createHREmployee, uploadEmployeeFile, HREmployee } from "../services/hrEmployeeService";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createdBy?: string;
};

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  nik: string;
  npwp: string;
  position: string;
  department: string;
  employmentType: HREmployee["employmentType"];
  status: HREmployee["status"];
  joinDate: string;
  birthDate: string;
  birthPlace: string;
  gender: HREmployee["gender"];
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  salary: string;
};

const DEPARTMENTS = [
  "Human Resources",
  "Finance",
  "Operations",
  "Technology",
  "Marketing",
  "Sales",
  "Customer Service",
  "Logistics",
  "Legal",
];

const POSITIONS = [
  "HR Manager",
  "HR Specialist",
  "HR Admin",
  "Finance Manager",
  "Accountant",
  "Finance Staff",
  "Operations Manager",
  "Operations Staff",
  "CTO",
  "Senior Developer",
  "Developer",
  "IT Support",
  "Marketing Manager",
  "Marketing Staff",
  "Sales Manager",
  "Sales Representative",
  "Customer Service Manager",
  "Customer Service Staff",
  "Logistics Manager",
  "Driver Recruitment Specialist",
  "Legal Counsel",
  "Office Boy/Girl",
  "Security",
  "Receptionist",
];

export default function HRAddEmployeeModal({ isOpen, onClose, onSuccess, createdBy }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    nik: "",
    npwp: "",
    position: "",
    department: "",
    employmentType: "FULL_TIME",
    status: "ACTIVE",
    joinDate: new Date().toISOString().split("T")[0],
    birthDate: "",
    birthPlace: "",
    gender: "MALE",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    salary: "",
  });

  const [documents, setDocuments] = useState<{
    ktp: File | null;
    npwp: File | null;
    kk: File | null;
    bpjsKesehatan: File | null;
    bpjsKetenagakerjaan: File | null;
    ijazah: File | null;
    photo: File | null;
    contract: File | null;
  }>({
    ktp: null,
    npwp: null,
    kk: null,
    bpjsKesehatan: null,
    bpjsKetenagakerjaan: null,
    ijazah: null,
    photo: null,
    contract: null,
  });

  const fileInputRefs = {
    ktp: useRef<HTMLInputElement>(null),
    npwp: useRef<HTMLInputElement>(null),
    kk: useRef<HTMLInputElement>(null),
    bpjsKesehatan: useRef<HTMLInputElement>(null),
    bpjsKetenagakerjaan: useRef<HTMLInputElement>(null),
    ijazah: useRef<HTMLInputElement>(null),
    photo: useRef<HTMLInputElement>(null),
    contract: useRef<HTMLInputElement>(null),
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.nik || !formData.position) {
        throw new Error("Please fill all required fields");
      }

      // Create employee
      const employeeData: Omit<HREmployee, "id" | "createdAt" | "updatedAt"> = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        nik: formData.nik,
        npwp: formData.npwp || undefined,
        position: formData.position,
        department: formData.department,
        employmentType: formData.employmentType,
        status: formData.status,
        joinDate: formData.joinDate,
        birthDate: formData.birthDate || undefined,
        birthPlace: formData.birthPlace || undefined,
        gender: formData.gender,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyName ? {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: formData.emergencyRelation,
        } : undefined,
        bankAccount: formData.bankName ? {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
        } : undefined,
        salary: formData.salary ? parseInt(formData.salary) : undefined,
      };

      const newEmployeeId = await createHREmployee(employeeData, createdBy);
      setEmployeeId(newEmployeeId);
      setSuccess(true);
      
      // Move to document upload step
      setStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (!employeeId) return;
    
    setLoading(true);
    setError("");

    try {
      const uploadPromises: Promise<void>[] = [];

      Object.entries(documents).forEach(([docType, file]) => {
        if (file) {
          uploadPromises.push(
            uploadEmployeeFile(
              employeeId,
              docType as any,
              file,
              createdBy
            ).then(() => {})
          );
        }
      });

      await Promise.all(uploadPromises);
      setStep(3);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || "Failed to upload documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (docType: keyof typeof documents, file: File | null) => {
    setDocuments((prev) => ({ ...prev, [docType]: file }));
  };

  const DocumentUploadField = ({
    label,
    docType,
    accept = ".pdf,.jpg,.jpeg,.png",
  }: {
    label: string;
    docType: keyof typeof documents;
    accept?: string;
  }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
            <FileText size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">
              {documents[docType] ? documents[docType]!.name : "No file selected"}
            </p>
          </div>
        </div>
        <label className="cursor-pointer">
          <input
            ref={fileInputRefs[docType]}
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => handleFileChange(docType, e.target.files?.[0] || null)}
          />
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200">
            <Upload size={14} />
            {documents[docType] ? "Change" : "Upload"}
          </div>
        </label>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <User size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Add New Employee</h2>
                <p className="text-sm text-slate-500">
                  Step {step} of 3: {step === 1 ? "Personal Information" : step === 2 ? "Document Upload" : "Complete"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition ${
                  s <= step ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <User size={18} className="text-emerald-600" />
                  Personal Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="employee@company.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="081234567890"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      NIK (KTP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nik: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="3171234567890001"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      NPWP
                    </label>
                    <input
                      type="text"
                      value={formData.npwp}
                      onChange={(e) => setFormData((prev) => ({ ...prev, npwp: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="09.123.456.7-123.000"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Birth Place
                    </label>
                    <input
                      type="text"
                      value={formData.birthPlace}
                      onChange={(e) => setFormData((prev) => ({ ...prev, birthPlace: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Jakarta"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      rows={2}
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
              </section>

              {/* Employment Information */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <Briefcase size={18} className="text-emerald-600" />
                  Employment Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Position <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.position}
                      onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select Position</option>
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, employmentType: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Join Date
                    </label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, joinDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Salary (IDR)
                    </label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="10000000"
                    />
                  </div>
                </div>
              </section>

              {/* Emergency Contact */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <Phone size={18} className="text-emerald-600" />
                  Emergency Contact
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyName: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyPhone: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="081234567890"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Relation
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyRelation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, emergencyRelation: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Spouse, Parent, etc"
                    />
                  </div>
                </div>
              </section>

              {/* Bank Account */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <CreditCard size={18} className="text-emerald-600" />
                  Bank Account
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Bank Name
                    </label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select Bank</option>
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="CIMB">CIMB</option>
                      <option value="Danamon">Danamon</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Account Holder
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData((prev) => ({ ...prev, accountHolder: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Name on account"
                    />
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next Step
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} className="text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">Employee Created Successfully!</p>
                    <p className="text-sm text-emerald-700">
                      Now upload required documents for {formData.fullName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DocumentUploadField label="KTP (Required)" docType="ktp" />
                <DocumentUploadField label="NPWP" docType="npwp" />
                <DocumentUploadField label="KK (Family Card)" docType="kk" />
                <DocumentUploadField label="BPJS Kesehatan" docType="bpjsKesehatan" />
                <DocumentUploadField label="BPJS Ketenagakerjaan" docType="bpjsKetenagakerjaan" />
                <DocumentUploadField label="Ijazah / Certificate" docType="ijazah" />
                <DocumentUploadField label="Photo (3x4)" docType="photo" accept=".jpg,.jpeg,.png" />
                <DocumentUploadField label="Employment Contract" docType="contract" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={handleUploadDocuments}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-900">All Done!</h3>
              <p className="mt-2 text-slate-500">
                Employee <strong>{formData.fullName}</strong> has been added successfully with all documents.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
