"use client";

import { HubConnectionState } from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";

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

export type DashboardRealtimeStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected";

export function useDashboardRealtime({
  scope,
  organizationId = null,
  storeId = null,
  onInvalidated,
  enabled = true,
}: UseDashboardRealtimeOptions): DashboardRealtimeStatus {
  const onInvalidatedRef = useRef(onInvalidated);
  const [connectionStatus, setConnectionStatus] =
    useState<DashboardRealtimeStatus>("connecting");

  useEffect(() => {
    onInvalidatedRef.current = onInvalidated;
  }, [onInvalidated]);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let startPromise: Promise<void> | null = null;

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

      setConnectionStatus("reconnecting");

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

    const ensureStarted = async () => {
      if (startPromise) {
        await startPromise;
        return;
      }
      if (connection.state !== HubConnectionState.Disconnected) return;

      const pendingStart = connection.start();
      startPromise = pendingStart;
      try {
        await pendingStart;
      } finally {
        if (startPromise === pendingStart) startPromise = null;
      }
    };

    const connectAndJoin = async (
      pendingStatus: Extract<
        DashboardRealtimeStatus,
        "connecting" | "reconnecting"
      > = retryAttempt > 0 ? "reconnecting" : "connecting",
    ) => {
      if (!disposed) {
        setConnectionStatus(pendingStatus);
      }
      try {
        await ensureStarted();
        if (disposed) return;

        await joinGroup();
        retryAttempt = 0;
        setConnectionStatus("connected");
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

    connection.onreconnecting(() => {
      if (!disposed) setConnectionStatus("reconnecting");
    });

    connection.onreconnected(() => {
      void connectAndJoin("reconnecting").then(() => {
        if (!retryTimer) {
          triggerInvalidated({
            scope,
            organizationId,
            storeId,
            reason: "Reconnected",
          });
        }
      });
    });

    connection.onclose(() => {
      if (!disposed) setConnectionStatus("disconnected");
      scheduleConnectionRetry();
    });

    void connectAndJoin();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      connection.off("DashboardInvalidated");
      const pendingStart = startPromise;
      void (async () => {
        if (pendingStart) {
          try {
            await pendingStart;
          } catch {
            // A failed start still needs a best-effort stop below.
          }
        }
        try {
          await connection.stop();
        } catch {
          // Cleanup must not create an unhandled rejection during unmount.
        }
      })();
    };
  }, [enabled, organizationId, scope, storeId]);

  return enabled ? connectionStatus : "disconnected";
}
