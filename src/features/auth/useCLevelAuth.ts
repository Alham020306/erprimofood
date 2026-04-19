import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { deleteApp, initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { authCLevel, dbCLevel } from "../../core/firebase/firebaseCLevel";
import { firebaseConfig } from "../../core/firebase/firebaseApp";
import { dbMain } from "../../core/firebase/firebaseMain";
import { DirectorUser } from "../../core/types/auth";
import { resolveMainDbRole, UserRole } from "../../core/types/roles";
import { bootstrapDirectorSharedCore } from "../management/services/directorCoreService";

const COLLECTION_NAME = "direction_users";

type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  primaryRole: UserRole;
  ctoEmail?: string;
  ctoPassword?: string;
};

export const needsCTOApprovalForRegistration = async () => {
  const q = query(
    // Bootstrap should only be open until the first active CTO exists.
    // After that, the flow returns to CTO-authorized registration.
    // We intentionally keep the check lightweight with a limit(1).
    collection(dbCLevel, COLLECTION_NAME),
    where("primaryRole", "==", UserRole.CTO),
    where("isActive", "==", true),
    where("isSuspended", "==", false),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
};

const verifyCTOAuthorization = async (email: string, password: string) => {
  const verifierApp = initializeApp(
    firebaseConfig,
    `cto-approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const verifierAuth = getAuth(verifierApp);

  try {
    const credential = await signInWithEmailAndPassword(
      verifierAuth,
      email,
      password
    );

    const snap = await getDoc(doc(dbCLevel, COLLECTION_NAME, credential.user.uid));

    if (!snap.exists()) {
      throw new Error("Profil CTO tidak ditemukan.");
    }

    const data = snap.data() as DirectorUser;

    if (data.primaryRole !== UserRole.CTO) {
      throw new Error("Otorisasi ditolak. Hanya akun CTO yang boleh mengonfirmasi registrasi.");
    }

    if (data.isSuspended || !data.isActive) {
      throw new Error("Akun CTO tidak aktif untuk memberikan otorisasi.");
    }
  } finally {
    await signOut(verifierAuth).catch(() => undefined);
    await deleteApp(verifierApp).catch(() => undefined);
  }
};

export const registerDirector = async ({
  fullName,
  email,
  password,
  primaryRole,
  ctoEmail,
  ctoPassword,
}: RegisterPayload): Promise<DirectorUser> => {
  const requiresApproval = await needsCTOApprovalForRegistration();

  if (requiresApproval) {
    if (!ctoEmail || !ctoPassword) {
      throw new Error("Registrasi direksi berikutnya memerlukan otorisasi CTO.");
    }

    await verifyCTOAuthorization(ctoEmail, ctoPassword);
  }

  await setPersistence(authCLevel, browserLocalPersistence);

  const credential = await createUserWithEmailAndPassword(
    authCLevel,
    email,
    password
  );

  const uid = credential.user.uid;
  const now = Date.now();

  const profile: DirectorUser = {
    uid,
    email,
    fullName,
    primaryRole,
    roles: [primaryRole],
    title: primaryRole,
    department: primaryRole,
    isActive: true,
    isSuspended: false,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(dbCLevel, COLLECTION_NAME, uid), {
    ...profile,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  await bootstrapDirectorSharedCore({
    uid,
    email,
    fullName,
    primaryRole,
    title: primaryRole,
    department: primaryRole,
    createdBy: uid,
  });

  // Write minimal data to default (main) database - only email and role
  await setDoc(doc(dbMain, "users", uid), {
    email: credential.user.email,
    role: resolveMainDbRole(primaryRole),
    createdAt: serverTimestamp(),
  });

  return profile;
};

export const loginDirector = async (
  email: string,
  password: string
): Promise<DirectorUser> => {
  await setPersistence(authCLevel, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(authCLevel, email, password);
  const uid = credential.user.uid;

  const snap = await getDoc(doc(dbCLevel, COLLECTION_NAME, uid));

  if (!snap.exists()) {
    throw new Error("Profil direksi tidak ditemukan.");
  }

  const data = snap.data() as DirectorUser;

  if (data.isSuspended) {
    throw new Error("Akun ditangguhkan.");
  }

  if (!data.isActive) {
    throw new Error("Akun tidak aktif.");
  }

  return {
    uid,
    email: data.email,
    fullName: data.fullName,
    primaryRole: data.primaryRole,
    roles: Array.isArray(data.roles) ? data.roles : [data.primaryRole],
    title: data.title,
    department: data.department,
    isActive: data.isActive,
    isSuspended: data.isSuspended,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const loadDirectorProfile = async (uid: string): Promise<DirectorUser> => {
  const snap = await getDoc(doc(dbCLevel, COLLECTION_NAME, uid));

  if (!snap.exists()) {
    throw new Error("Profil direksi tidak ditemukan.");
  }

  const data = snap.data() as DirectorUser;

  if (data.isSuspended) {
    throw new Error("Akun ditangguhkan.");
  }

  if (!data.isActive) {
    throw new Error("Akun tidak aktif.");
  }

  return {
    uid,
    email: data.email,
    fullName: data.fullName,
    primaryRole: data.primaryRole,
    roles: Array.isArray(data.roles) ? data.roles : [data.primaryRole],
    title: data.title,
    department: data.department,
    isActive: data.isActive,
    isSuspended: data.isSuspended,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const subscribeDirectorSession = (
  callback: (user: DirectorUser | null) => void
) =>
  onAuthStateChanged(authCLevel, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const profile = await loadDirectorProfile(firebaseUser.uid);
      callback(profile);
    } catch (error) {
      console.error("Failed to restore director session:", error);
      callback(null);
    }
  });

export const logoutDirector = async () => {
  await signOut(authCLevel);
};
