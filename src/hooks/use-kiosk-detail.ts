"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getKioskDetail } from "@/lib/services/kiosk-detail";
import {
  getKioskTelemetryErrorMessage,
  listKioskEvents,
  listKioskHeartbeats,
} from "@/lib/services/kiosk-telemetry";
import type { DashboardRole } from "@/types";
import type {
  KioskDeviceEventResult,
  KioskHeartbeatResult,
  KioskManagementDetail,
  KioskTelemetryPagination,
} from "@/types/kiosk-detail";

export type KioskDetailViewState = "LOADING" | "READY" | "NOT_FOUND" | "FORBIDDEN" | "ERROR";

export interface KioskEvidenceState<T> {
  data: T[];
  pagination: KioskTelemetryPagination | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface UseKioskDetailResult {
  kiosk: KioskManagementDetail | null;
  role: DashboardRole | null;
  state: KioskDetailViewState;
  errorMessage: string | null;
  metadataWarning: string | null;
  heartbeats: KioskEvidenceState<KioskHeartbeatResult>;
  events: KioskEvidenceState<KioskDeviceEventResult>;
  refresh: () => Promise<void>;
}

export function useKioskDetail(kioskId: string): UseKioskDetailResult {
  const { currentUser } = useAuth();
  const [kiosk, setKiosk] = useState<KioskManagementDetail | null>(null);
  const [state, setState] = useState<KioskDetailViewState>("LOADING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metadataWarning, setMetadataWarning] = useState<string | null>(null);
  const [heartbeats, setHeartbeats] = useState<
    KioskEvidenceState<KioskHeartbeatResult>
  >({ data: [], pagination: null, isLoading: false, errorMessage: null });
  const [events, setEvents] = useState<
    KioskEvidenceState<KioskDeviceEventResult>
  >({ data: [], pagination: null, isLoading: false, errorMessage: null });

  const fetchKiosk = useCallback(async (signal?: AbortSignal) => {
    setState("LOADING");
    setErrorMessage(null);
    setMetadataWarning(null);
    setHeartbeats({ data: [], pagination: null, isLoading: false, errorMessage: null });
    setEvents({ data: [], pagination: null, isLoading: false, errorMessage: null });

    if (!currentUser) {
      setKiosk(null);
      setState("FORBIDDEN");
      return;
    }

    try {
      const result = await getKioskDetail({ kioskId }, signal);

      if (signal?.aborted) {
        return;
      }

      if (result.outcome === "SUCCESS") {
        setKiosk(result.kiosk);
        setMetadataWarning(result.metadataWarning ?? null);
        setState("READY");

        setHeartbeats((current) => ({ ...current, isLoading: true }));
        setEvents((current) => ({ ...current, isLoading: true }));

        const [heartbeatsResult, eventsResult] = await Promise.allSettled([
          listKioskHeartbeats(kioskId, { pageNumber: 1, pageSize: 20 }, signal),
          listKioskEvents(kioskId, { pageNumber: 1, pageSize: 20 }, signal),
        ]);

        if (signal?.aborted) {
          return;
        }

        if (heartbeatsResult.status === "fulfilled") {
          setHeartbeats({
            data: heartbeatsResult.value.data,
            pagination: heartbeatsResult.value.pagination,
            isLoading: false,
            errorMessage: null,
          });
        } else {
          setHeartbeats({
            data: [],
            pagination: null,
            isLoading: false,
            errorMessage: getKioskTelemetryErrorMessage(
              heartbeatsResult.reason,
              "Không lấy được dữ liệu heartbeat.",
            ),
          });
        }

        if (eventsResult.status === "fulfilled") {
          setEvents({
            data: eventsResult.value.data,
            pagination: eventsResult.value.pagination,
            isLoading: false,
            errorMessage: null,
          });
        } else {
          setEvents({
            data: [],
            pagination: null,
            isLoading: false,
            errorMessage: getKioskTelemetryErrorMessage(
              eventsResult.reason,
              "Không lấy được sự kiện từ kiosk.",
            ),
          });
        }
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
      if (signal?.aborted) {
        return;
      }

      setKiosk(null);
      setState("ERROR");
      setErrorMessage("Không thể tải chi tiết kiosk. Vui lòng thử lại.");
    }
  }, [currentUser, kioskId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchKiosk(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchKiosk]);

  return {
    kiosk,
    role: currentUser?.role ?? null,
    state,
    errorMessage,
    metadataWarning,
    heartbeats,
    events,
    refresh: () => fetchKiosk(),
  };
}
