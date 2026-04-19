export const isMerchantOperational = (
  merchant: any,
  ignoreManualStatus = false
): boolean => {
  if (!merchant) return false;

  if (!ignoreManualStatus && merchant.isOpen === false) return false;

  if (merchant.isBanned === true) return false;

  if (merchant.schedule?.enabled) {
    const openTime = String(merchant.schedule?.openTime || "");
    const closeTime = String(merchant.schedule?.closeTime || "");

    if (!openTime || !closeTime) {
      return ignoreManualStatus ? true : merchant.isOpen !== false;
    }

    if (merchant.closingDelayed === true) return true;

    const now = new Date();
    const currentHHmm = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    if (openTime < closeTime) {
      return currentHHmm >= openTime && currentHHmm < closeTime;
    }

    return currentHHmm >= openTime || currentHHmm < closeTime;
  }

  return merchant.isOpen !== false;
};

export const getMerchantOperationalMessage = (merchant: any) => {
  if (!merchant) return "Tutup";

  const scheduleOpen = isMerchantOperational(merchant, true);

  if (merchant.isBanned === true) return "Suspended";
  if (merchant.isOpen === false && !scheduleOpen) return "Lagi Tutup";
  if (merchant.isOpen === false && scheduleOpen) return "Tutup (Manual)";

  if (merchant.schedule?.enabled) {
    const currentlyOpen = isMerchantOperational(merchant);
    if (currentlyOpen) return "Buka";
    if (merchant.closingDelayed) return "Hampir Tutup";
    return `Tutup (Buka jam ${merchant.schedule?.openTime || "-"})`;
  }

  return merchant.isOpen === false ? "Tutup" : "Buka";
};
