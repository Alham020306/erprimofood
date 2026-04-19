import { useEffect, useMemo, useState } from "react";
import {
  createCMOCampaign,
  subscribeCMOCampaigns,
  updateCMOCampaignStatus,
} from "../services/cmoCampaignService";

type Params = {
  user: any;
};

export const useCMOCampaigns = ({ user }: Params) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeCMOCampaigns((rows) => {
      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const summary = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.status === "ACTIVE").length,
      draft: items.filter((i) => i.status === "DRAFT").length,
      paused: items.filter((i) => i.status === "PAUSED").length,
      ended: items.filter((i) => i.status === "ENDED").length,
    };
  }, [items]);

  const createCampaign = async (payload: any) => {
    await createCMOCampaign({
      ...payload,
      createdByUid: user?.uid || "",
      createdByName: user?.fullName || "Unknown",
      createdByRole: user?.primaryRole || "CMO",
    });
  };

  const setStatus = async (
    campaignId: string,
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED"
  ) => {
    await updateCMOCampaignStatus(campaignId, status);
  };

  return {
    loading,
    items,
    summary,
    createCampaign,
    setStatus,
  };
};