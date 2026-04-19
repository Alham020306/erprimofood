export const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (value: number | string | null | undefined) => {
  return new Intl.NumberFormat("id-ID").format(Number(value || 0));
};

export const formatDateTime = (value: number | string | null | undefined) => {
  if (!value) return "-";

  if (typeof value === "number") {
    return new Date(value).toLocaleString("id-ID");
  }

  return String(value);
};

export const formatDateOnly = (value: string | null | undefined) => {
  if (!value) return "-";
  return value;
};