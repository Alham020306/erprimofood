import { useState, useCallback, useEffect } from "react";
import { 
  Table, 
  FileSpreadsheet, 
  Plus, 
  Download, 
  Upload, 
  Save,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  Database,
  Cloud,
  CheckCircle,
  AlertCircle,
  Copy,
  FileJson,
  RefreshCw
} from "lucide-react";
import { useCFOSheets, Sheet } from "../hooks/useCFOSheets";
import { formatCurrency, formatNumber } from "../utils/formatters";

const formatDate = (timestamp: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

interface Props {
  user: any;
}

interface SheetData {
  headers: string[];
  rows: any[][];
}

// Template data untuk new sheets
const SHEET_TEMPLATES: Record<string, { headers: string[]; sampleRows: any[][] }> = {
  BLANK: {
    headers: ["Column A", "Column B", "Column C"],
    sampleRows: []
  },
  LEDGER: {
    headers: ["Date", "Type", "Category", "Description", "Amount", "Reference", "Status"],
    sampleRows: [
      ["2026-04-19", "IN", "SALES", "Sample Entry", 0, "REF-001", "COMPLETED"]
    ]
  },
  BUDGET: {
    headers: ["Department", "Category", "Allocated", "Spent", "Remaining", "Owner", "Notes"],
    sampleRows: [
      ["Department", "Category", 0, 0, 0, "Owner", "Notes"]
    ]
  },
  EXPENSE: {
    headers: ["Date", "Expense", "Vendor", "Amount", "Receipt", "Approved By", "Notes"],
    sampleRows: [
      ["2026-04-19", "Expense Name", "Vendor", 0, "", "", ""]
    ]
  },
};

const categoryColors: Record<string, string> = {
  LEDGER: "bg-blue-100 text-blue-700",
  BUDGET: "bg-emerald-100 text-emerald-700",
  FORECAST: "bg-purple-100 text-purple-700",
  EXPENSE: "bg-rose-100 text-rose-700",
  REVENUE: "bg-amber-100 text-amber-700",
  CUSTOM: "bg-slate-100 text-slate-700",
};

// Template presets
const TEMPLATES = [
  { key: "BLANK", label: "Blank Sheet", desc: "Start from scratch" },
  { key: "LEDGER", label: "Ledger Template", desc: "For financial transactions" },
  { key: "BUDGET", label: "Budget Template", desc: "Department budget tracking" },
  { key: "EXPENSE", label: "Expense Template", desc: "Expense reporting" },
];

export default function CFOSheetsPage({ user }: Props) {
  // Firestore hooks
  const { 
    sheets, 
    loading, 
    syncing,
    createSheet, 
    saveSheet, 
    deleteSheet: deleteSheetFromFirestore,
    getSheet
  } = useCFOSheets(user);
  
  // Local state
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isEditing, setIsEditing] = useState(false);
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [newSheetForm, setNewSheetForm] = useState({
    name: "",
    category: "CUSTOM" as Sheet["category"],
    template: "BLANK"
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");

  // Filter sheets
  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || sheet.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Load sheet data from Firestore
  const loadSheet = useCallback((sheet: Sheet) => {
    setSelectedSheet(sheet);
    setSheetData({ 
      headers: sheet.headers || [], 
      rows: sheet.rows || [] 
    });
    setHasUnsavedChanges(false);
    setLastSaved(sheet.lastModified);
    setIsEditing(false);
  }, []);

  // Add new row
  const addRow = useCallback(() => {
    if (!sheetData) return;
    const newRow = new Array(sheetData.headers.length).fill("");
    const newRows = [...sheetData.rows, newRow];
    setSheetData({ ...sheetData, rows: newRows });
    setHasUnsavedChanges(true);
  }, [sheetData]);

  // Delete row
  const deleteRow = useCallback((rowIndex: number) => {
    if (!sheetData) return;
    const newRows = sheetData.rows.filter((_, i) => i !== rowIndex);
    setSheetData({ ...sheetData, rows: newRows });
    setHasUnsavedChanges(true);
  }, [sheetData]);

  // Update cell
  const updateCell = useCallback((rowIndex: number, colIndex: number, value: string) => {
    if (!sheetData) return;
    const newRows = [...sheetData.rows];
    newRows[rowIndex][colIndex] = value;
    setSheetData({ ...sheetData, rows: newRows });
    setHasUnsavedChanges(true);
  }, [sheetData]);

  // Create new sheet and SAVE to Firestore
  const handleCreateSheet = useCallback(async () => {
    const template = SHEET_TEMPLATES[newSheetForm.template];
    
    const newSheet = await createSheet({
      name: newSheetForm.name,
      category: newSheetForm.category,
      headers: template.headers,
    });
    
    // Add sample rows if any
    if (template.sampleRows.length > 0) {
      await saveSheet(newSheet.id, {
        headers: template.headers,
        rows: template.sampleRows,
      });
    }
    
    setShowNewSheetModal(false);
    setNewSheetForm({ name: "", category: "CUSTOM", template: "BLANK" });
    loadSheet(newSheet);
  }, [newSheetForm, createSheet, saveSheet, loadSheet]);

  // SAVE to Firestore
  const handleSaveToFirestore = useCallback(async () => {
    if (!selectedSheet || !sheetData) return;
    
    try {
      await saveSheet(selectedSheet.id, {
        headers: sheetData.headers,
        rows: sheetData.rows,
      });
      
      setHasUnsavedChanges(false);
      setLastSaved(Date.now());
      // alert("Saved to Firestore!"); // Could use toast here
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save. Please try again.");
    }
  }, [selectedSheet, sheetData, saveSheet]);

  // Export to CSV
  const exportCSV = useCallback(() => {
    if (!sheetData || !selectedSheet) return;
    
    const csv = [
      sheetData.headers.join(","),
      ...sheetData.rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSheet.name}.csv`;
    a.click();
  }, [sheetData, selectedSheet]);

  // Export to JSON
  const exportJSON = useCallback(() => {
    if (!selectedSheet || !sheetData) return;
    
    const exportData = {
      name: selectedSheet.name,
      category: selectedSheet.category,
      headers: sheetData.headers,
      rows: sheetData.rows,
      exportDate: new Date().toISOString(),
      exportedBy: user?.fullName || user?.displayName,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSheet.name}.json`;
    a.click();
  }, [selectedSheet, sheetData, user]);

  // Delete sheet from Firestore
  const handleDeleteSheet = useCallback(async (sheetId: string) => {
    if (!confirm("Delete this sheet? This action cannot be undone.")) return;
    
    try {
      await deleteSheetFromFirestore(sheetId);
      if (selectedSheet?.id === sheetId) {
        setSelectedSheet(null);
        setSheetData(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete. Please try again.");
    }
  }, [deleteSheetFromFirestore, selectedSheet]);

  // Import from JSON
  const handleImport = useCallback(async () => {
    try {
      const data = JSON.parse(importData);
      
      const newSheet = await createSheet({
        name: data.name + " (Imported)",
        category: data.category || "CUSTOM",
        headers: data.headers,
      });
      
      if (data.rows && data.rows.length > 0) {
        await saveSheet(newSheet.id, {
          headers: data.headers,
          rows: data.rows,
        });
      }
      
      setShowImportModal(false);
      setImportData("");
      loadSheet(newSheet);
    } catch (error) {
      alert("Invalid JSON format. Please check your data.");
    }
  }, [importData, createSheet, saveSheet, loadSheet]);

  // Duplicate sheet
  const handleDuplicate = useCallback(async (sheet: Sheet) => {
    try {
      const newSheet = await createSheet({
        name: `${sheet.name} (Copy)`,
        category: sheet.category,
        headers: sheet.headers || [],
      });
      
      if (sheet.rows && sheet.rows.length > 0) {
        await saveSheet(newSheet.id, {
          headers: sheet.headers || [],
          rows: JSON.parse(JSON.stringify(sheet.rows)),
        });
      }
      
      loadSheet(newSheet);
    } catch (error) {
      console.error("Duplicate failed:", error);
      alert("Failed to duplicate. Please try again.");
    }
  }, [createSheet, saveSheet, loadSheet]);

  // Auto-save effect (optional - can be enabled)
  useEffect(() => {
    if (!hasUnsavedChanges || !selectedSheet || !sheetData) return;
    
    // Auto-save after 5 seconds of inactivity
    const timeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        handleSaveToFirestore();
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [hasUnsavedChanges, selectedSheet, sheetData, handleSaveToFirestore]);

  if (selectedSheet && sheetData) {
    return (
      <div className="space-y-4">
        {/* Sheet Header */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setSelectedSheet(null); setSheetData(null); }}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">{selectedSheet.name}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs ${categoryColors[selectedSheet.category]}`}>
                  {selectedSheet.category}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Last modified {formatDate(selectedSheet.lastModified)} by {selectedSheet.modifiedBy}
                • {sheetData.rows.length} rows
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sync Status Indicator */}
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                <AlertCircle size={12} />
                Unsaved changes
              </span>
            )}
            {syncing && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                <RefreshCw size={12} className="animate-spin" />
                Syncing...
              </span>
            )}
            {!hasUnsavedChanges && lastSaved && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                <CheckCircle size={12} />
                Saved to Firestore
              </span>
            )}
            
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <Download size={16} />
              Export CSV
            </button>
            
            <button
              onClick={exportJSON}
              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <FileJson size={16} />
              Export JSON
            </button>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Edit Sheet
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToFirestore}
                  disabled={syncing || !hasUnsavedChanges}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Cloud size={16} />
                  {syncing ? "Saving..." : "Save to Firestore"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sheet Data Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {isEditing && <th className="w-10 px-2 py-3"></th>}
                  {sheetData.headers.map((header, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 border-b border-slate-200">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    {isEditing && (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="rounded-lg p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-4 py-2 text-sm text-slate-700">
                        {isEditing ? (
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                          />
                        ) : (
                          // Format numbers as currency if looks like amount
                          /amount|spend|allocated|budget|revenue|expense/i.test(sheetData.headers[colIndex]) && !isNaN(Number(cell))
                            ? formatCurrency(Number(cell))
                            : cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {isEditing && (
            <div className="border-t border-slate-200 p-4">
              <button
                onClick={addRow}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-600"
              >
                <Plus size={16} />
                Add Row
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              CFO Sheets
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Financial Spreadsheets
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Kelola data finansial dalam format spreadsheet
            </p>
          </div>
          <button
            onClick={() => setShowNewSheetModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            New Sheet
          </button>
        </div>
      </section>

      {/* Firestore Status Banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Database size={20} className="mt-0.5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Firestore Integration Active
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              All sheets are automatically saved to Direksi database (cfo_sheets collection). 
              Data is synced in real-time across all CFO sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="LEDGER">Ledger</option>
            <option value="BUDGET">Budget</option>
            <option value="FORECAST">Forecast</option>
            <option value="EXPENSE">Expense</option>
            <option value="REVENUE">Revenue</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <Upload size={16} />
          Import JSON
        </button>
      </div>

      {/* Sheets Grid */}
      {filteredSheets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center">
          <FileSpreadsheet size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No sheets found</p>
          <p className="text-sm text-slate-400">Create a new sheet to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSheets.map((sheet) => (
            <div
              key={sheet.id}
              onClick={() => loadSheet(sheet)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <Table size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{sheet.name}</h3>
                    <p className="text-xs text-slate-500">
                      {sheet.rowCount} rows • {formatDate(sheet.lastModified)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicate(sheet); }}
                    className="rounded-lg p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSheet(sheet.id); }}
                    className="rounded-lg p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs ${categoryColors[sheet.category]}`}>
                    {sheet.category}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                    <Cloud size={10} />
                    Firestore
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  by {sheet.modifiedBy}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Sheet Modal */}
      {showNewSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Create New Sheet</h3>
            <p className="text-sm text-slate-500">Create a spreadsheet for financial data</p>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Sheet Name</label>
                <input
                  type="text"
                  value={newSheetForm.name}
                  onChange={(e) => setNewSheetForm({ ...newSheetForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="e.g., April 2026 Expenses"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={newSheetForm.category}
                  onChange={(e) => setNewSheetForm({ ...newSheetForm, category: e.target.value as Sheet["category"] })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="LEDGER">Ledger</option>
                  <option value="BUDGET">Budget</option>
                  <option value="FORECAST">Forecast</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Template</label>
                <select
                  value={newSheetForm.template}
                  onChange={(e) => setNewSheetForm({ ...newSheetForm, template: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                >
                  <option value="BLANK">Blank</option>
                  <option value="LEDGER">Ledger Template</option>
                  <option value="BUDGET">Budget Template</option>
                  <option value="EXPENSE">Expense Template</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowNewSheetModal(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSheet}
                disabled={!newSheetForm.name || syncing}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {syncing ? "Creating..." : "Create Sheet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Import Sheet from JSON</h3>
            <p className="text-sm text-slate-500">
              Paste JSON data exported from another sheet
            </p>
            
            <div className="mt-4">
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-48 rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                placeholder='{"name": "Sheet Name", "category": "LEDGER", "headers": [...], "rows": [...]}'
              />
            </div>
            
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData || syncing}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {syncing ? "Importing..." : "Import to Firestore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
