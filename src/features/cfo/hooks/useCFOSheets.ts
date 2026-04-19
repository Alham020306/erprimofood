import { useEffect, useState, useCallback } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  deleteDoc,
  where,
  getDocs
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export interface Sheet {
  id: string;
  name: string;
  category: "LEDGER" | "BUDGET" | "FORECAST" | "EXPENSE" | "REVENUE" | "CUSTOM";
  headers: string[];
  rows: any[][];
  lastModified: number;
  modifiedBy: string;
  modifiedByUid: string;
  rowCount: number;
  syncedToFirestore: boolean;
}

export const useCFOSheets = (user: any) => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Subscribe to sheets from Firestore
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "cfo_sheets"),
      orderBy("lastModified", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        syncedToFirestore: true, // Mark as synced since from Firestore
      } as Sheet));
      setSheets(data);
      setLoading(false);
    }, (error) => {
      console.error("Sheets subscription error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create new sheet in Firestore
  const createSheet = useCallback(async (data: {
    name: string;
    category: Sheet["category"];
    headers: string[];
  }) => {
    setSyncing(true);
    try {
      const newSheet = {
        name: data.name,
        category: data.category,
        headers: data.headers,
        rows: [],
        rowCount: 0,
        lastModified: Date.now(),
        modifiedBy: user?.fullName || user?.displayName || "CFO",
        modifiedByUid: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(dbCLevel, "cfo_sheets"), newSheet);
      setSyncing(false);
      return { 
        id: docRef.id, 
        ...newSheet,
        syncedToFirestore: true 
      } as Sheet;
    } catch (error) {
      console.error("Create sheet error:", error);
      setSyncing(false);
      throw error;
    }
  }, [user]);

  // Save sheet data to Firestore
  const saveSheet = useCallback(async (sheetId: string, data: {
    headers: string[];
    rows: any[][];
    name?: string;
    category?: Sheet["category"];
  }) => {
    setSyncing(true);
    try {
      const sheetRef = doc(dbCLevel, "cfo_sheets", sheetId);
      
      const updateData: any = {
        headers: data.headers,
        rows: data.rows,
        rowCount: data.rows.length,
        lastModified: Date.now(),
        modifiedBy: user?.fullName || user?.displayName || "CFO",
        modifiedByUid: user?.uid,
        updatedAt: serverTimestamp(),
      };

      if (data.name) updateData.name = data.name;
      if (data.category) updateData.category = data.category;

      await updateDoc(sheetRef, updateData);
      setSyncing(false);
      return true;
    } catch (error) {
      console.error("Save sheet error:", error);
      setSyncing(false);
      throw error;
    }
  }, [user]);

  // Delete sheet from Firestore
  const deleteSheet = useCallback(async (sheetId: string) => {
    try {
      await deleteDoc(doc(dbCLevel, "cfo_sheets", sheetId));
      return true;
    } catch (error) {
      console.error("Delete sheet error:", error);
      throw error;
    }
  }, []);

  // Search sheets
  const searchSheets = useCallback(async (searchTerm: string, categoryFilter?: string) => {
    // Since Firestore doesn't support full-text search,
    // we'll filter client-side for now
    return sheets.filter(sheet => {
      const matchesSearch = sheet.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || categoryFilter === "ALL" || sheet.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [sheets]);

  // Get single sheet
  const getSheet = useCallback((sheetId: string) => {
    return sheets.find(s => s.id === sheetId);
  }, [sheets]);

  // Duplicate sheet
  const duplicateSheet = useCallback(async (sheetId: string) => {
    const original = sheets.find(s => s.id === sheetId);
    if (!original) throw new Error("Sheet not found");

    const newSheet = await createSheet({
      name: `${original.name} (Copy)`,
      category: original.category,
      headers: [...original.headers],
    });

    // Copy rows
    if (original.rows.length > 0) {
      await saveSheet(newSheet.id, {
        headers: newSheet.headers,
        rows: JSON.parse(JSON.stringify(original.rows)), // Deep copy
      });
    }

    return newSheet;
  }, [sheets, createSheet, saveSheet]);

  // Export sheet to JSON
  const exportSheetToJSON = useCallback((sheetId: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (!sheet) return null;

    return {
      ...sheet,
      exportDate: new Date().toISOString(),
      exportedBy: user?.fullName || user?.displayName,
    };
  }, [sheets, user]);

  // Import sheet from JSON
  const importSheetFromJSON = useCallback(async (jsonData: any) => {
    if (!jsonData.name || !jsonData.headers) {
      throw new Error("Invalid sheet data");
    }

    const newSheet = await createSheet({
      name: jsonData.name + " (Imported)",
      category: jsonData.category || "CUSTOM",
      headers: jsonData.headers,
    });

    if (jsonData.rows && jsonData.rows.length > 0) {
      await saveSheet(newSheet.id, {
        headers: newSheet.headers,
        rows: jsonData.rows,
      });
    }

    return newSheet;
  }, [createSheet, saveSheet]);

  // Get sheet statistics
  const getSheetStats = useCallback(() => {
    return {
      total: sheets.length,
      byCategory: sheets.reduce((acc, sheet) => {
        acc[sheet.category] = (acc[sheet.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
    };
  }, [sheets]);

  return {
    loading,
    syncing,
    sheets,
    createSheet,
    saveSheet,
    deleteSheet,
    searchSheets,
    getSheet,
    duplicateSheet,
    exportSheetToJSON,
    importSheetFromJSON,
    getSheetStats,
  };
};

// Hook untuk sheet data dengan real-time updates
export const useCFOSheetData = (sheetId: string | null) => {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sheetId) {
      setSheet(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(dbCLevel, "cfo_sheets", sheetId),
      (snap) => {
        if (snap.exists()) {
          setSheet({
            id: snap.id,
            ...snap.data(),
          } as Sheet);
        } else {
          setSheet(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Sheet data error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sheetId]);

  // Auto-save functionality (debounced)
  const autoSave = useCallback(async (headers: string[], rows: any[][], user: any) => {
    if (!sheetId || !sheet) return;
    
    setSaving(true);
    try {
      const sheetRef = doc(dbCLevel, "cfo_sheets", sheetId);
      await updateDoc(sheetRef, {
        headers,
        rows,
        rowCount: rows.length,
        lastModified: Date.now(),
        modifiedBy: user?.fullName || user?.displayName || "CFO",
        modifiedByUid: user?.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Auto-save error:", error);
    } finally {
      setSaving(false);
    }
  }, [sheetId, sheet]);

  return {
    sheet,
    loading,
    saving,
    autoSave,
  };
};
