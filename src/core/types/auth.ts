import { UserRole } from "./roles";

export type DirectorUser = {
  uid: string;
  email: string;
  fullName: string;
  primaryRole: UserRole;
  roles: UserRole[];
  title?: string;
  department?: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: number;
  updatedAt: number;
};