"use client";

import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";

import { getStoredAccessToken } from "@/lib/auth-session";
import { getOperationsHubUrl } from "@/lib/operations-hub-url";
import type {
  AlertChangedEvent,
  DeviceEventCreatedEvent,
  ExecutionReadinessChangedEvent,
  InventoryChangedEvent,
  KioskOperationalStateChangedEvent,
  KioskStatusChangedEvent,
  MaintenanceTicketChangedEvent,
  OrderItemFulfillmentChangedEvent,
} from "@/types/realtime/signalr-events";

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 10_000;
const INVENTORY_REFRESH_DEBOUNCE_MS = 300;

export interface KioskOperationsRealtimeCallbacks {
  onInventoryChanged?: (event?: InventoryChangedEvent) => void;
  onKioskStatusChanged?: (event: KioskStatusChangedEvent) => void;
  onOperationalStateChanged?: (event: KioskOperationalStateChangedEvent) => void;
  onReadinessChanged?: (event: ExecutionReadinessChangedEvent) => void;
  onAlertChanged?: (event: AlertChangedEvent) => void;
  onMaintenanceTicketChanged?: (event: MaintenanceTicketChangedEvent) => void;
  onDeviceEventCreated?: (event: DeviceEventCreatedEvent) => void;
  onOrderItemFulfillmentChanged?: (event: OrderItemFulfillmentChangedEvent) => void;
}

export interface UseKioskOperationsRealtimeOptions extends KioskOperationsRealtimeCallbacks {
  kioskIds: readonly string[];
  enabled?: boolean;
}

export function useKioskOperationsRealtime(
  kioskIds: readonly string[],
  onInventoryChanged: () => void,
): void;
export function useKioskOperationsRealtime(
  options: UseKioskOperationsRealtimeOptions,
): void;
export function useKioskOperationsRealtime(
  kioskIdsOrOptions: readonly string[] | UseKioskOperationsRealtimeOptions,
  legacyCallback?: () => void,
): void {
  const isLegacy = Array.isArray(kioskIdsOrOptions);
  const kioskIds = isLegacy ? kioskIdsOrOptions : (kioskIdsOrOptions.kioskIds ?? []);
  const enabled = isLegacy ? true : (kioskIdsOrOptions.enabled ?? true);

  const callbacks: KioskOperationsRealtimeCallbacks = isLegacy
    ? { onInventoryChanged: legacyCallback }
    : kioskIdsOrOptions;

  const callbacksRef = useRef(callbacks);
  const kioskKey = [...new Set(kioskIds)].sort().join(",");

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!enabled) return;
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

    const scheduleInventoryRefresh = (event?: InventoryChangedEvent) => {
      if (disposed || refreshTimer) return;

      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (!disposed) {
          callbacksRef.current.onInventoryChanged?.(event);
        }
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

    // Event listeners
    connection.on("InventoryChanged", (event: InventoryChangedEvent) => {
      if (targetSet.has(event?.kioskId)) scheduleInventoryRefresh(event);
    });

    connection.on("KioskStatusChanged", (event: KioskStatusChangedEvent) => {
      if (targetSet.has(event?.kioskId)) {
        callbacksRef.current.onKioskStatusChanged?.(event);
      }
    });

    connection.on("KioskOperationalStateChanged", (event: KioskOperationalStateChangedEvent) => {
      if (targetSet.has(event?.kioskId)) {
        callbacksRef.current.onOperationalStateChanged?.(event);
      }
    });

    connection.on("ExecutionReadinessChanged", (event: ExecutionReadinessChangedEvent) => {
      if (targetSet.has(event?.kioskId)) {
        callbacksRef.current.onReadinessChanged?.(event);
      }
    });

    connection.on("AlertChanged", (event: AlertChangedEvent) => {
      if (!event?.kioskId || targetSet.has(event.kioskId)) {
        callbacksRef.current.onAlertChanged?.(event);
      }
    });

    connection.on("MaintenanceTicketChanged", (event: MaintenanceTicketChangedEvent) => {
      if (!event?.kioskId || targetSet.has(event.kioskId)) {
        callbacksRef.current.onMaintenanceTicketChanged?.(event);
      }
    });

    connection.on("DeviceEventCreated", (event: DeviceEventCreatedEvent) => {
      if (targetSet.has(event?.kioskId)) {
        callbacksRef.current.onDeviceEventCreated?.(event);
      }
    });

    connection.on("OrderItemFulfillmentChanged", (event: OrderItemFulfillmentChangedEvent) => {
      if (!event?.kioskId || targetSet.has(event.kioskId)) {
        callbacksRef.current.onOrderItemFulfillmentChanged?.(event);
      }
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
      connection.off("KioskStatusChanged");
      connection.off("KioskOperationalStateChanged");
      connection.off("ExecutionReadinessChanged");
      connection.off("AlertChanged");
      connection.off("MaintenanceTicketChanged");
      connection.off("DeviceEventCreated");
      connection.off("OrderItemFulfillmentChanged");
      void connection.stop();
    };
  }, [kioskKey, enabled]);
}
