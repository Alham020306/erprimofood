const isManualOpen = (merchant: any) => merchant?.isOpen === true;

const getCurrentHHmm = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

const isWithinSchedule = (merchant: any) => {
  const openTime = String(merchant?.schedule?.openTime || "");
  const closeTime = String(merchant?.schedule?.closeTime || "");

  if (!openTime || !closeTime) return false;

  const currentHHmm = getCurrentHHmm();

  if (openTime < closeTime) {
    return currentHHmm >= openTime && currentHHmm < closeTime;
  }

  return currentHHmm >= openTime || currentHHmm < closeTime;
};

export const isMerchantOperational = (
  merchant: any,
  ignoreManualStatus = false
): boolean => {
  if (!merchant) return false;
  if (merchant.isBanned === true) return false;

  const manualOpen = isManualOpen(merchant);
  if (!ignoreManualStatus && !manualOpen) return false;

  if (merchant.closingDelayed === true) {
    return ignoreManualStatus ? manualOpen : manualOpen;
  }

  if (merchant.schedule?.enabled) {
    return isWithinSchedule(merchant) && (ignoreManualStatus ? true : manualOpen);
  }

  return ignoreManualStatus ? manualOpen : manualOpen;
};

export const getMerchantOperationalMessage = (merchant: any) => {
  if (!merchant) return "Tutup";

  const scheduleOpen = isMerchantOperational(merchant, true);
  const manualOpen = isManualOpen(merchant);

  if (merchant.isBanned === true) return "Suspended";
  if (!manualOpen && !scheduleOpen) return "Lagi Tutup";
  if (!manualOpen && scheduleOpen) return "Tutup (Manual)";

  if (merchant.schedule?.enabled) {
    const currentlyOpen = isMerchantOperational(merchant);
    if (currentlyOpen) return "Buka";
    if (merchant.closingDelayed) return "Hampir Tutup";
    return `Tutup (Buka jam ${merchant.schedule?.openTime || "-"})`;
  }

  return manualOpen ? "Buka" : "Tutup";
};
