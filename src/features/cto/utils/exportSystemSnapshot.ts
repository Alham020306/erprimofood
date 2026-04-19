const sanitize = (value: any) =>
  JSON.parse(
    JSON.stringify(value, (_key, inner) => {
      if (inner instanceof Date) return inner.toISOString();
      return inner;
    })
  );

export const exportSystemSnapshot = (payload: {
  generatedAt: string;
  systemHealth: string;
  directorHealth: string;
  network: Record<string, unknown>;
  raw: Record<string, unknown>;
}) => {
  const safePayload = sanitize(payload);
  const blob = new Blob([JSON.stringify(safePayload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cto_system_snapshot_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
