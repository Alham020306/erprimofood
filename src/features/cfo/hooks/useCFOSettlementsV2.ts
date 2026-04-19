import { useEffect, useMemo, useState, useCallback } from "react";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, where, getDocs, writeBatch } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

// Commission rates configuration
const COMMISSION_RATES = {
  RESTAURANT: 0.20, // 20% dari restaurant
  DRIVER: 0.15,     // 15% dari driver
};

type EntityType = "RESTAURANT" | "DRIVER";

interface Order {
  id: string;
  restaurantId?: string;
  driverId?: string;
  total: number;
  deliveryFee?: number;
  status: string;
  timestamp?: number;
  createdAt?: any;
  restoCommissionPaid?: boolean;
  driverCommissionPaid?: boolean;
  restoEarnings?: number;
  driverEarnings?: number;
}

interface EntitySummary {
  entityId: string;
  entityName: string;
  totalUnpaid: number;
  totalPaid: number;
  unpaidCount: number;
  paidCount: number;
  oldestUnpaidDate?: number;
  isBanned: boolean;
  orders: Order[];
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

export const useCFOSettlementsV2 = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [entityType, setEntityType] = useState<EntityType>("RESTAURANT");
  const [selectedEntity, setSelectedEntity] = useState<EntitySummary | null>(null);
  const [processing, setProcessing] = useState(false);

  // Subscribe to data
  useEffect(() => {
    setLoading(true);

    const state = {
      orders: [] as Order[],
      restaurants: [] as any[],
      drivers: [] as any[],
    };

    const emit = () => {
      setOrders([...state.orders]);
      setRestaurants([...state.restaurants]);
      setDrivers([...state.drivers]);
      setLoading(false);
    };

    // Subscribe orders
    const unsubOrders = onSnapshot(
      collection(dbMain, "orders"),
      (snap) => {
        state.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        emit();
      },
      (err) => console.error("orders error:", err)
    );

    // Subscribe restaurants
    const unsubRestaurants = onSnapshot(
      collection(dbMain, "restaurants"),
      (snap) => {
        state.restaurants = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => console.error("restaurants error:", err)
    );

    // Subscribe users (drivers)
    const unsubUsers = onSnapshot(
      collection(dbMain, "users"),
      (snap) => {
        state.drivers = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => String(u.role || "").toUpperCase() === "DRIVER");
        emit();
      },
      (err) => console.error("users error:", err)
    );

    return () => {
      unsubOrders();
      unsubRestaurants();
      unsubUsers();
    };
  }, []);

  // Calculate commission for an order
  const calculateCommission = useCallback((order: Order, type: EntityType): number => {
    if (type === "RESTAURANT") {
      const itemsTotal = (order.total || 0) - (order.deliveryFee || 0);
      const restoEarnings = order.restoEarnings || itemsTotal * (1 - COMMISSION_RATES.RESTAURANT);
      const commission = itemsTotal - restoEarnings;
      return Math.max(0, commission);
    } else {
      const driverEarnings = order.driverEarnings || (order.deliveryFee || 0) * (1 - COMMISSION_RATES.DRIVER);
      const commission = (order.deliveryFee || 0) - driverEarnings;
      return Math.max(0, commission);
    }
  }, []);

  // Build entity summaries
  const restaurantSummaries = useMemo((): EntitySummary[] => {
    const map = new Map<string, EntitySummary>();

    // Initialize with all restaurants
    restaurants.forEach((r) => {
      map.set(r.id, {
        entityId: r.id,
        entityName: r.name || r.restaurantName || "Unknown",
        totalUnpaid: 0,
        totalPaid: Number(r.totalPaidCommission || 0),
        unpaidCount: 0,
        paidCount: 0,
        isBanned: r.isBanned || false,
        orders: [],
      });
    });

    // Process orders
    orders
      .filter((o) => o.status === "COMPLETED" && o.restaurantId)
      .forEach((order) => {
        const summary = map.get(order.restaurantId!);
        if (!summary) return;

        const commission = calculateCommission(order, "RESTAURANT");
        const isPaid = order.restoCommissionPaid === true;

        if (isPaid) {
          summary.totalPaid += commission;
          summary.paidCount++;
        } else {
          summary.totalUnpaid += commission;
          summary.unpaidCount++;
          if (!summary.oldestUnpaidDate || (order.timestamp && order.timestamp < summary.oldestUnpaidDate)) {
            summary.oldestUnpaidDate = order.timestamp;
          }
        }

        summary.orders.push(order);
      });

    return Array.from(map.values()).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  }, [orders, restaurants, calculateCommission]);

