import { useMemo, useState } from "react";
import { useCOODashboard } from "./useCOODashboard";

export const useCOOOperations = () => {
  const { raw, loading } = useCOODashboard();

  const [merchantQuery, setMerchantQuery] = useState("");
  const [merchantStatus, setMerchantStatus] = useState("ALL");
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);

  const merchants = useMemo(() => {
    const base = raw?.restaurants || [];

    return base
      .filter((merchant: any) =>
        String(merchant?.name || "")
          .toLowerCase()
          .includes(merchantQuery.toLowerCase())
      )
      .filter((merchant: any) => {
        if (merchantStatus === "ALL") return true;
        const isOpen = merchant?.isOpen ?? true;
        return merchantStatus === "OPEN" ? isOpen : !isOpen;
      });
  }, [raw, merchantQuery, merchantStatus]);

  const summary = useMemo(() => {
    const base = raw?.restaurants || [];
    const openCount = base.filter((m: any) => (m?.isOpen ?? true) === true).length;
    const closedCount = base.length - openCount;
    const bannedCount = base.filter((m: any) => m?.isBanned === true).length;

    return {
      total: base.length,
      open: openCount,
      closed: closedCount,
      banned: bannedCount,
    };
  }, [raw]);

  return {
    loading,
    merchants,
    summary,
    merchantQuery,
    setMerchantQuery,
    merchantStatus,
    setMerchantStatus,
    selectedMerchant,
    setSelectedMerchant,
  };
};