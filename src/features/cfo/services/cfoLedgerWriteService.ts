import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

type CreateLedgerTransactionParams = {
  title: string;
  type: "IN" | "OUT";
  category: string;
  amount: number;
  date: string;
  description?: string;
  processedBy: string;
};

export const createLedgerTransaction = async ({
  title,
  type,
  category,
  amount,
  date,
  description = "",
  processedBy,
}: CreateLedgerTransactionParams) => {
  const now = Date.now();

  await addDoc(collection(dbMain, "operational_ledger"), {
    title,
    type,
    category,
    amount,
    date,
    description,
    processedBy,
    timestamp: now,
    createdAtServer: serverTimestamp(),
  });
};