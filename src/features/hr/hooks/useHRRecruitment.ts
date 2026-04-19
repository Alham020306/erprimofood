import { useMemo, useState } from "react";
import { useHRDashboard } from "./useHRDashboard";

export const useHRRecruitment = () => {
  const { loading, recruitmentRows } = useHRDashboard();
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const summary = useMemo(() => {
    return {
      total: recruitmentRows.length,
      verified: recruitmentRows.filter((r: any) => r.isVerified).length,
      pending: recruitmentRows.filter((r: any) => !r.isVerified).length,
      banned: recruitmentRows.filter((r: any) => r.isBanned).length,
    };
  }, [recruitmentRows]);

  return {
    loading,
    items: recruitmentRows,
    summary,
    selectedCandidate,
    setSelectedCandidate,
  };
};