import { getApps, initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseConfig } from "../../../core/firebase/firebaseApp";
import { dbCLevel, storageCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { resolveMainDbRole, UserRole } from "../../../core/types/roles";
import { bootstrapDirectorSharedCore } from "./directorCoreService";

const getProvisioningAuth = () => {
  const existingApp = getApps().find((app) => app.name === "provisioning");
  const app = existingApp ?? initializeApp(firebaseConfig, "provisioning");
  return getAuth(app);
};

const logAudit = async (payload: {
  actorUid: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  after?: Record<string, unknown>;
}) => {
  if (!payload.actorUid) return;

  await addDoc(collection(dbCLevel, "audit_logs"), {
    ...payload,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
};

export const subscribeDirectorUsers = (callback: (rows: any[]) => void) => {
  return onSnapshot(collection(dbCLevel, "direction_users"), (snap) => {
    const rows = snap.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a: any, b: any) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));

    callback(rows);
  });
};

export const subscribeMerchantAccounts = (callback: (rows: any[]) => void) => {
  return onSnapshot(collection(dbMain, "restaurants"), (snap) => {
    const rows = snap.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    callback(rows);
  });
};

export const subscribeDriverAccounts = (callback: (rows: any[]) => void) => {
  return onSnapshot(collection(dbMain, "users"), (snap) => {
    const rows = snap.docs
      .map((item) => ({
        id: item.id,
        ...item.data(),
      }))
      .filter((item: any) => String(item.role || "").toUpperCase() === "DRIVER")
      .sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

    callback(rows);
  });
};

export const provisionDirectorUser = async (payload: {
  fullName: string;
  email: string;
  password: string;
  primaryRole: UserRole;
  title?: string;
  department?: string;
  actorUid: string;
  actorRole: string;
}) => {
  const auth = getProvisioningAuth();
  const now = Date.now();

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      payload.email,
      payload.password
    );

    const uid = credential.user.uid;

    await setDoc(doc(dbCLevel, "direction_users", uid), {
      uid,
      email: payload.email,
      fullName: payload.fullName,
      primaryRole: payload.primaryRole,
      roles: [payload.primaryRole],
      title: payload.title || payload.primaryRole,
      department: payload.department || payload.primaryRole,
      isActive: true,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
      createdBy: payload.actorUid,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });

    await bootstrapDirectorSharedCore({
      uid,
      email: payload.email,
      fullName: payload.fullName,
      primaryRole: payload.primaryRole,
      title: payload.title || payload.primaryRole,
      department: payload.department || payload.primaryRole,
      createdBy: payload.actorUid,
    });

    await setDoc(
      doc(dbMain, "users", uid),
      {
        email: payload.email,
        role: resolveMainDbRole(payload.primaryRole),
      },
      { merge: true }
    );

    await logAudit({
      actorUid: payload.actorUid,
      actorRole: payload.actorRole,
      action: "DIRECTOR_USER_CREATED",
      entityType: "direction_users",
      entityId: uid,
      after: {
        email: payload.email,
        primaryRole: payload.primaryRole,
      },
    });
  } finally {
    await signOut(auth);
  }
};

export const updateDirectorUserStatus = async (payload: {
  uid: string;
  actorUid: string;
  actorRole: string;
  isActive?: boolean;
  isSuspended?: boolean;
}) => {
  await updateDoc(doc(dbCLevel, "direction_users", payload.uid), {
    ...(payload.isActive === undefined ? {} : { isActive: payload.isActive }),
    ...(payload.isSuspended === undefined
      ? {}
      : { isSuspended: payload.isSuspended }),
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });

  await logAudit({
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    action: "DIRECTOR_USER_STATUS_UPDATED",
    entityType: "direction_users",
    entityId: payload.uid,
    after: {
      isActive: payload.isActive,
      isSuspended: payload.isSuspended,
    },
  });
};

