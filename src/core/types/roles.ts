export enum UserRole {
  ADMIN = "ADMIN",
  CEO = "CEO",
  COO = "COO",
  CTO = "CTO",
  CFO = "CFO",
  CMO = "CMO",
  HR = "HR",
  SECRETARY = "SECRETARY",
}

export const resolveMainDbRole = (role: UserRole) => {
  if (role === UserRole.ADMIN) {
    return UserRole.COO;
  }

  return role;
};
