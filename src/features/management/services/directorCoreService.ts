import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { UserRole } from "../../../core/types/roles";

const roleCatalog: Record<
  UserRole,
  {
    roleName: string;
    hierarchyLevel: number;
    canDelegate: boolean;
    defaultDepartment: string;
    modules: Record<string, { view: boolean; manage: boolean; approve: boolean }>;
  }
> = {
  [UserRole.ADMIN]: {
    roleName: "Operations Admin",
    hierarchyLevel: 3,
    canDelegate: false,
    defaultDepartment: "Operations Admin",
    modules: {
      operations: { view: true, manage: true, approve: false },
      merchants: { view: true, manage: true, approve: false },
      drivers: { view: true, manage: true, approve: false },
      orders: { view: true, manage: true, approve: false },
      activity: { view: true, manage: true, approve: false },
    },
  },
  [UserRole.CEO]: {
    roleName: "Chief Executive Officer",
    hierarchyLevel: 1,
    canDelegate: true,
    defaultDepartment: "Executive",
    modules: {
      executive: { view: true, manage: true, approve: true },
      approvals: { view: true, manage: true, approve: true },
      meetings: { view: true, manage: true, approve: true },
      risks: { view: true, manage: true, approve: true },
    },
  },
  [UserRole.COO]: {
    roleName: "Chief Operating Officer",
    hierarchyLevel: 2,
    canDelegate: true,
    defaultDepartment: "Operations",
    modules: {
      operations: { view: true, manage: true, approve: true },
      merchants: { view: true, manage: false, approve: false },
      drivers: { view: true, manage: false, approve: false },
      approvals: { view: true, manage: true, approve: true },
    },
  },
  [UserRole.CTO]: {
    roleName: "Chief Technology Officer",
    hierarchyLevel: 2,
    canDelegate: true,
    defaultDepartment: "Technology",
    modules: {
      observability: { view: true, manage: true, approve: true },
      access: { view: true, manage: true, approve: true },
      config: { view: true, manage: true, approve: true },
      backups: { view: true, manage: true, approve: true },
    },
  },
  [UserRole.CFO]: {
    roleName: "Chief Financial Officer",
    hierarchyLevel: 2,
    canDelegate: true,
    defaultDepartment: "Finance",
    modules: {
      finance: { view: true, manage: true, approve: true },
      reports: { view: true, manage: true, approve: true },
      settlements: { view: true, manage: true, approve: true },
      approvals: { view: true, manage: true, approve: true },
    },
  },
  [UserRole.CMO]: {
    roleName: "Chief Marketing Officer",
    hierarchyLevel: 2,
    canDelegate: true,
    defaultDepartment: "Marketing",
    modules: {
      growth: { view: true, manage: true, approve: false },
      campaigns: { view: true, manage: true, approve: true },
      insights: { view: true, manage: true, approve: false },
    },
  },
  [UserRole.HR]: {
    roleName: "Human Resources",
    hierarchyLevel: 2,
    canDelegate: true,
    defaultDepartment: "People",
    modules: {
      people: { view: true, manage: true, approve: true },
      recruitment: { view: true, manage: true, approve: true },
      internalUsers: { view: true, manage: true, approve: false },
    },
  },
  [UserRole.SECRETARY]: {
    roleName: "Corporate Secretary",
    hierarchyLevel: 2,
    canDelegate: false,
    defaultDepartment: "Secretary",
    modules: {
      meetings: { view: true, manage: true, approve: false },
      letters: { view: true, manage: true, approve: false },
      boardPacks: { view: true, manage: true, approve: false },
    },
  },
};

export const bootstrapDirectorSharedCore = async (payload: {
  uid: string;
  email: string;
  fullName: string;
  primaryRole: UserRole;
  title?: string;
  department?: string;
  createdBy?: string;
}) => {
  const now = Date.now();
  const config = roleCatalog[payload.primaryRole];

  await setDoc(
    doc(dbCLevel, "director_profiles", payload.uid),
    {
      uid: payload.uid,
      email: payload.email,
      fullName: payload.fullName,
      title: payload.title || payload.primaryRole,
      department: payload.department || config.defaultDepartment,
      primaryRole: payload.primaryRole,
      signatureImage: "",
      bio: "",
      createdBy: payload.createdBy || payload.uid,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(dbCLevel, "director_roles", payload.primaryRole),
    {
      roleKey: payload.primaryRole,
      roleName: config.roleName,
      hierarchyLevel: config.hierarchyLevel,
      canDelegate: config.canDelegate,
      defaultDepartment: config.defaultDepartment,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(dbCLevel, "role_permissions", payload.primaryRole),
    {
      roleKey: payload.primaryRole,
      modules: config.modules,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

export const subscribeDirectorRoles = (callback: (rows: any[]) => void) =>
  onSnapshot(collection(dbCLevel, "director_roles"), (snap) => {
    callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
  });

export const subscribeRolePermissions = (callback: (rows: any[]) => void) =>
  onSnapshot(collection(dbCLevel, "role_permissions"), (snap) => {
    callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