export const provisionMerchantAccount = async (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  rating?: number | string;
  lat?: number;
  lng?: number;
  imageFile?: File | null;
  actorUid: string;
  actorRole: string;
}) => {
  const auth = getProvisioningAuth();
  const now = Date.now();

  try {
    const generatedPassword =
      payload.password ||
      Array.from({ length: 8 }, () =>
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
          Math.floor(Math.random() * 62)
        )
      ).join("");

    const credential = await createUserWithEmailAndPassword(
      auth,
      payload.email,
      generatedPassword
    );

    const uid = credential.user.uid;
    const verificationToken = String(
      Math.floor(100000 + Math.random() * 900000)
    );
    const merchantRef = doc(dbMain, "restaurants", uid);
    let imageUrl = "";

    if (payload.imageFile) {
      const nowName = payload.imageFile.name.replace(/\s+/g, "_");
      const storageRef = ref(
        storageCLevel,
        `restaurants/${uid}/${Date.now()}_${nowName}`
      );

      await uploadBytes(storageRef, payload.imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    await setDoc(doc(dbMain, "users", uid), {
      id: uid,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "",
      role: "RESTAURANT",
      balance: 0,
      banReason: null,
      bannedAt: null,
      isBanned: false,
      isVerified: false,
      isTokenVerified: false,
      totalUnpaidCommission: 0,
      verificationToken,
      activatedAt: null,
      createdAt: now,
    });

    await setDoc(merchantRef, {
      id: uid,
      name: payload.name,
      ownerId: uid,
      email: payload.email,
      phone: payload.phone || "",
      address: payload.address || "",
      image: imageUrl,
      password: generatedPassword,
      role: "RESTAURANT",
      activatedAt: null,
      coords: {
        lat: Number(payload.lat || 2.3802),
        lng: Number(payload.lng || 97.9892),
      },
      isOpen: false,
      isBanned: false,
      isVerified: false,
      isTokenVerified: false,
      verificationToken,
      rating: Number(payload.rating || 4.5),
      totalOrders: 0,
      balance: 0,
      totalUnpaidCommission: 0,
      closingDelayed: false,
      categories: [],
      createdAt: now,
    });

    await logAudit({
      actorUid: payload.actorUid,
      actorRole: payload.actorRole,
      action: "MERCHANT_CREATED",
      entityType: "restaurants",
      entityId: uid,
      after: {
        ownerId: uid,
        email: payload.email,
      },
    });

    return {
      uid,
      email: payload.email,
      password: generatedPassword,
      verificationToken,
    };
  } finally {
    await signOut(auth);
  }
};

export const updateMerchantStatus = async (payload: {
  merchantId: string;
  actorUid: string;
  actorRole: string;
  isOpen?: boolean;
  isBanned?: boolean;
  isVerified?: boolean;
}) => {
  await updateDoc(doc(dbMain, "restaurants", payload.merchantId), {
    ...(payload.isOpen === undefined ? {} : { isOpen: payload.isOpen }),
    ...(payload.isBanned === undefined ? {} : { isBanned: payload.isBanned }),
    ...(payload.isVerified === undefined ? {} : { isVerified: payload.isVerified }),
    updatedAt: Date.now(),
  });

  await updateDoc(doc(dbMain, "users", payload.merchantId), {
    ...(payload.isBanned === undefined ? {} : { isBanned: payload.isBanned }),
    ...(payload.isVerified === undefined ? {} : { isVerified: payload.isVerified }),
    updatedAt: Date.now(),
  });

  await logAudit({
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    action: "MERCHANT_STATUS_UPDATED",
    entityType: "restaurants",
    entityId: payload.merchantId,
    after: {
      isOpen: payload.isOpen,
      isBanned: payload.isBanned,
      isVerified: payload.isVerified,
    },
  });
};

export const provisionDriverAccount = async (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  vehicleBrand?: string;
  plateNumber?: string;
  operationalArea?: string;
  address?: string;
  lat?: number;
  lng?: number;
  imageFile?: File | null;
  actorUid: string;
  actorRole: string;
}) => {
  const auth = getProvisioningAuth();
  const now = Date.now();

  try {
    const generatedPassword =
      payload.password ||
      Array.from({ length: 8 }, () =>
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
          Math.floor(Math.random() * 62)
        )
      ).join("");

    const credential = await createUserWithEmailAndPassword(
      auth,
      payload.email,
      generatedPassword
    );

    const uid = credential.user.uid;
    const verificationToken = String(
      Math.floor(100000 + Math.random() * 900000)
    );
    let avatarUrl = "";

    if (payload.imageFile) {
      const nowName = payload.imageFile.name.replace(/\s+/g, "_");
      const storageRef = ref(
        storageCLevel,
        `drivers/${uid}/${Date.now()}_${nowName}`
      );

      await uploadBytes(storageRef, payload.imageFile);
      avatarUrl = await getDownloadURL(storageRef);
    }

    await setDoc(doc(dbMain, "users", uid), {
      id: uid,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || "",
      role: "DRIVER",
      activatedAt: null,
      avatar: avatarUrl,
      isOnline: false,
      isVerified: false,
      isTokenVerified: false,
      phoneVerified: false,
      isBanned: false,
      banReason: null,
      bannedAt: null,
      balance: 0,
      totalUnpaidCommission: 0,
      lastSeenVersion: "",
      lastUpdateCheck: null,
      vehicleBrand: payload.vehicleBrand || "",
      plateNumber: payload.plateNumber || "",
      operationalArea: payload.operationalArea || "",
      location: {
        address: payload.address || "",
        lat: Number(payload.lat || 2.3802),
        lng: Number(payload.lng || 97.9892),
      },
      verificationToken,
      createdAt: now,
    });

    await logAudit({
      actorUid: payload.actorUid,
      actorRole: payload.actorRole,
      action: "DRIVER_CREATED",
      entityType: "users",
      entityId: uid,
      after: {
        role: "DRIVER",
        email: payload.email,
      },
    });

    return {
      uid,
      email: payload.email,
      password: generatedPassword,
      verificationToken,
    };
  } finally {
    await signOut(auth);
  }
};

export const updateDriverStatus = async (payload: {
  driverId: string;
  actorUid: string;
  actorRole: string;
  isVerified?: boolean;
  isBanned?: boolean;
}) => {
  await updateDoc(doc(dbMain, "users", payload.driverId), {
    ...(payload.isVerified === undefined
      ? {}
      : { isVerified: payload.isVerified }),
    ...(payload.isBanned === undefined ? {} : { isBanned: payload.isBanned }),
    updatedAt: Date.now(),
  });

  await logAudit({
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    action: "DRIVER_STATUS_UPDATED",
    entityType: "users",
    entityId: payload.driverId,
    after: {
      isVerified: payload.isVerified,
      isBanned: payload.isBanned,
    },
  });
};

export const updateMainUserAccountStatus = async (payload: {
  userId: string;
  actorUid: string;
  actorRole: string;
  isBanned?: boolean;
  isVerified?: boolean;
}) => {
  await updateDoc(doc(dbMain, "users", payload.userId), {
    ...(payload.isBanned === undefined ? {} : { isBanned: payload.isBanned }),
    ...(payload.isVerified === undefined ? {} : { isVerified: payload.isVerified }),
    updatedAt: Date.now(),
  });

  await logAudit({
    actorUid: payload.actorUid,
    actorRole: payload.actorRole,
    action: "MAIN_USER_STATUS_UPDATED",
    entityType: "users",
    entityId: payload.userId,
    after: {
      isBanned: payload.isBanned,
      isVerified: payload.isVerified,
    },
  });
};
