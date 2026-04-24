import { useEffect, useState, useMemo } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";

const DEFAULT_COMMISSION_RATES = {
  RESTAURANT: 0.05,
  DRIVER: 0.20,
  PLATFORM_FEE: 0.05,
};

// Source labels in HURUF BESAR
const CASH_IN_SOURCES = {
  ORDER_COMMISSION: "KOMISI ORDER",
  RESTAURANT_FEE: "BIAYA RESTAURANT",
  DRIVER_FEE: "BIAYA DRIVER",
  INVESTOR_FUNDING: "DANA INVESTOR",
  LOAN_PROCEEDS: "PINJAMAN",
  ASSET_SALE: "PENJUALAN ASET",
  SERVICE_REVENUE: "PENDAPATAN LAYANAN",
  OTHER_INCOME: "PENDAPATAN LAIN",
  MANUAL_ADJUSTMENT: "ADJUSTMENT MANUAL",
};

const CASH_OUT_SOURCES = {
  DRIVER_PAYMENT: "PEMBAYARAN DRIVER",
  RESTAURANT_SETTLEMENT: "SETTLEMENT RESTAURANT",
  SALARY_PAYMENT: "GAJI KARYAWAN",
  OPERATIONAL_EXPENSE: "BIAYA OPERASIONAL",
  MARKETING_EXPENSE: "BIAYA MARKETING",
  TECHNOLOGY_EXPENSE: "BIAYA TEKNOLOGI",
  OFFICE_EXPENSE: "BIAYA KANTOR",
  TAX_PAYMENT: "PEMBAYARAN PAJAK",
  LOAN_REPAYMENT: "PEMBAYARAN PINJAMAN",
  INVESTOR_DIVIDEND: "DIVIDEN INVESTOR",
  EQUIPMENT_PURCHASE: "PEMBELIAN PERALATAN",
  OTHER_EXPENSE: "PENGELUARAN LAIN",
  MANUAL_ADJUSTMENT: "ADJUSTMENT MANUAL",
};

