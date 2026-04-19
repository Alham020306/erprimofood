import { useState } from "react";
import { createLedgerTransaction } from "../services/cfoLedgerWriteService";

type Params = {
  user: any;
};

export const useCFOTransactionComposer = ({ user }: Params) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [category, setCategory] = useState("Operasional");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    if (!category.trim()) return;
    if (!amount) return;
    if (!date) return;

    setSubmitting(true);
    try {
      await createLedgerTransaction({
        title: title.trim(),
        type,
        category: category.trim(),
        amount: Number(amount),
        date,
        description: description.trim(),
        processedBy: user?.fullName || user?.primaryRole || "CFO Office",
      });

      setTitle("");
      setType("IN");
      setCategory("Operasional");
      setAmount("");
      setDate("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    type,
    setType,
    category,
    setCategory,
    amount,
    setAmount,
    date,
    setDate,
    description,
    setDescription,
    submitting,
    submit,
  };
};