import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

const DEFAULT_COMMISSION_RATES = {
  RESTAURANT: 0.05,
  DRIVER: 0.20,
};

type EntityType = "RESTAURANT" | "DRIVER";
type CommissionStatus = "UNPAID" | "PAID";

interface Order {
  id: string;
  restaurantId?: string;
  restaurantName?: string;
  driverId?: string;
  driverName?: string;
  total: number;
  deliveryFee?: number;
  status: string;
  timestamp?: number;
  createdAt?: any;
  restoCommissionPaid?: boolean;
  driverCommissionPaid?: boolean;
}

interface CommissionRecord {
  id: string;
  orderId: string;
  type: EntityType;
  entityId: string;
  entityName: string;
  amount: number;
  status: CommissionStatus;
  createdAt: number;
  paidAt?: any;
  orderTotal?: number;
  deliveryFee?: number;
  commissionRate: number;
}

interface EntitySummary {
  entityId: string;
  entityName: string;
  commissionRate: number;
  totalUnpaid: number;
  totalPaid: number;
  unpaidCount: number;
  paidCount: number;
  oldestUnpaidDate?: number;
  isBanned: boolean;
  orders: CommissionRecord[];
}

interface SettlementSummary {
  totalUnpaid: number;
  totalPaid: number;
  totalCommission: number;
  restaurantUnpaid: number;
  restaurantPaid: number;
  driverUnpaid: number;
  driverPaid: number;
}

const normalizePercentToRate = (value: unknown, fallback: number) => {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw < 0) return fallback;
  return raw > 1 ? raw / 100 : raw;
};

const timestampToNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const buildCommissionId = (type: EntityType, orderId: string) =>
  `${type.toLowerCase()}_${orderId}`;

