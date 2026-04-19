import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export const subscribeCMOCampaigns = (callback: (rows: any[]) => void) => {
  const q = query(
    collection(dbCLevel, "cmo_campaigns"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    },
    (error) => {
      console.error("subscribeCMOCampaigns error:", error);
      callback([]);
    }
  );
};

export const createCMOCampaign = async (payload: {
  title: string;
  type: string;
  targetType: string;
  targetArea?: string | null;
  budget?: number;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
  startDate?: number | null;
  endDate?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  notes?: string;
  createdByUid: string;
  createdByName: string;
  createdByRole: string;
}) => {
  const now = Date.now();

  await addDoc(collection(dbCLevel, "cmo_campaigns"), {
    ...payload,
    targetArea: payload.targetArea || null,
    budget: payload.budget || 0,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    discountType: payload.discountType || null,
    discountValue: payload.discountValue || null,
    notes: payload.notes || "",
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });
};

export const updateCMOCampaignStatus = async (
  campaignId: string,
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED"
) => {
  await updateDoc(doc(dbCLevel, "cmo_campaigns", campaignId), {
    status,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};