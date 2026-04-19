import { useEffect, useMemo, useState } from "react";
import {
  createMeetingRequest,
  subscribeMeetingAgendas,
  subscribeMeetingRequests,
} from "../../secretary/services/secretaryGovernanceService";

type Params = {
  user: any;
};

export const useMeetingSchedule = ({ user }: Params) => {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: "",
    purpose: "",
    preferredDate: "",
    preferredTime: "",
    participants: "",
  });

  useEffect(() => {
    let agendaReady = false;
    let requestReady = false;

    const done = () => {
      if (agendaReady && requestReady) setLoading(false);
    };

    const unsubAgendas = subscribeMeetingAgendas((rows) => {
      setAgendas(rows);
      agendaReady = true;
      done();
    });

    const unsubRequests = subscribeMeetingRequests((rows) => {
      setRequests(rows);
      requestReady = true;
      done();
    });

    return () => {
      unsubAgendas();
      unsubRequests();
    };
  }, []);

  const myRequests = useMemo(
    () => requests.filter((item) => item.requestedByUid === user?.uid),
    [requests, user]
  );

  const upcomingAgendas = useMemo(
    () =>
      [...agendas].sort((a, b) =>
        `${a.meetingDate || ""}${a.meetingTime || ""}`.localeCompare(
          `${b.meetingDate || ""}${b.meetingTime || ""}`
        )
      ),
    [agendas]
  );

  const submitRequest = async () => {
    setRequestSubmitting(true);
    try {
      await createMeetingRequest({
        title: requestForm.title,
        purpose: requestForm.purpose,
        preferredDate: requestForm.preferredDate,
        preferredTime: requestForm.preferredTime,
        participants: requestForm.participants
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        requestedByUid: user?.uid || "",
        requestedByName: user?.fullName || "Unknown",
        requestedByRole: user?.primaryRole || "DIRECTOR",
      });

      setRequestForm({
        title: "",
        purpose: "",
        preferredDate: "",
        preferredTime: "",
        participants: "",
      });
    } finally {
      setRequestSubmitting(false);
    }
  };

  return {
    agendas: upcomingAgendas,
    myRequests,
    loading,
    requestForm,
    setRequestForm,
    requestSubmitting,
    submitRequest,
  };
};
