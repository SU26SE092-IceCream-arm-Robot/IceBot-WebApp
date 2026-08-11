"use client";

import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";

import { getStoredAccessToken } from "@/lib/auth-session";
import { getOperationsHubUrl } from "@/lib/operations-hub-url";

interface InventoryChangedEvent {
  kioskId: string;
}

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 10_000;
const INVENTORY_REFRESH_DEBOUNCE_MS = 300;

export function useKioskOperationsRealtime(
  kioskIds: readonly string[],
  onInventoryChanged: () => void,
) {
  const onInventoryChangedRef = useRef(onInventoryChanged);
  const kioskKey = [...new Set(kioskIds)].sort().join(",");

  useEffect(() => {
    onInventoryChangedRef.current = onInventoryChanged;
  }, [onInventoryChanged]);

  useEffect(() => {
    const targets = kioskKey ? kioskKey.split(",") : [];
    if (targets.length === 0) return;

    const targetSet = new Set(targets);
    let disposed = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const connection = new HubConnectionBuilder()
      .withUrl(getOperationsHubUrl(), {
        accessTokenFactory: () => getStoredAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const joinTargets = async () => {
      await Promise.all(targets.map((kioskId) => connection.invoke("JoinKiosk", kioskId)));
    };

    const scheduleInventoryRefresh = () => {
      if (disposed || refreshTimer) return;

      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (!disposed) onInventoryChangedRef.current();
      }, INVENTORY_REFRESH_DEBOUNCE_MS);
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

        await joinTargets();
        retryAttempt = 0;
      } catch {
        scheduleConnectionRetry();
      }
    };

    connection.on("InventoryChanged", (event: InventoryChangedEvent) => {
      if (targetSet.has(event.kioskId)) scheduleInventoryRefresh();
    });
    connection.onreconnected(() => {
      void connectAndJoin().then(() => {
        if (!retryTimer) scheduleInventoryRefresh();
      });
    });
    connection.onclose(() => scheduleConnectionRetry());
    void connectAndJoin();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      connection.off("InventoryChanged");
      void connection.stop();
    };
  }, [kioskKey]);
}
