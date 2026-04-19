import { useEffect, useMemo, useState } from "react";
import {
  createMeetingActionItem,
  createMeetingAgenda,
  subscribeMeetingRequests,
  subscribeMeetingActionItems,
  subscribeMeetingAgendas,
  updateMeetingActionItemStatus,
  updateMeetingAgendaStatus,
  updateMeetingRequestStatus,
} from "../services/secretaryGovernanceService";

type Params = {
  user: any;
};

export const useSecretaryAgenda = ({ user }: Params) => {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgenda, setSelectedAgenda] = useState<any | null>(null);
  const [selectedActionItem, setSelectedActionItem] = useState<any | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [agendaSubmitting, setAgendaSubmitting] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [agendaForm, setAgendaForm] = useState({
    title: "",
    meetingDate: "",
    meetingTime: "",
    location: "",
    participants: "",
    requestId: "",
  });
  const [actionForm, setActionForm] = useState({
    title: "",
    description: "",
    assignedToRole: "COO",
    dueDate: "",
  });

  useEffect(() => {
    let agendaReady = false;
    let actionReady = false;
    let requestReady = false;

    const done = () => {
      if (agendaReady && actionReady && requestReady) setLoading(false);
    };

    const unsubAgendas = subscribeMeetingAgendas((rows) => {
      setAgendas(rows);
      agendaReady = true;
      done();
    });

    const unsubItems = subscribeMeetingActionItems((rows) => {
      setActionItems(rows);
      actionReady = true;
      done();
    });

    const unsubRequests = subscribeMeetingRequests((rows) => {
      setMeetingRequests(rows);
      requestReady = true;
      done();
    });

    return () => {
      unsubAgendas();
      unsubItems();
      unsubRequests();
    };
  }, []);

  const summary = useMemo(() => {
    return {
      agendas: agendas.length,
      finalized: agendas.filter((item) => item.status === "FINALIZED").length,
      scheduled: agendas.filter((item) => item.status === "SCHEDULED").length,
      openActions: actionItems.filter((item) => item.status === "OPEN").length,
      overdue: actionItems.filter((item) => item.status === "OVERDUE").length,
      pendingRequests: meetingRequests.filter((item) => item.status === "PENDING").length,
    };
  }, [agendas, actionItems, meetingRequests]);

  const submitAgenda = async () => {
    setAgendaSubmitting(true);
    try {
      await createMeetingAgenda({
        title: agendaForm.title,
        meetingDate: agendaForm.meetingDate,
        meetingTime: agendaForm.meetingTime,
        location: agendaForm.location,
        organizerUid: user?.uid || "",
        organizerName: user?.fullName || "Secretary Office",
        ownerRole: user?.primaryRole || "SECRETARY",
        participants: agendaForm.participants
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        requestedByUid: selectedRequest?.requestedByUid || "",
        requestedByName: selectedRequest?.requestedByName || "",
        requestedByRole: selectedRequest?.requestedByRole || "",
        requestId: selectedRequest?.id || agendaForm.requestId || null,
      });

      setAgendaForm({
        title: "",
        meetingDate: "",
        meetingTime: "",
        location: "",
        participants: "",
        requestId: "",
      });
      setSelectedRequest(null);
    } finally {
      setAgendaSubmitting(false);
    }
  };

  const submitActionItem = async () => {
    setActionSubmitting(true);
    try {
      await createMeetingActionItem({
        minuteId: null,
        title: actionForm.title,
        description: actionForm.description,
        assignedToRole: actionForm.assignedToRole,
        dueDate: actionForm.dueDate,
        createdByUid: user?.uid || "",
        createdByRole: user?.primaryRole || "SECRETARY",
      });

      setActionForm({
        title: "",
        description: "",
        assignedToRole: "COO",
        dueDate: "",
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  const setAgendaStatus = async (status: string) => {
    if (!selectedAgenda?.id) return;
    await updateMeetingAgendaStatus(selectedAgenda.id, status, {
      uid: user?.uid || "",
      role: user?.primaryRole || "SECRETARY",
    });
  };

  const setActionItemStatus = async (status: string) => {
    if (!selectedActionItem?.id) return;
    await updateMeetingActionItemStatus(selectedActionItem.id, status, {
      uid: user?.uid || "",
      role: user?.primaryRole || "SECRETARY",
    });
  };

  const setRequestStatus = async (status: string) => {
    if (!selectedRequest?.id) return;
    await updateMeetingRequestStatus(selectedRequest.id, status, {
      uid: user?.uid || "",
      name: user?.fullName || "",
      role: user?.primaryRole || "SECRETARY",
    });
  };

  const loadRequestIntoAgenda = (request: any) => {
    setSelectedRequest(request);
    setAgendaForm((prev) => ({
      ...prev,
      title: request.title || prev.title,
      meetingDate: request.preferredDate || prev.meetingDate,
      meetingTime: request.preferredTime || prev.meetingTime,
      participants: Array.isArray(request.participants)
        ? request.participants.join(", ")
        : prev.participants,
      requestId: request.id || "",
    }));
  };

  return {
    agendas,
    actionItems,
    meetingRequests,
    loading,
    summary,
    selectedAgenda,
    setSelectedAgenda,
    selectedActionItem,
    setSelectedActionItem,
    selectedRequest,
    setSelectedRequest,
    agendaForm,
    setAgendaForm,
    actionForm,
    setActionForm,
    agendaSubmitting,
    actionSubmitting,
    submitAgenda,
    submitActionItem,
    setAgendaStatus,
    setActionItemStatus,
    setRequestStatus,
    loadRequestIntoAgenda,
  };
};
