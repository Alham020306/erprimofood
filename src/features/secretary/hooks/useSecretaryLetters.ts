import { useEffect, useMemo, useState } from "react";
import {
  createLetter,
  subscribeLetters,
  updateLetterStatus,
} from "../services/secretaryGovernanceService";

type Params = {
  user: any;
};

export const useSecretaryLetters = ({ user }: Params) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    letterType: "INTERNAL_MEMO",
    subject: "",
    summary: "",
    classification: "INTERNAL",
    recipient: "",
  });

  useEffect(() => {
    const unsub = subscribeLetters((rows) => {
      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const summary = useMemo(() => {
    return {
      total: items.length,
      draft: items.filter((item) => item.status === "DRAFT").length,
      submitted: items.filter((item) => item.status === "SUBMITTED").length,
      archived: items.filter((item) => item.status === "ARCHIVED").length,
    };
  }, [items]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await createLetter({
        ...form,
        createdBy: user?.uid || "",
        ownerRole: user?.primaryRole || "SECRETARY",
      });

      setForm({
        letterType: "INTERNAL_MEMO",
        subject: "",
        summary: "",
        classification: "INTERNAL",
        recipient: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (status: string) => {
    if (!selectedLetter?.id) return;
    await updateLetterStatus(selectedLetter.id, status, {
      uid: user?.uid || "",
      role: user?.primaryRole || "SECRETARY",
    });
  };

  return {
    items,
    loading,
    selectedLetter,
    setSelectedLetter,
    summary,
    form,
    setForm,
    submitting,
    submit,
    setStatus,
  };
};