export const useCFOProfitCalculator = (dateFilter?: string) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [manualTx, setManualTx] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any | null>(null);

  const today = dateFilter || new Date().toISOString().split('T')[0];

  // Subscribe orders
  useEffect(() => {
    const q = query(collection(dbMain, "orders"), where("status", "==", "COMPLETED"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = dateFilter 
        ? data.filter((o: any) => {
            const date = o.createdAt?.toDate?.() || new Date(o.createdAt);
            return date.toISOString().split('T')[0] === dateFilter;
          })
        : data;
      setOrders(filtered);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [dateFilter, today]);

  useEffect(() => {
    const unsub = onSnapshot(doc(dbMain, "system", "config"), (snap) => {
      setSystemConfig(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return unsub;
  }, []);

  // Subscribe operational ledger
  useEffect(() => {
    const q = query(collection(dbMain, "operational_ledger"), where("date", "==", today));
    const unsub = onSnapshot(q, (snap) => {
      setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [today]);

  // Subscribe manual CFO transactions
  useEffect(() => {
    const q = query(collection(dbCLevel, "cfo_cash_transactions"), where("date", "==", today));
    const unsub = onSnapshot(q, (snap) => {
      setManualTx(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [today]);

  // Calculate profits
  const calculation = useMemo(() => {
    const configSource = systemConfig?.settings || systemConfig || {};
    const merchantRate =
      Number(configSource?.serviceFeePercent ?? DEFAULT_COMMISSION_RATES.RESTAURANT * 100) / 100;
    const driverRate =
      Number(configSource?.driverCommissionPercent ?? DEFAULT_COMMISSION_RATES.DRIVER * 100) / 100;
    const commissionRates = {
      RESTAURANT:
        Number.isFinite(merchantRate) && merchantRate >= 0
          ? merchantRate
          : DEFAULT_COMMISSION_RATES.RESTAURANT,
      DRIVER:
        Number.isFinite(driverRate) && driverRate >= 0
          ? driverRate
          : DEFAULT_COMMISSION_RATES.DRIVER,
      PLATFORM_FEE: DEFAULT_COMMISSION_RATES.PLATFORM_FEE,
    };

    // Order profits
    const orderData = orders.map(o => {
      const total = o.total || 0;
      return {
        orderId: o.id,
        restaurant: o.restaurantName || o.restaurant?.name || "UNKNOWN",
        total,
        platformFee: total * commissionRates.PLATFORM_FEE,
        driverFee: total * commissionRates.DRIVER,
        restaurantFee: total * commissionRates.RESTAURANT,
      };
    });

    const fromOrders = {
      platformFee: orderData.reduce((s, o) => s + o.platformFee, 0),
      driverFee: orderData.reduce((s, o) => s + o.driverFee, 0),
      restaurantFee: orderData.reduce((s, o) => s + o.restaurantFee, 0),
      grossRevenue: orderData.reduce((s, o) => s + o.total, 0),
    };

    // Categorize entries
    const categorize = (entries: any[]) => {
      return entries.reduce((acc, e) => {
        const cat = e.category || "OTHER";
        const type = e.type || "IN";
        const amt = e.amount || 0;
        let src = "OTHER";

        if (type === "IN") {
          if (cat.includes("INVESTOR") || e.title?.includes("INVESTOR")) src = CASH_IN_SOURCES.INVESTOR_FUNDING;
          else if (cat.includes("ORDER") || cat.includes("SALE")) src = CASH_IN_SOURCES.ORDER_COMMISSION;
          else if (cat.includes("LOAN")) src = CASH_IN_SOURCES.LOAN_PROCEEDS;
          else if (cat.includes("ASSET")) src = CASH_IN_SOURCES.ASSET_SALE;
          else if (cat.includes("SERVICE")) src = CASH_IN_SOURCES.SERVICE_REVENUE;
          else if (e.processedBy?.includes("CFO") || e.source === "MANUAL") src = CASH_IN_SOURCES.MANUAL_ADJUSTMENT;
          else src = CASH_IN_SOURCES.OTHER_INCOME;
        } else {
          if (cat.includes("DRIVER")) src = CASH_OUT_SOURCES.DRIVER_PAYMENT;
          else if (cat.includes("RESTAURANT") || cat.includes("MERCHANT")) src = CASH_OUT_SOURCES.RESTAURANT_SETTLEMENT;
          else if (cat.includes("SALARY") || cat.includes("GAJI")) src = CASH_OUT_SOURCES.SALARY_PAYMENT;
          else if (cat.includes("MARKETING") || cat.includes("ADS")) src = CASH_OUT_SOURCES.MARKETING_EXPENSE;
          else if (cat.includes("TECH")) src = CASH_OUT_SOURCES.TECHNOLOGY_EXPENSE;
          else if (cat.includes("OFFICE")) src = CASH_OUT_SOURCES.OFFICE_EXPENSE;
          else if (cat.includes("TAX") || cat.includes("PAJAK")) src = CASH_OUT_SOURCES.TAX_PAYMENT;
          else if (cat.includes("LOAN")) src = CASH_OUT_SOURCES.LOAN_REPAYMENT;
          else if (cat.includes("INVESTOR") || cat.includes("DIVIDEN")) src = CASH_OUT_SOURCES.INVESTOR_DIVIDEND;
          else if (cat.includes("EQUIPMENT")) src = CASH_OUT_SOURCES.EQUIPMENT_PURCHASE;
          else if (e.processedBy?.includes("CFO") || e.source === "MANUAL") src = CASH_OUT_SOURCES.MANUAL_ADJUSTMENT;
          else src = CASH_OUT_SOURCES.OPERATIONAL_EXPENSE;
        }

        if (!acc[src]) acc[src] = { amount: 0, count: 0 };
        acc[src].amount += amt;
        acc[src].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);
    };

    const opCats = categorize(ledger);
    const manCats = categorize(manualTx);

    // Calculate cash in by source
    const cashInSources = {
      [CASH_IN_SOURCES.ORDER_COMMISSION]: (opCats[CASH_IN_SOURCES.ORDER_COMMISSION]?.amount || 0) + (manCats[CASH_IN_SOURCES.ORDER_COMMISSION]?.amount || 0) + fromOrders.platformFee,
      [CASH_IN_SOURCES.RESTAURANT_FEE]: (opCats[CASH_IN_SOURCES.RESTAURANT_FEE]?.amount || 0) + (manCats[CASH_IN_SOURCES.RESTAURANT_FEE]?.amount || 0) + fromOrders.restaurantFee,
      [CASH_IN_SOURCES.DRIVER_FEE]: (opCats[CASH_IN_SOURCES.DRIVER_FEE]?.amount || 0) + (manCats[CASH_IN_SOURCES.DRIVER_FEE]?.amount || 0) + fromOrders.driverFee,
      [CASH_IN_SOURCES.INVESTOR_FUNDING]: (opCats[CASH_IN_SOURCES.INVESTOR_FUNDING]?.amount || 0) + (manCats[CASH_IN_SOURCES.INVESTOR_FUNDING]?.amount || 0),
      [CASH_IN_SOURCES.LOAN_PROCEEDS]: (opCats[CASH_IN_SOURCES.LOAN_PROCEEDS]?.amount || 0) + (manCats[CASH_IN_SOURCES.LOAN_PROCEEDS]?.amount || 0),
      [CASH_IN_SOURCES.ASSET_SALE]: (opCats[CASH_IN_SOURCES.ASSET_SALE]?.amount || 0) + (manCats[CASH_IN_SOURCES.ASSET_SALE]?.amount || 0),
      [CASH_IN_SOURCES.SERVICE_REVENUE]: (opCats[CASH_IN_SOURCES.SERVICE_REVENUE]?.amount || 0) + (manCats[CASH_IN_SOURCES.SERVICE_REVENUE]?.amount || 0),
      [CASH_IN_SOURCES.OTHER_INCOME]: (opCats[CASH_IN_SOURCES.OTHER_INCOME]?.amount || 0) + (manCats[CASH_IN_SOURCES.OTHER_INCOME]?.amount || 0),
      [CASH_IN_SOURCES.MANUAL_ADJUSTMENT]: (opCats[CASH_IN_SOURCES.MANUAL_ADJUSTMENT]?.amount || 0) + (manCats[CASH_IN_SOURCES.MANUAL_ADJUSTMENT]?.amount || 0),
    };

    // Calculate cash out by source
    const cashOutSources = {
      [CASH_OUT_SOURCES.DRIVER_PAYMENT]: (opCats[CASH_OUT_SOURCES.DRIVER_PAYMENT]?.amount || 0) + (manCats[CASH_OUT_SOURCES.DRIVER_PAYMENT]?.amount || 0),
      [CASH_OUT_SOURCES.RESTAURANT_SETTLEMENT]: (opCats[CASH_OUT_SOURCES.RESTAURANT_SETTLEMENT]?.amount || 0) + (manCats[CASH_OUT_SOURCES.RESTAURANT_SETTLEMENT]?.amount || 0),
      [CASH_OUT_SOURCES.SALARY_PAYMENT]: (opCats[CASH_OUT_SOURCES.SALARY_PAYMENT]?.amount || 0) + (manCats[CASH_OUT_SOURCES.SALARY_PAYMENT]?.amount || 0),
      [CASH_OUT_SOURCES.OPERATIONAL_EXPENSE]: (opCats[CASH_OUT_SOURCES.OPERATIONAL_EXPENSE]?.amount || 0) + (manCats[CASH_OUT_SOURCES.OPERATIONAL_EXPENSE]?.amount || 0),
      [CASH_OUT_SOURCES.MARKETING_EXPENSE]: (opCats[CASH_OUT_SOURCES.MARKETING_EXPENSE]?.amount || 0) + (manCats[CASH_OUT_SOURCES.MARKETING_EXPENSE]?.amount || 0),
      [CASH_OUT_SOURCES.TECHNOLOGY_EXPENSE]: (opCats[CASH_OUT_SOURCES.TECHNOLOGY_EXPENSE]?.amount || 0) + (manCats[CASH_OUT_SOURCES.TECHNOLOGY_EXPENSE]?.amount || 0),
      [CASH_OUT_SOURCES.OFFICE_EXPENSE]: (opCats[CASH_OUT_SOURCES.OFFICE_EXPENSE]?.amount || 0) + (manCats[CASH_OUT_SOURCES.OFFICE_EXPENSE]?.amount || 0),
      [CASH_OUT_SOURCES.TAX_PAYMENT]: (opCats[CASH_OUT_SOURCES.TAX_PAYMENT]?.amount || 0) + (manCats[CASH_OUT_SOURCES.TAX_PAYMENT]?.amount || 0),
      [CASH_OUT_SOURCES.LOAN_REPAYMENT]: (opCats[CASH_OUT_SOURCES.LOAN_REPAYMENT]?.amount || 0) + (manCats[CASH_OUT_SOURCES.LOAN_REPAYMENT]?.amount || 0),
      [CASH_OUT_SOURCES.INVESTOR_DIVIDEND]: (opCats[CASH_OUT_SOURCES.INVESTOR_DIVIDEND]?.amount || 0) + (manCats[CASH_OUT_SOURCES.INVESTOR_DIVIDEND]?.amount || 0),
      [CASH_OUT_SOURCES.EQUIPMENT_PURCHASE]: (opCats[CASH_OUT_SOURCES.EQUIPMENT_PURCHASE]?.amount || 0) + (manCats[CASH_OUT_SOURCES.EQUIPMENT_PURCHASE]?.amount || 0),
      [CASH_OUT_SOURCES.OTHER_EXPENSE]: (opCats[CASH_OUT_SOURCES.OTHER_EXPENSE]?.amount || 0) + (manCats[CASH_OUT_SOURCES.OTHER_EXPENSE]?.amount || 0),
      [CASH_OUT_SOURCES.MANUAL_ADJUSTMENT]: (opCats[CASH_OUT_SOURCES.MANUAL_ADJUSTMENT]?.amount || 0) + (manCats[CASH_OUT_SOURCES.MANUAL_ADJUSTMENT]?.amount || 0),
    };

    const totalCashIn = Object.values(cashInSources).reduce((a, b) => a + b, 0);
    const totalCashOut = Object.values(cashOutSources).reduce((a, b) => a + b, 0);
    const netProfit = totalCashIn - totalCashOut;

    return {
      loading,
      today,
      orders: orderData,
      orderCount: orders.length,
      commissionRates,
      cashIn: {
        total: totalCashIn,
        bySource: cashInSources,
      },
      cashOut: {
        total: totalCashOut,
        bySource: cashOutSources,
      },
      profit: {
        gross: totalCashIn,
        net: netProfit,
        margin: totalCashIn > 0 ? (netProfit / totalCashIn) * 100 : 0,
      },
      operationalCount: ledger.length,
      manualCount: manualTx.length,
    };
  }, [orders, ledger, manualTx, loading, today, systemConfig]);

  return calculation;
};