export const useCFOSettlementsV2 = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [systemConfig, setSystemConfig] = useState<any | null>(null);
  const [entityType, setEntityType] = useState<EntityType>("RESTAURANT");
  const [selectedEntity, setSelectedEntity] = useState<EntitySummary | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setLoading(true);

    const state = {
      orders: [] as Order[],
      restaurants: [] as any[],
      drivers: [] as any[],
      commissions: [] as CommissionRecord[],
      systemConfig: null as any,
    };

    const emit = () => {
      setOrders([...state.orders]);
      setRestaurants([...state.restaurants]);
      setDrivers([...state.drivers]);
      setCommissions([...state.commissions]);
      setSystemConfig(state.systemConfig);
      setLoading(false);
    };

    const unsubOrders = onSnapshot(
      collection(dbMain, "orders"),
      (snap) => {
        state.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        emit();
      },
      (err) => console.error("orders error:", err)
    );

    const unsubRestaurants = onSnapshot(
      collection(dbMain, "restaurants"),
      (snap) => {
        state.restaurants = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => console.error("restaurants error:", err)
    );

    const unsubUsers = onSnapshot(
      collection(dbMain, "users"),
      (snap) => {
        state.drivers = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((u) => String(u.role || "").toUpperCase() === "DRIVER");
        emit();
      },
      (err) => console.error("users error:", err)
    );

    const unsubCommissions = onSnapshot(
      collection(dbMain, "commissions"),
      (snap) => {
        state.commissions = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as CommissionRecord)
        );
        emit();
      },
      (err) => console.error("commissions error:", err)
    );

    const unsubSystemConfig = onSnapshot(
      doc(dbMain, "system", "config"),
      (snap) => {
        state.systemConfig = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        emit();
      },
      (err) => console.error("system config error:", err)
    );

    return () => {
      unsubOrders();
      unsubRestaurants();
      unsubUsers();
      unsubCommissions();
      unsubSystemConfig();
    };
  }, []);

  const commissionRates = useMemo(
    () => {
      const configSource = systemConfig?.settings || systemConfig || {};

      return {
        RESTAURANT: normalizePercentToRate(
          configSource?.serviceFeePercent,
          DEFAULT_COMMISSION_RATES.RESTAURANT
        ),
        DRIVER: normalizePercentToRate(
          configSource?.driverCommissionPercent,
          DEFAULT_COMMISSION_RATES.DRIVER
        ),
      };
    },
    [systemConfig]
  );

  const resolveEntityCommissionRate = useCallback(
    (entity: any, type: EntityType) => {
      const fallback =
        type === "RESTAURANT" ? commissionRates.RESTAURANT : commissionRates.DRIVER;
      return normalizePercentToRate(entity?.customCommissionPercent, fallback);
    },
    [commissionRates]
  );

  const calculateCommissionAmount = useCallback(
    (order: Order, type: EntityType, rate: number) => {
      if (type === "RESTAURANT") {
        const itemsTotal = Math.max(0, (order.total || 0) - (order.deliveryFee || 0));
        return Math.max(0, Math.round(itemsTotal * rate));
      }

      return Math.max(0, Math.round((order.deliveryFee || 0) * rate));
    },
    []
  );

  useEffect(() => {
    if (!orders.length) return;

    const commissionsById = new Map(commissions.map((item) => [item.id, item]));
    const batch = writeBatch(dbMain);
    let hasWrites = false;

    const writeCommission = (
      type: EntityType,
      order: Order,
      entity: any,
      entityId: string,
      entityName: string,
      paidFlag: boolean
    ) => {
      if (!entityId) return;

      const commissionRate = resolveEntityCommissionRate(entity, type);
      const commissionId = buildCommissionId(type, order.id);
      const existing = commissionsById.get(commissionId);
      const payload: Omit<CommissionRecord, "id"> = {
        orderId: order.id,
        type,
        entityId,
        entityName,
        amount: calculateCommissionAmount(order, type, commissionRate),
        status: paidFlag ? "PAID" : "UNPAID",
        createdAt: timestampToNumber(order.timestamp ?? order.createdAt),
        paidAt: paidFlag ? existing?.paidAt || serverTimestamp() : null,
        orderTotal: Number(order.total || 0),
        deliveryFee: Number(order.deliveryFee || 0),
        commissionRate,
      };

      const changed =
        !existing ||
        existing.entityId !== payload.entityId ||
        existing.entityName !== payload.entityName ||
        Number(existing.amount || 0) !== payload.amount ||
        existing.status !== payload.status ||
        Number(existing.orderTotal || 0) !== payload.orderTotal ||
        Number(existing.deliveryFee || 0) !== payload.deliveryFee ||
        Number(existing.commissionRate || 0) !== payload.commissionRate;

      if (!changed) return;

      batch.set(doc(dbMain, "commissions", commissionId), payload);
      hasWrites = true;
    };

    orders
      .filter((order) => order.status === "COMPLETED")
      .forEach((order) => {
        if (order.restaurantId) {
          const restaurant = restaurants.find((item) => item.id === order.restaurantId);
          writeCommission(
            "RESTAURANT",
            order,
            restaurant,
            order.restaurantId,
            restaurant?.name || order.restaurantName || "Unknown",
            order.restoCommissionPaid === true
          );
        }

        if (order.driverId) {
          const driver = drivers.find((item) => item.id === order.driverId);
          writeCommission(
            "DRIVER",
            order,
            driver,
            order.driverId,
            driver?.name || driver?.fullName || order.driverName || "Unknown",
            order.driverCommissionPaid === true
          );
        }
      });

    if (!hasWrites) return;

    batch.commit().catch((error) => {
      console.error("Failed to sync commission records:", error);
    });
  }, [
    orders,
    restaurants,
    drivers,
    commissions,
    resolveEntityCommissionRate,
    calculateCommissionAmount,
  ]);

  const restaurantSummaries = useMemo((): EntitySummary[] => {
    const map = new Map<string, EntitySummary>();

    restaurants.forEach((restaurant) => {
      map.set(restaurant.id, {
        entityId: restaurant.id,
        entityName: restaurant.name || restaurant.restaurantName || "Unknown",
        commissionRate: resolveEntityCommissionRate(restaurant, "RESTAURANT"),
        totalUnpaid: 0,
        totalPaid: 0,
        unpaidCount: 0,
        paidCount: 0,
        isBanned: restaurant.isBanned || false,
        orders: [],
      });
    });

    commissions
      .filter((record) => record.type === "RESTAURANT")
      .forEach((record) => {
        const existing =
          map.get(record.entityId) ||
          ({
            entityId: record.entityId,
            entityName: record.entityName || "Unknown",
            commissionRate: normalizePercentToRate(
              record.commissionRate,
              commissionRates.RESTAURANT
            ),
            totalUnpaid: 0,
            totalPaid: 0,
            unpaidCount: 0,
            paidCount: 0,
            isBanned: false,
            orders: [],
          } as EntitySummary);

        if (record.status === "PAID") {
          existing.totalPaid += Number(record.amount || 0);
          existing.paidCount += 1;
        } else {
          existing.totalUnpaid += Number(record.amount || 0);
          existing.unpaidCount += 1;
          if (
            !existing.oldestUnpaidDate ||
            Number(record.createdAt || 0) < existing.oldestUnpaidDate
          ) {
            existing.oldestUnpaidDate = Number(record.createdAt || 0);
          }
        }

        existing.orders.push(record);
        map.set(record.entityId, existing);
      });

    return Array.from(map.values()).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  }, [restaurants, commissions, commissionRates.RESTAURANT, resolveEntityCommissionRate]);

  const driverSummaries = useMemo((): EntitySummary[] => {
    const map = new Map<string, EntitySummary>();

    drivers.forEach((driver) => {
      map.set(driver.id, {
        entityId: driver.id,
        entityName: driver.name || driver.fullName || "Unknown",
        commissionRate: resolveEntityCommissionRate(driver, "DRIVER"),
        totalUnpaid: 0,
        totalPaid: 0,
        unpaidCount: 0,
        paidCount: 0,
        isBanned: driver.isBanned || false,
        orders: [],
      });
    });

    commissions
      .filter((record) => record.type === "DRIVER")
      .forEach((record) => {
        const existing =
          map.get(record.entityId) ||
          ({
            entityId: record.entityId,
            entityName: record.entityName || "Unknown",
            commissionRate: normalizePercentToRate(
              record.commissionRate,
              commissionRates.DRIVER
            ),
            totalUnpaid: 0,
            totalPaid: 0,
            unpaidCount: 0,
            paidCount: 0,
            isBanned: false,
            orders: [],
          } as EntitySummary);

        if (record.status === "PAID") {
          existing.totalPaid += Number(record.amount || 0);
          existing.paidCount += 1;
        } else {
          existing.totalUnpaid += Number(record.amount || 0);
          existing.unpaidCount += 1;
          if (
            !existing.oldestUnpaidDate ||
            Number(record.createdAt || 0) < existing.oldestUnpaidDate
          ) {
            existing.oldestUnpaidDate = Number(record.createdAt || 0);
          }
        }

        existing.orders.push(record);
        map.set(record.entityId, existing);
      });

    return Array.from(map.values()).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  }, [drivers, commissions, commissionRates.DRIVER, resolveEntityCommissionRate]);

  const currentList = entityType === "RESTAURANT" ? restaurantSummaries : driverSummaries;

  const summary: SettlementSummary = useMemo(() => {
    const restaurantUnpaid = restaurantSummaries.reduce(
      (sum, item) => sum + item.totalUnpaid,
      0
    );
    const restaurantPaid = restaurantSummaries.reduce(
      (sum, item) => sum + item.totalPaid,
      0
    );
    const driverUnpaid = driverSummaries.reduce(
      (sum, item) => sum + item.totalUnpaid,
      0
    );
    const driverPaid = driverSummaries.reduce(
      (sum, item) => sum + item.totalPaid,
      0
    );

    return {
      totalUnpaid: restaurantUnpaid + driverUnpaid,
      totalPaid: restaurantPaid + driverPaid,
      totalCommission: restaurantUnpaid + driverUnpaid + restaurantPaid + driverPaid,
      restaurantUnpaid,
      restaurantPaid,
      driverUnpaid,
      driverPaid,
    };
  }, [restaurantSummaries, driverSummaries]);

  const markAsPaid = useCallback(
    async (entityId: string, type: EntityType): Promise<boolean> => {
      try {
        setProcessing(true);

        const targetRecords = commissions.filter(
          (record) =>
            record.entityId === entityId &&
            record.type === type &&
            record.status !== "PAID"
        );

        if (!targetRecords.length) return true;

        const batch = writeBatch(dbMain);

        targetRecords.forEach((record) => {
          batch.update(doc(dbMain, "commissions", record.id), {
            status: "PAID",
            paidAt: serverTimestamp(),
          });

          const orderRef = doc(dbMain, "orders", record.orderId);
          if (type === "RESTAURANT") {
            batch.update(orderRef, {
              restoCommissionPaid: true,
              restoCommissionPaidAt: serverTimestamp(),
            });
          } else {
            batch.update(orderRef, {
              driverCommissionPaid: true,
              driverCommissionPaidAt: serverTimestamp(),
            });
          }
        });

        await batch.commit();
        return true;
      } catch (error) {
        console.error("Error marking commission as paid:", error);
        return false;
      } finally {
        setProcessing(false);
      }
    },
    [commissions]
  );

  const unbanEntity = useCallback(async (entityId: string, type: EntityType): Promise<boolean> => {
    try {
      const entityRef = doc(dbMain, type === "RESTAURANT" ? "restaurants" : "users", entityId);
      const batch = writeBatch(dbMain);
      batch.update(entityRef, {
        isBanned: false,
        unbannedAt: serverTimestamp(),
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error unbanning entity:", error);
      return false;
    }
  }, []);

  return {
    loading,
    processing,
    entityType,
    setEntityType,
    currentList,
    selectedEntity,
    setSelectedEntity,
    summary,
    restaurantSummaries,
    driverSummaries,
    orders,
    commissions,
    markAsPaid,
    unbanEntity,
    commissionRates,
  };
};
