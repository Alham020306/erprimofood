import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const useDocumentsLibrary = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(dbCLevel, "director_documents"),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocuments(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("useDocumentsLibrary error:", error);
        setDocuments([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return documents;
    return documents.filter(
      (doc) => String(doc?.documentType || "").toUpperCase() === typeFilter.toUpperCase()
    );
  }, [documents, typeFilter]);

  return {
    loading,
    documents: filtered,
    typeFilter,
    setTypeFilter,
  };
};