"use client";

import { HubConnectionState } from "@microsoft/signalr";
import { useEffect, useRef } from "react";

import { getManagementDashboardHubUrl } from "@/lib/realtime/hub-urls";
import { createHubConnection } from "@/lib/realtime/signalr-client";
import type {
  DashboardInvalidatedEvent,
  DashboardScope,
} from "@/types/realtime/signalr-events";

const DEBOUNCE_MS = 300;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 10_000;

export interface UseDashboardRealtimeOptions {
  scope: DashboardScope;
  organizationId?: string | null;
  storeId?: string | null;
  onInvalidated: (event: DashboardInvalidatedEvent) => void;
  enabled?: boolean;
}

export function useDashboardRealtime({
  scope,
  organizationId = null,
  storeId = null,
  onInvalidated,
  enabled = true,
}: UseDashboardRealtimeOptions) {
  const onInvalidatedRef = useRef(onInvalidated);
  const scopeKey = `${scope}:${organizationId ?? ""}:${storeId ?? ""}:${enabled}`;

  useEffect(() => {
    onInvalidatedRef.current = onInvalidated;
  }, [onInvalidated]);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const connection = createHubConnection({
      url: getManagementDashboardHubUrl(),
    });

    const triggerInvalidated = (event: DashboardInvalidatedEvent) => {
      if (disposed || debounceTimer) return;

      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (!disposed) {
          onInvalidatedRef.current(event);
        }
      }, DEBOUNCE_MS);
    };

    const joinGroup = async () => {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke(
          "JoinDashboard",
          scope,
          organizationId || null,
          storeId || null,
        );
      }
    };

    const scheduleConnectionRetry = () => {
      if (disposed || retryTimer) return;

      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * 2 ** retryAttempt,
        MAX_RETRY_DELAY_MS,
      );
      retryAttempt += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connectAndJoin();
      }, delay);
    };

    const connectAndJoin = async () => {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
        }
        if (disposed) return;

        await joinGroup();
        retryAttempt = 0;
      } catch {
        scheduleConnectionRetry();
      }
    };

    connection.on(
      "DashboardInvalidated",
      (event: DashboardInvalidatedEvent) => {
        triggerInvalidated(event ?? { scope, organizationId, storeId });
      },
    );

    connection.onreconnected(() => {
      void connectAndJoin().then(() => {
        if (!retryTimer) {
          triggerInvalidated({ scope, organizationId, storeId, reason: "Reconnected" });
        }
      });
    });

    connection.onclose(() => scheduleConnectionRetry());

    void connectAndJoin();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      connection.off("DashboardInvalidated");
      void connection.stop();
    };
  }, [scopeKey]);
}
