import { useEffect, useMemo, useState } from "react";
import { subscribeCOORestaurants } from "../../coo/services/cooLiteDataService";
import { buildMerchantZoneData } from "../services/ctoOpsIntelligence";

export const useCTOMerchantZonesLite = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeCOORestaurants((rows) => {
      setRestaurants(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const data = useMemo(
    () => buildMerchantZoneData({ restaurants }),
    [restaurants]
  );

  return {
    loading,
    merchants: data.merchants,
    zones: data.zones,
  };
};
