import { useMemo } from "react";
import { useHRDashboard } from "./useHRDashboard";

export const useHREmployees = () => {
  const { loading, employees, employeeStats } = useHRDashboard();

  const items = useMemo(() => {
    return employees?.map((e) => ({
      ...e,
      id: e.id,
      name: e.fullName,
      role: e.position,
    })) || [];
  }, [employees]);

  return {
    loading,
    items,
    summary: employeeStats || { total: 0, active: 0, inactive: 0, suspended: 0, terminated: 0 },
    employees,
  };
};