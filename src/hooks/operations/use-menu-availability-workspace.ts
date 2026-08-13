"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getKioskManagementErrorMessage,
  getManagementKiosks,
} from "@/lib/services/kiosks/management";
import type { KioskResult } from "@/types/kiosks/management";

export function useMenuAvailabilityWorkspace() {
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [selectedKioskId, setSelectedKioskId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);
      void getManagementKiosks({}, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          setKiosks(result);
          setSelectedKioskId((current) => (
            result.some((kiosk) => kiosk.id === current) ? current : result[0]?.id ?? ""
          ));
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setKiosks([]);
          setSelectedKioskId("");
          setErrorMessage(getKioskManagementErrorMessage(error));
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [refreshVersion]);

  const selectedKiosk = useMemo(
    () => kiosks.find((kiosk) => kiosk.id === selectedKioskId) ?? null,
    [kiosks, selectedKioskId],
  );

  return {
    kiosks,
    selectedKiosk,
    selectedKioskId,
    refreshVersion,
    isLoading,
    errorMessage,
    selectKiosk: setSelectedKioskId,
    refresh: () => setRefreshVersion((version) => version + 1),
  };
}