  const driverSummaries = useMemo((): EntitySummary[] => {
    const map = new Map<string, EntitySummary>();

    // Initialize with all drivers
    drivers.forEach((d) => {
      map.set(d.id, {
        entityId: d.id,
        entityName: d.name || d.fullName || "Unknown",
        totalUnpaid: 0,
        totalPaid: Number(d.totalPaidCommission || 0),
        unpaidCount: 0,
        paidCount: 0,
        isBanned: d.isBanned || false,
        orders: [],
      });
    });

    // Process orders
    orders
      .filter((o) => o.status === "COMPLETED" && o.driverId)
      .forEach((order) => {
        const summary = map.get(order.driverId!);
        if (!summary) return;

        const commission = calculateCommission(order, "DRIVER");
        const isPaid = order.driverCommissionPaid === true;

        if (isPaid) {
          summary.totalPaid += commission;
          summary.paidCount++;
        } else {
          summary.totalUnpaid += commission;
          summary.unpaidCount++;
          if (!summary.oldestUnpaidDate || (order.timestamp && order.timestamp < summary.oldestUnpaidDate)) {
            summary.oldestUnpaidDate = order.timestamp;
          }
        }

        summary.orders.push(order);
      });

    return Array.from(map.values()).sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  }, [orders, drivers, calculateCommission]);

  const currentList = entityType === "RESTAURANT" ? restaurantSummaries : driverSummaries;

  const summary: SettlementSummary = useMemo(() => {
    const restaurantUnpaid = restaurantSummaries.reduce((sum, s) => sum + s.totalUnpaid, 0);
    const restaurantPaid = restaurantSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
    const driverUnpaid = driverSummaries.reduce((sum, s) => sum + s.totalUnpaid, 0);
    const driverPaid = driverSummaries.reduce((sum, s) => sum + s.totalPaid, 0);

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

  // Mark entity as paid - marks all unpaid orders as paid
  const markAsPaid = useCallback(async (entityId: string, type: EntityType): Promise<boolean> => {
    try {
      setProcessing(true);

      const entityOrders = orders.filter((o) => {
        if (type === "RESTAURANT") return o.restaurantId === entityId && o.status === "COMPLETED";
        return o.driverId === entityId && o.status === "COMPLETED";
      });

      const unpaidOrders = entityOrders.filter((o) => {
        if (type === "RESTAURANT") return !o.restoCommissionPaid;
        return !o.driverCommissionPaid;
      });

      if (unpaidOrders.length === 0) {
        console.log("No unpaid orders found");
        return true;
      }

      // Use batch write for atomic updates
      const batch = writeBatch(dbMain);

      unpaidOrders.forEach((order) => {
        const orderRef = doc(dbMain, "orders", order.id);
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
      console.log(`Marked ${unpaidOrders.length} orders as paid for ${type} ${entityId}`);

      return true;
    } catch (error) {
      console.error("Error marking as paid:", error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [orders]);

  // Unban entity
  const unbanEntity = useCallback(async (entityId: string, type: EntityType): Promise<boolean> => {
    try {
      const collectionName = type === "RESTAURANT" ? "restaurants" : "users";
      const entityRef = doc(dbMain, collectionName, entityId);
      await updateDoc(entityRef, {
        isBanned: false,
        unbannedAt: serverTimestamp(),
      });
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
    markAsPaid,
    unbanEntity,
    commissionRates: COMMISSION_RATES,
  };
};
