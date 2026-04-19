export const exportLedgerCsv = (rows: any[]) => {
  const header = [
    "Title",
    "Date",
    "Type",
    "Category",
    "Amount",
    "Processed By",
    "Description",
    "Timestamp",
  ];

  const lines = rows.map((row) => [
    JSON.stringify(row?.title ?? ""),
    JSON.stringify(row?.date ?? ""),
    JSON.stringify(row?.type ?? ""),
    JSON.stringify(row?.category ?? ""),
    JSON.stringify(row?.amount ?? 0),
    JSON.stringify(row?.processedBy ?? ""),
    JSON.stringify(row?.description ?? ""),
    JSON.stringify(row?.timestamp ?? ""),
  ]);

  const csv = [header, ...lines].map((line) => line.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `cfo_ledger_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};