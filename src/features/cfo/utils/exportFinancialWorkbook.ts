const currency = (value: number | null | undefined) =>
  Number(value || 0).toLocaleString("id-ID");

const escapeHtml = (value: any) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const renderTable = (title: string, columns: string[], rows: string[][]) => `
  <table border="1" cellspacing="0" cellpadding="6">
    <tr>
      <th colspan="${columns.length}" style="background:#0f172a;color:#fff;font-size:16px;">${escapeHtml(
        title
      )}</th>
    </tr>
    <tr>${columns
      .map(
        (column) =>
          `<th style="background:#e2e8f0;color:#0f172a;">${escapeHtml(column)}</th>`
      )
      .join("")}</tr>
    ${rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}</tr>`
      )
      .join("")}
  </table>
`;

export const exportFinancialWorkbook = (payload: {
  summary: Record<string, any>;
  monthlyStyleSummary: any[];
  categoryBreakdown: any[];
  latestTransactions: any[];
}) => {
  const summaryRows = [
    ["Total Cash In", `Rp ${currency(payload.summary.totalCashIn)}`],
    ["Total Cash Out", `Rp ${currency(payload.summary.totalCashOut)}`],
    ["Net Cashflow", `Rp ${currency(payload.summary.netCashflow)}`],
    ["Restaurant Balance", `Rp ${currency(payload.summary.totalRestaurantBalance)}`],
    ["Driver Balance", `Rp ${currency(payload.summary.totalDriverBalance)}`],
    ["Unpaid Commission", `Rp ${currency(payload.summary.totalUnpaidCommission)}`],
    ["Verified Restaurants", String(payload.summary.verifiedRestaurants || 0)],
    ["Verified Drivers", String(payload.summary.verifiedDrivers || 0)],
    ["Average Transaction", `Rp ${currency(payload.summary.averageTransactionValue)}`],
    ["Total Transactions", String(payload.summary.totalTransactions || 0)],
  ];

  const monthlyRows = payload.monthlyStyleSummary.map((item) => [
    item.period,
    `Rp ${currency(item.cashIn)}`,
    `Rp ${currency(item.cashOut)}`,
    `Rp ${currency(item.net)}`,
  ]);

  const categoryRows = payload.categoryBreakdown.map((item) => [
    item.category,
    `Rp ${currency(item.amount)}`,
  ]);

  const transactionRows = payload.latestTransactions.map((item) => [
    item.title || "-",
    item.date || "-",
    item.type || "-",
    item.category || "-",
    `Rp ${currency(item.amount)}`,
    item.processedBy || "-",
    item.description || "-",
  ]);

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <title>CFO Financial Report</title>
      </head>
      <body>
        <h1 style="font-family:Arial,sans-serif;color:#0f172a;">CFO Automated Financial Report</h1>
        <p style="font-family:Arial,sans-serif;color:#475569;">Generated at ${escapeHtml(
          new Date().toLocaleString("id-ID")
        )}</p>
        ${renderTable("Executive Summary", ["Metric", "Value"], summaryRows)}
        <br/>
        ${renderTable(
          "Monthly Cashflow",
          ["Period", "Cash In", "Cash Out", "Net"],
          monthlyRows
        )}
        <br/>
        ${renderTable("Category Breakdown", ["Category", "Amount"], categoryRows)}
        <br/>
        ${renderTable(
          "Latest Transactions",
          ["Title", "Date", "Type", "Category", "Amount", "Processed By", "Description"],
          transactionRows
        )}
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cfo_financial_report_${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
