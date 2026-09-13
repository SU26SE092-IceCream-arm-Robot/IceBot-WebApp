"use client";

import { HubConnectionState } from "@microsoft/signalr";
import { useEffect, useRef } from "react";

import { getOrdersHubUrl } from "@/lib/realtime/hub-urls";
import { createHubConnection } from "@/lib/realtime/signalr-client";
import type {
  OrderExecutionObservationChangedEvent,
  OrderItemFulfillmentChangedEvent,
  OrderStatusChangedEvent,
  PaymentStatusChangedEvent,
} from "@/types/realtime/signalr-events";

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 10_000;

export interface UseOrderRealtimeCallbacks {
  onOrderStatusChanged?: (event: OrderStatusChangedEvent) => void;
  onPaymentStatusChanged?: (event: PaymentStatusChangedEvent) => void;
  onOrderItemFulfillmentChanged?: (
    event: OrderItemFulfillmentChangedEvent,
  ) => void;
  onOrderExecutionObservationChanged?: (
    event: OrderExecutionObservationChangedEvent,
  ) => void;
}

export interface UseOrderRealtimeOptions extends UseOrderRealtimeCallbacks {
  orderId?: string | null;
  enabled?: boolean;
}

export function useOrderRealtime({
  orderId,
  enabled = true,
  onOrderStatusChanged,
  onPaymentStatusChanged,
  onOrderItemFulfillmentChanged,
  onOrderExecutionObservationChanged,
}: UseOrderRealtimeOptions) {
  const callbacksRef = useRef<UseOrderRealtimeCallbacks>({
    onOrderStatusChanged,
    onPaymentStatusChanged,
    onOrderItemFulfillmentChanged,
    onOrderExecutionObservationChanged,
  });

  useEffect(() => {
    callbacksRef.current = {
      onOrderStatusChanged,
      onPaymentStatusChanged,
      onOrderItemFulfillmentChanged,
      onOrderExecutionObservationChanged,
    };
  }, [
    onOrderStatusChanged,
    onPaymentStatusChanged,
    onOrderItemFulfillmentChanged,
    onOrderExecutionObservationChanged,
  ]);

  useEffect(() => {
    if (!enabled || !orderId) return;

    let disposed = false;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let startPromise: Promise<void> | null = null;

    const connection = createHubConnection({
      url: getOrdersHubUrl(),
    });

    const joinGroup = async () => {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke("JoinOrder", orderId);
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

    const connectAndJoin = async () => {
      try {
        await ensureStarted();
        if (disposed) return;

        await joinGroup();
        retryAttempt = 0;
      } catch {
        scheduleConnectionRetry();
      }
    };

    connection.on("OrderStatusChanged", (event: OrderStatusChangedEvent) => {
      if (event?.orderId === orderId) {
        callbacksRef.current.onOrderStatusChanged?.(event);
      }
    });

    connection.on(
      "PaymentStatusChanged",
      (event: PaymentStatusChangedEvent) => {
        if (event?.orderId === orderId) {
          callbacksRef.current.onPaymentStatusChanged?.(event);
        }
      },
    );

    connection.on(
      "OrderItemFulfillmentChanged",
      (event: OrderItemFulfillmentChangedEvent) => {
        if (event?.orderId === orderId) {
          callbacksRef.current.onOrderItemFulfillmentChanged?.(event);
        }
      },
    );

    connection.on(
      "OrderExecutionObservationChanged",
      (event: OrderExecutionObservationChangedEvent) => {
        if (event?.orderId === orderId) {
          callbacksRef.current.onOrderExecutionObservationChanged?.(event);
        }
      },
    );

    connection.onreconnected(() => {
      void connectAndJoin();
    });

    connection.onclose(() => scheduleConnectionRetry());

    void connectAndJoin();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      connection.off("OrderStatusChanged");
      connection.off("PaymentStatusChanged");
      connection.off("OrderItemFulfillmentChanged");
      connection.off("OrderExecutionObservationChanged");
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
  }, [orderId, enabled]);
}
