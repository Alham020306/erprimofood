import { useEffect, useMemo, useState } from "react";
import { UserRole } from "../../../core/types/roles";
import {
  createExecutiveTask,
  createRiskItem,
  subscribeExecutiveTasks,
  subscribeRiskRegister,
  updateExecutiveTaskStatus,
  updateRiskStatus,
} from "../services/executiveControlService";

type Params = {
  user: any;
};

export const useExecutiveControl = ({ user }: Params) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    assignedToRole: UserRole.COO,
    priority: "HIGH",
    dueDate: "",
  });
  const [riskForm, setRiskForm] = useState({
    category: "OPERATIONAL",
    title: "",
    description: "",
    impact: "4",
    likelihood: "3",
    mitigationPlan: "",
    ownerRole: UserRole.CTO,
  });

  useEffect(() => {
    let tasksReady = false;
    let risksReady = false;

    const done = () => {
      if (tasksReady && risksReady) setLoading(false);
    };

    const unsubTasks = subscribeExecutiveTasks((rows) => {
      setTasks(rows);
      tasksReady = true;
      done();
    });

    const unsubRisks = subscribeRiskRegister((rows) => {
      setRisks(rows);
      risksReady = true;
      done();
    });

    return () => {
      unsubTasks();
      unsubRisks();
    };
  }, []);

  const summary = useMemo(() => {
    return {
      totalTasks: tasks.length,
      blockedTasks: tasks.filter((item) => item.status === "BLOCKED").length,
      openRisks: risks.filter((item) => item.status === "OPEN").length,
      monitoringRisks: risks.filter((item) => item.status === "MONITORING").length,
    };
  }, [tasks, risks]);

  const submitTask = async () => {
    await createExecutiveTask({
      title: taskForm.title,
      description: taskForm.description,
      assignedBy: user?.uid || "",
      assignedByRole: user?.primaryRole || "CEO",
      assignedTo: taskForm.assignedTo,
      assignedToRole: taskForm.assignedToRole,
      priority: taskForm.priority,
      dueAt: taskForm.dueDate ? new Date(taskForm.dueDate).getTime() : null,
    });

    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      assignedToRole: UserRole.COO,
      priority: "HIGH",
      dueDate: "",
    });
  };

  const submitRisk = async () => {
    await createRiskItem({
      category: riskForm.category,
      title: riskForm.title,
      description: riskForm.description,
      impact: Number(riskForm.impact || 0),
      likelihood: Number(riskForm.likelihood || 0),
      mitigationPlan: riskForm.mitigationPlan,
      ownerRole: riskForm.ownerRole,
      actorUid: user?.uid || "",
      actorRole: user?.primaryRole || "CEO",
    });

    setRiskForm({
      category: "OPERATIONAL",
      title: "",
      description: "",
      impact: "4",
      likelihood: "3",
      mitigationPlan: "",
      ownerRole: UserRole.CTO,
    });
  };

  return {
    loading,
    tasks,
    risks,
    summary,
    selectedTask,
    setSelectedTask,
    selectedRisk,
    setSelectedRisk,
    taskForm,
    setTaskForm,
    riskForm,
    setRiskForm,
    submitTask,
    submitRisk,
    setTaskStatus: async (status: string) => {
      if (!selectedTask?.id) return;
      await updateExecutiveTaskStatus(selectedTask.id, status, {
        uid: user?.uid || "",
        role: user?.primaryRole || "CEO",
      });
    },
    setRiskStatus: async (status: string) => {
      if (!selectedRisk?.id) return;
      await updateRiskStatus(selectedRisk.id, status, {
        uid: user?.uid || "",
        role: user?.primaryRole || "CEO",
      });
    },
  };
};
