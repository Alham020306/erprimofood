import { useState } from "react";
import { useCFOFundRequests } from "../hooks/useCFOFundRequests";
import { useCFOUnifiedCashFlow } from "../hooks/useCFOUnifiedCashFlow";
import { formatCurrency } from "../utils/formatters";
import { DollarSign, Plus, Check, X, FileText, Wallet, ArrowUpRight, ArrowDownRight, Database, User, PieChart } from "lucide-react";
import CFOProfitBreakdown from "../components/CFOProfitBreakdown";

interface Props {
  user: any;
}

export default function CFOFundRequestsPage({ user }: Props) {
  const { loading, requests, myRequests, pendingApprovals, createRequest, processApproval } = useCFOFundRequests(user);
  const { 
    transactions, 
    dailySummary, 
    createManualTransaction,
    sourceBreakdown,
    manualCount,
    operationalCount 
  } = useCFOUnifiedCashFlow();
  
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [activeTab, setActiveTab] = useState<"requests" | "transactions" | "pending" | "profit">("requests");

  // Form states
  const [formData, setFormData] = useState({
    purpose: "",
    description: "",
    amount: "",
    category: "OPERATIONAL",
    urgency: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  });

  const [transactionData, setTransactionData] = useState({
    type: "IN" as "IN" | "OUT",
    category: "ORDER_COMMISSION" as 
      | "ORDER_COMMISSION" | "RESTAURANT_FEE" | "DRIVER_FEE" | "INVESTOR_FUNDING" | "LOAN_PROCEEDS" 
      | "ASSET_SALE" | "SERVICE_REVENUE" | "OTHER_INCOME"
      | "DRIVER_PAYMENT" | "RESTAURANT_SETTLEMENT" | "SALARY_PAYMENT" | "OPERATIONAL_EXPENSE"
      | "MARKETING_EXPENSE" | "TECHNOLOGY_EXPENSE" | "OFFICE_EXPENSE" | "TAX_PAYMENT"
      | "LOAN_REPAYMENT" | "INVESTOR_DIVIDEND" | "EQUIPMENT_PURCHASE" | "OTHER_EXPENSE",
    amount: "",
    description: "",
    reference: "",
  });

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequest({
      ...formData,
      amount: Number(formData.amount),
    });
    setShowNewRequest(false);
    setFormData({ purpose: "", description: "", amount: "", category: "OPERATIONAL", urgency: "MEDIUM" });
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    await createManualTransaction({
      ...transactionData,
      amount: Number(transactionData.amount),
    }, user);
    setShowNewTransaction(false);
    setTransactionData({ type: "IN", category: "ORDER_COMMISSION", amount: "", description: "", reference: "" });
  };

  if (loading) return <div className="p-6">Loading fund management...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              Fund Management
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Cash Flow & Fund Requests
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage fund requests dari role lain dan catat cash in/out
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewRequest(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus size={16} />
              Request Fund
            </button>
            <button
              onClick={() => setShowNewTransaction(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Wallet size={16} />
              Record Transaction
            </button>
          </div>
        </div>
      </section>

      {/* Daily Summary dengan Source Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ArrowDownRight size={16} />
            Cash In (Today)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {formatCurrency(dailySummary.cashIn)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 space-y-0.5">
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><Database size={10} /> Operational:</span>
              <span>{formatCurrency(sourceBreakdown?.operational?.cashIn || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><User size={10} /> Manual:</span>
              <span>{formatCurrency(sourceBreakdown?.manual?.cashIn || 0)}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
            <ArrowUpRight size={16} />
            Cash Out (Today)
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-800">
            {formatCurrency(dailySummary.cashOut)}
          </div>
          <div className="mt-1 text-xs text-rose-600 space-y-0.5">
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><Database size={10} /> Operational:</span>
              <span>{formatCurrency(sourceBreakdown?.operational?.cashOut || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1"><User size={10} /> Manual:</span>
              <span>{formatCurrency(sourceBreakdown?.manual?.cashOut || 0)}</span>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl border p-4 ${dailySummary.net >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className={`flex items-center gap-2 text-sm font-medium ${dailySummary.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            <Wallet size={16} />
            Net Flow
          </div>
          <div className={`mt-2 text-2xl font-bold ${dailySummary.net >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
            {formatCurrency(dailySummary.net)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {manualCount + operationalCount} total transactions
          </div>
          <div className="mt-1 flex gap-2 text-[10px]">
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
              {operationalCount} operational
            </span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
              {manualCount} manual
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: "requests", label: "My Requests", count: myRequests.length },
          { key: "pending", label: "Pending Approval", count: pendingApprovals.length },
          { key: "transactions", label: "Transactions", count: transactions.length },
          { key: "profit", label: "Profit Analysis", count: 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-emerald-600 text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "requests" && (
          <>
            {myRequests.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Belum ada fund request</p>
                <p className="text-sm">Klik "Request Fund" untuk membuat pengajuan</p>
              </div>
            ) : (
              myRequests.map((req: any) => (
                <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{req.purpose}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          req.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                          req.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                          "bg-rose-100 text-rose-700"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{req.description}</p>
                      <div className="mt-2 flex gap-4 text-xs text-slate-500">
                        <span>Amount: {formatCurrency(req.amount)}</span>
                        <span>Category: {req.category}</span>
                        <span>Urgency: {req.urgency}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{new Date(req.requestDate).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "pending" && (
          <>
            {pendingApprovals.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                <Check size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Tidak ada pending approval</p>
              </div>
            ) : (
              pendingApprovals.map((req: any) => (
                <div key={req.id} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{req.purpose}</span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                          AWAITING CFO
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{req.description}</p>
                      <div className="mt-2 text-xs text-slate-500">
                        Requested by: {req.requestedBy?.name} ({req.requestedBy?.role})
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {formatCurrency(req.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => processApproval(req.id, "APPROVE")}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        <Check size={14} />
                        Approve
                      </button>
                      <button
                        onClick={() => processApproval(req.id, "REJECT")}
                        className="flex items-center gap-1 rounded-xl bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "transactions" && (
          <>
            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                <Wallet size={48} className="mx-auto mb-4 text-slate-300" />
                <p>Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Source</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((trx: any) => (
                      <tr key={trx.id}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                            trx.type === "IN" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {trx.type === "IN" ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            {trx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {trx.description}
                          {trx.title && trx.title !== trx.description && (
                            <div className="text-xs text-slate-500">{trx.title}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                            trx.source === "OPERATIONAL"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                            {trx.source === "OPERATIONAL" ? <Database size={10} /> : <User size={10} />}
                            {trx.source === "OPERATIONAL" ? "Operational" : "Manual"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                          {formatCurrency(trx.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {trx.processedBy && <div className="text-slate-600">By: {trx.processedBy}</div>}
                          {trx.reference && <div>{trx.reference}</div>}
                          {!trx.processedBy && !trx.reference && "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "profit" && (
          <CFOProfitBreakdown user={user} />
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">New Fund Request</h3>
            <p className="text-sm text-slate-500">Ajukan permohonan dana ke CFO</p>
            <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Purpose</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="e.g., Marketing Campaign Q2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Amount (IDR)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Urgency</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewRequest(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {showNewTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Record Cash Transaction</h3>
            <p className="text-sm text-slate-500">Catat cash in atau cash out</p>
            <form onSubmit={handleSubmitTransaction} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={transactionData.type}
                    onChange={(e) => setTransactionData({ ...transactionData, type: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="IN">CASH IN</option>
                    <option value="OUT">CASH OUT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Source/Category (HURUF BESAR)</label>
                  <select
                    value={transactionData.category}
                    onChange={(e) => setTransactionData({ ...transactionData, category: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    {transactionData.type === "IN" ? (
                      <>
                        <option value="ORDER_COMMISSION">KOMISI ORDER</option>
                        <option value="RESTAURANT_FEE">BIAYA RESTAURANT</option>
                        <option value="DRIVER_FEE">BIAYA DRIVER</option>
                        <option value="INVESTOR_FUNDING">DANA INVESTOR</option>
                        <option value="LOAN_PROCEEDS">PINJAMAN</option>
                        <option value="ASSET_SALE">PENJUALAN ASET</option>
                        <option value="SERVICE_REVENUE">PENDAPATAN LAYANAN</option>
                        <option value="OTHER_INCOME">PENDAPATAN LAIN</option>
                      </>
                    ) : (
                      <>
                        <option value="DRIVER_PAYMENT">PEMBAYARAN DRIVER</option>
                        <option value="RESTAURANT_SETTLEMENT">SETTLEMENT RESTAURANT</option>
                        <option value="SALARY_PAYMENT">GAJI KARYAWAN</option>
                        <option value="OPERATIONAL_EXPENSE">BIAYA OPERASIONAL</option>
                        <option value="MARKETING_EXPENSE">BIAYA MARKETING</option>
                        <option value="TECHNOLOGY_EXPENSE">BIAYA TEKNOLOGI</option>
                        <option value="OFFICE_EXPENSE">BIAYA KANTOR</option>
                        <option value="TAX_PAYMENT">PEMBAYARAN PAJAK</option>
                        <option value="LOAN_REPAYMENT">PEMBAYARAN PINJAMAN</option>
                        <option value="INVESTOR_DIVIDEND">DIVIDEN INVESTOR</option>
                        <option value="EQUIPMENT_PURCHASE">PEMBELIAN PERALATAN</option>
                        <option value="OTHER_EXPENSE">PENGELUARAN LAIN</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Amount (IDR)</label>
                <input
                  type="number"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <input
                  type="text"
                  value={transactionData.description}
                  onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Reference (Optional)</label>
                <input
                  type="text"
                  value={transactionData.reference}
                  onChange={(e) => setTransactionData({ ...transactionData, reference: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="e.g., Bank transfer ref"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTransaction(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
