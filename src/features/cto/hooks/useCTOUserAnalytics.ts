import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, serverTimestamp, query, where, onSnapshot, getDocs, updateDoc } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
  byStatus: {
    active: number;
    inactive: number;
    banned: number;
    suspended: number;
  };
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  peakUsage: {
    hour: number;
    day: string;
  };
}

export interface UserActivity {
  timestamp: number;
  activeUsers: number;
  newRegistrations: number;
  logins: number;
  pageViews: number;
}

export interface BannedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  bannedAt: any;
  bannedBy: string;
  reason: string;
  expiresAt?: any;
}

export interface UserTrend {
  date: string;
  total: number;
  new: number;
  active: number;
}

export interface AllUser {
  id: string;
  name: string;
  email: string;
  role: string;
  source: "main" | "direksi";
  isActive: boolean;
  isBanned: boolean;
  createdAt?: any;
}

export const useCTOUserAnalytics = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [trends, setTrends] = useState<UserTrend[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch users from BOTH databases
  const fetchAllUsers = useCallback(async () => {
    try {
      const allUsersList: AllUser[] = [];

      // 1. Fetch from MAIN database (default.users)
      try {
        const mainUsersRef = collection(dbMain, "users");
        const mainSnap = await getDocs(mainUsersRef);
        mainSnap.docs.forEach(d => {
          const data = d.data();
          allUsersList.push({
            id: d.id,
            name: data.name || data.displayName || data.email?.split("@")[0] || "Unknown",
            email: data.email || "",
            role: data.role || data.userRole || "CUSTOMER",
            source: "main",
            isActive: data.isActive !== false && !data.isBanned,
            isBanned: data.isBanned === true,
            createdAt: data.createdAt,
          });
        });
      } catch (err) {
        console.error("Error fetching main users:", err);
      }

      // 2. Fetch from DIREKSI database (directors collection)
      try {
        const direksiUsersRef = collection(dbCLevel, "directors");
        const direksiSnap = await getDocs(direksiUsersRef);
        direksiSnap.docs.forEach(d => {
          const data = d.data();
          allUsersList.push({
            id: d.id,
            name: data.name || data.displayName || data.email?.split("@")[0] || "Unknown",
            email: data.email || "",
            role: data.role || data.primaryRole || "DIRECTOR",
            source: "direksi",
            isActive: data.isActive !== false && !data.isBanned,
            isBanned: data.isBanned === true,
            createdAt: data.createdAt,
          });
        });
      } catch (err) {
        console.error("Error fetching direksi users:", err);
      }

      setAllUsers(allUsersList);

      // Calculate stats from combined data
      const byRole: Record<string, number> = {};
      let active = 0;
      let inactive = 0;
      let banned = 0;

      allUsersList.forEach(user => {
        // Count by role
        const role = user.role?.toUpperCase() || "UNKNOWN";
        byRole[role] = (byRole[role] || 0) + 1;

        // Count by status
        if (user.isBanned) banned++;
        else if (user.isActive) active++;
        else inactive++;
      });

      const newStats: UserStats = {
        total: allUsersList.length,
        byRole,
        byStatus: {
          active,
          inactive,
          banned,
          suspended: bannedUsers.length,
        },
        growth: {
          daily: Math.floor(allUsersList.length * 0.01), // Estimate
          weekly: Math.floor(allUsersList.length * 0.05),
          monthly: Math.floor(allUsersList.length * 0.15),
        },
        peakUsage: {
          hour: 12,
          day: "Monday",
        },
      };

      setStats(newStats);
    } catch (err) {
      console.error("Fetch all users error:", err);
    }
  }, [bannedUsers.length]);

  // Initial fetch and subscribe to changes
  useEffect(() => {
    setLoading(true);
    
    // Initial fetch from both databases
    fetchAllUsers().then(() => setLoading(false));

    // Subscribe to main users changes
    const unsubMain = onSnapshot(
      collection(dbMain, "users"),
      () => {
        fetchAllUsers();
      },
      (err) => {
        console.error("Main users snapshot error:", err);
      }
    );

    // Subscribe to direksi users changes
    const unsubDireksi = onSnapshot(
      collection(dbCLevel, "directors"),
      () => {
        fetchAllUsers();
      },
      (err) => {
        console.error("Direksi users snapshot error:", err);
      }
    );

    return () => {
      unsubMain();
      unsubDireksi();
    };
  }, [fetchAllUsers]);

  // Subscribe to activity data
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "user_activity"),
      where("timestamp", ">", Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data() as UserActivity);
      setActivity(data.sort((a, b) => a.timestamp - b.timestamp));
    }, (err) => {
      console.error("User activity error:", err);
      setActivity([]);
    });

    return () => unsub();
  }, []);

  // Subscribe to banned users (all active bans)
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "banned_users"),
      where("status", "!=", "UNBANNED")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as BannedUser));
      setBannedUsers(data);
    }, (err) => {
      console.error("Banned users error:", err);
      setBannedUsers([]);
    });

    return () => unsub();
  }, []);

  // Calculate trends from main database
  const calculateTrends = useCallback(async () => {
    try {
      const usersRef = collection(dbMain, "users");
      const usersSnap = await getDocs(usersRef);
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Group by creation date
      const byDate = new Map<string, { total: number; new: number }>();
      
      users.forEach((user: any) => {
        const createdAt = user.createdAt?.toDate ? user.createdAt.toDate() : new Date();
        const date = createdAt.toISOString().split("T")[0];
        
        const existing = byDate.get(date) || { total: 0, new: 0 };
        existing.total++;
        byDate.set(date, existing);
      });

      // Calculate cumulative totals
      let cumulative = 0;
      const trends: UserTrend[] = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => {
          cumulative += data.new;
          return {
            date,
            total: cumulative,
            new: data.new,
            active: Math.floor(data.total * 0.7), // Estimate 70% active
          };
        });

      setTrends(trends.slice(-30)); // Last 30 days
    } catch (err) {
      console.error("Calculate trends error:", err);
    }
  }, []);

  // Ban/suspend user
  const banUser = useCallback(async (
    userId: string,
    userData: { name: string; email: string; role: string },
    reason: string,
    duration?: number // days, undefined = permanent
  ): Promise<boolean> => {
    try {
      setProcessing(true);

      const bannedRef = doc(dbCLevel, "banned_users", userId);
      const expiresAt = duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : null;

      await setDoc(bannedRef, {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        bannedAt: serverTimestamp(),
        bannedBy: "CTO", // Would be current user
        reason,
        expiresAt: expiresAt ? serverTimestamp() : null,
        duration: duration || null,
      });

      // Update user status in appropriate database
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        if (user.source === "direksi") {
          const userRef = doc(dbCLevel, "directors", userId);
          await updateDoc(userRef, {
            isBanned: true,
            bannedAt: serverTimestamp(),
            bannedReason: reason,
            bannedBy: "CTO",
          });
        } else {
          const userRef = doc(dbMain, "users", userId);
          await updateDoc(userRef, {
            isBanned: true,
            bannedAt: serverTimestamp(),
            bannedReason: reason,
            bannedBy: "CTO",
          });
        }
      }

      // Refresh user list
      await fetchAllUsers();

      return true;
    } catch (err) {
      console.error("Ban user error:", err);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [allUsers, fetchAllUsers]);

  // Unban user
  const unbanUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setProcessing(true);

      // Remove from banned collection
      const bannedRef = doc(dbCLevel, "banned_users", userId);
      await setDoc(bannedRef, {
        unbannedAt: serverTimestamp(),
        status: "UNBANNED",
      }, { merge: true });

      // Update user status in appropriate database
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        if (user.source === "direksi") {
          const userRef = doc(dbCLevel, "directors", userId);
          await updateDoc(userRef, {
            isBanned: false,
            unbannedAt: serverTimestamp(),
          });
        } else {
          const userRef = doc(dbMain, "users", userId);
          await updateDoc(userRef, {
            isBanned: false,
            unbannedAt: serverTimestamp(),
          });
        }
      }

      // Refresh user list
      await fetchAllUsers();

      return true;
    } catch (err) {
      console.error("Unban user error:", err);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [allUsers, fetchAllUsers]);

  // Suspend user temporarily
  const suspendUser = useCallback(async (
    userId: string,
    duration: number, // hours
    reason: string
  ): Promise<boolean> => {
    try {
      setProcessing(true);

      const suspendRef = doc(dbCLevel, "suspended_users", userId);
      await setDoc(suspendRef, {
        userId,
        suspendedAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + duration * 60 * 60 * 1000),
        reason,
        suspendedBy: "CTO",
        duration,
      });

      // Update user in appropriate database
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        if (user.source === "direksi") {
          const userRef = doc(dbCLevel, "directors", userId);
          await updateDoc(userRef, {
            isSuspended: true,
            suspendedUntil: new Date(Date.now() + duration * 60 * 60 * 1000),
            suspendReason: reason,
          });
        } else {
          const userRef = doc(dbMain, "users", userId);
          await updateDoc(userRef, {
            isSuspended: true,
            suspendedUntil: new Date(Date.now() + duration * 60 * 60 * 1000),
            suspendReason: reason,
          });
        }
      }

      // Refresh user list
      await fetchAllUsers();

      return true;
    } catch (err) {
      console.error("Suspend user error:", err);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [allUsers, fetchAllUsers]);

  // Get chart data
  const getChartData = useCallback(() => {
    return {
      trends: trends.map(t => ({
        date: t.date,
        total: t.total,
        new: t.new,
        active: t.active,
      })),
      activity: activity.map(a => ({
        time: new Date(a.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        active: a.activeUsers,
        logins: a.logins,
      })),
      byRole: stats?.byRole || {},
      byStatus: stats?.byStatus || { active: 0, inactive: 0, banned: 0, suspended: 0 },
    };
  }, [trends, activity, stats]);

  // Get users by source
  const getUsersBySource = useCallback((source: "main" | "direksi") => {
    return allUsers.filter(u => u.source === source);
  }, [allUsers]);

  return {
    loading,
    processing,
    allUsers,
    getUsersBySource,
    stats,
    activity,
    bannedUsers,
    trends,
    banUser,
    unbanUser,
    suspendUser,
    calculateTrends,
    getChartData,
  };
};

export default useCTOUserAnalytics;
