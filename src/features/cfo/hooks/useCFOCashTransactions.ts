import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, where } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const useCFOCashTransactions = (selectedDate?: string) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState({
    cashIn: 0,
    cashOut: 0,
    net: 0
  });
  const [loading, setLoading] = useState(true);

  const targetDate = selectedDate || new Date().toISOString().split("T")[0];

  useEffect(() => {
    const q = query(
      collection(dbCLevel, "cfo_cash_transactions"),
      where("date", "==", targetDate),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setTransactions(data);
      
      // Calculate daily summary
      const summary = data.reduce((acc: any, t: any) => {
        const amount = Number(t.amount || 0);
        if (t.type === "IN") acc.cashIn += amount;
        else acc.cashOut += amount;
        return acc;
      }, { cashIn: 0, cashOut: 0 });
      
      summary.net = summary.cashIn - summary.cashOut;
      setDailySummary(summary);
      setLoading(false);
    }, (error) => {
      console.error("Cash transactions error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [targetDate]);

  const createTransaction = useCallback(async (data: {
    type: "IN" | "OUT";
    category: "OPERATIONAL" | "INVESTMENT" | "FINANCING";
    amount: number;
    description: string;
    reference?: string;
    relatedTo?: {
      type: string;
      id: string;
      name: string;
    };
  }, user: any) => {
    const newTransaction = {
      transactionId: `CT-${targetDate}-${Date.now()}`,
      date: targetDate,
      timestamp: Date.now(),
      ...data,
      currency: "IDR",
      status: "COMPLETED",
      syncedToLedger: false,
      ledgerEntryId: null,
      createdBy: user?.uid,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(dbCLevel, "cfo_cash_transactions"), newTransaction);
    return docRef.id;
  }, [targetDate]);

  return {
    loading,
    transactions,
    dailySummary,
    createTransaction,
    selectedDate: targetDate
  };
};
