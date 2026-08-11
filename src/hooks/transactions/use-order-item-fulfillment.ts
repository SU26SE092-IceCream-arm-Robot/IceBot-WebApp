"use client";

import { useCallback, useRef, useState } from "react";

import {
  getTransactionsErrorMessage,
  recordManualOrderItemFulfillment,
  setPackagedOrderItemFulfillment,
} from "@/lib/services/transactions/transactions";
import type {
  ManualFulfillmentEventType,
  OrderItemResult,
  OrderResult,
} from "@/types/transactions/transactions";

interface FulfillmentIntent {
  order: OrderResult;
  item: OrderItemResult;
}

interface SubmitFulfillmentInput {
  action: ManualFulfillmentEventType | "Fulfill" | "Fail";
  reason: string;
}

export function useOrderItemFulfillment(
  onOrderUpdated: (order: OrderResult) => void,
) {
  const inFlightRef = useRef(false);
  const eventIdRef = useRef<string | null>(null);
  const [intent, setIntent] = useState<FulfillmentIntent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = useCallback((order: OrderResult, item: OrderItemResult) => {
    eventIdRef.current = crypto.randomUUID();
    setErrorMessage(null);
    setIntent({ order, item });
  }, []);

  const setOpen = useCallback((nextOpen: boolean) => {
    if (!nextOpen && !inFlightRef.current) {
      eventIdRef.current = null;
      setErrorMessage(null);
      setIntent(null);
    }
  }, []);

  const submit = useCallback(
    async ({ action, reason }: SubmitFulfillmentInput) => {
      if (!intent || inFlightRef.current) {
        return false;
      }

      const trimmedReason = reason.trim();
      if ((action === "Failed" || action === "Fail") && !trimmedReason) {
        setErrorMessage("Vui lòng nhập lý do khi ghi nhận món thất bại.");
        return false;
      }

      const fulfillmentEventId = eventIdRef.current ?? crypto.randomUUID();
      eventIdRef.current = fulfillmentEventId;
      inFlightRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const updatedOrder =
          intent.item.fulfillmentType === "Manual"
            ? await recordManualOrderItemFulfillment(
                intent.order.id,
                intent.item.id,
                {
                  fulfillmentEventId,
                  eventType: action as ManualFulfillmentEventType,
                  reason: trimmedReason || null,
                },
              )
            : await setPackagedOrderItemFulfillment(
                intent.order.id,
                intent.item.id,
                action === "Fulfill" ? "fulfill" : "fail",
                {
                  fulfillmentEventId,
                  reason: trimmedReason || null,
                },
              );

        onOrderUpdated(updatedOrder);
        eventIdRef.current = null;
        setIntent(null);
        return true;
      } catch (error) {
        setErrorMessage(
          getTransactionsErrorMessage(
            error,
            "Không thể cập nhật tiến độ hoàn tất món.",
          ),
        );
        return false;
      } finally {
        inFlightRef.current = false;
        setIsSubmitting(false);
      }
    },
    [intent, onOrderUpdated],
  );

  return {
    intent,
    isOpen: intent !== null,
    isSubmitting,
    errorMessage,
    open,
    setOpen,
    submit,
  };
}
