import { useMemo, useState } from "react";
import { useCFODashboard } from "./useCFODashboard";

export const useCFOLedger = () => {
  const { dashboard, loading } = useCFODashboard();

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const ledger = useMemo(() => {
    const rows = dashboard?.raw?.operationalLedger || [];

    return rows.filter((row: any) => {
      const rowType = String(row?.type || "").toUpperCase();
      const rowCategory = String(row?.category || "");
      const rowDate = String(row?.date || "");

      const typeOk =
        typeFilter === "ALL" ? true : rowType === typeFilter.toUpperCase();

      const categoryOk =
        categoryFilter === "ALL" ? true : rowCategory === categoryFilter;

      const fromOk = dateFrom ? rowDate >= dateFrom : true;
      const toOk = dateTo ? rowDate <= dateTo : true;

      return typeOk && categoryOk && fromOk && toOk;
    });
  }, [dashboard, typeFilter, categoryFilter, dateFrom, dateTo]);

  const categories = useMemo(() => {
    const rows = dashboard?.raw?.operationalLedger || [];
    return Array.from(
      new Set(rows.map((row: any) => String(row?.category || "Uncategorized")))
    ) as string[];
  }, [dashboard]);

  const summary = useMemo(() => {
    const cashIn = ledger
      .filter((row: any) => String(row?.type || "").toUpperCase() === "IN")
      .reduce((sum: number, row: any) => sum + Number(row?.amount || 0), 0);

    const cashOut = ledger
      .filter((row: any) => String(row?.type || "").toUpperCase() === "OUT")
      .reduce((sum: number, row: any) => sum + Number(row?.amount || 0), 0);

    return {
      total: ledger.length,
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    };
  }, [ledger]);

  return {
    loading,
    ledger,
    categories,
    summary,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedTransaction,
    setSelectedTransaction,
  };
};
