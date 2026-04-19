import { useEffect, useState, useCallback } from "react";
import { collection, onSnapshot, query, orderBy, limit, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const useCFORecruitmentRequests = (user: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(dbCLevel, "cfo_recruitment_requests"),
      orderBy("requestDate", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRequests(data);
      setMyRequests(data.filter((r: any) => r.requestedBy?.uid === user?.uid));
      setLoading(false);
    }, (error) => {
      console.error("Recruitment requests error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const createRequest = useCallback(async (data: {
    position: string;
    department: string;
    level: "STAFF" | "MANAGER" | "DIRECTOR";
    employmentType: "FULLTIME" | "CONTRACT" | "INTERN";
    skills: string[];
    experience: string;
    education: string;
    budget: number;
    justification: string;
    neededBy: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
  }) => {
    const newRequest = {
      requestId: `RR-${Date.now()}`,
      requestDate: Date.now(),
      requestedBy: {
        uid: user?.uid,
        name: user?.fullName || user?.displayName,
        role: user?.primaryRole,
        department: "Finance"
      },
      requirements: {
        skills: data.skills,
        experience: data.experience,
        education: data.education,
        budget: data.budget
      },
      position: data.position,
      department: data.department,
      level: data.level,
      employmentType: data.employmentType,
      justification: data.justification,
      replacementFor: null,
      neededBy: new Date(data.neededBy).getTime(),
      priority: data.priority,
      status: "PENDING_HR",
      hrNotes: "",
      hrResponse: {
        approved: null,
        approvedBy: null,
        approvedAt: null,
        notes: "",
        candidateSelected: null,
        startedAt: null
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(dbCLevel, "cfo_recruitment_requests"), newRequest);
    return docRef.id;
  }, [user]);

  return {
    loading,
    requests,
    myRequests,
    createRequest
  };
};
