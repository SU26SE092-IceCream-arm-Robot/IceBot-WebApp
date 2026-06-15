"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  getKioskDetail,
  type KioskDetailMetadataSource,
} from "@/lib/services/kiosk-detail";
import type { DashboardRole } from "@/types";
import type { KioskDetail } from "@/types/kiosk-detail";

export type KioskDetailViewState = "LOADING" | "READY" | "NOT_FOUND" | "FORBIDDEN" | "ERROR";

export interface UseKioskDetailResult {
  kiosk: KioskDetail | null;
  role: DashboardRole | null;
  state: KioskDetailViewState;
  errorMessage: string | null;
  metadataSource: KioskDetailMetadataSource;
  metadataWarning: string | null;
  refresh: () => Promise<void>;
}

export function useKioskDetail(kioskId: string): UseKioskDetailResult {
  const { currentUser } = useAuth();
  const [kiosk, setKiosk] = useState<KioskDetail | null>(null);
  const [state, setState] = useState<KioskDetailViewState>("LOADING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metadataSource, setMetadataSource] =
    useState<KioskDetailMetadataSource>("MOCK");
  const [metadataWarning, setMetadataWarning] = useState<string | null>(null);

  const fetchKiosk = useCallback(async () => {
    setState("LOADING");
    setErrorMessage(null);
    setMetadataWarning(null);

    if (!currentUser) {
      setKiosk(null);
      setState("FORBIDDEN");
      return;
    }

    try {
      const params = {
        kioskId,
        role: currentUser.role,
        locationIds: currentUser.locationIds,
      };
      const result = await getKioskDetail(params);

      if (result.outcome === "SUCCESS") {
        setKiosk(result.kiosk);
        setMetadataSource(result.metadataSource);
        setMetadataWarning(result.metadataWarning ?? null);
        setState("READY");
        return;
      }

      setKiosk(null);
      if (result.outcome === "ERROR") {
        setErrorMessage(result.message);
        setState("ERROR");
        return;
      }

      setState(result.outcome);
    } catch {
      setKiosk(null);
      setState("ERROR");
      setErrorMessage("Không thể tải chi tiết kiosk. Vui lòng thử lại.");
    }
  }, [currentUser, kioskId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchKiosk();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchKiosk]);

  return {
    kiosk,
    role: currentUser?.role ?? null,
    state,
    errorMessage,
    metadataSource,
    metadataWarning,
    refresh: fetchKiosk,
  };
}
