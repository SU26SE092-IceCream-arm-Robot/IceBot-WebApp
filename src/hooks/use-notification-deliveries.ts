"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getNotificationDeliveryErrorMessage,
  listNotificationDeliveries,
  requeueNotificationDelivery,
} from "@/lib/services/notification-deliveries";
import type { NotificationDeliveryResult } from "@/types/notification-deliveries";

export function useNotificationDeliveries(organizationId: string, enabled: boolean) {
  const [items, setItems] = useState<NotificationDeliveryResult[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutationRef = useRef(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) { setItems([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const page = await listNotificationDeliveries(organizationId, undefined, signal);
      if (!signal?.aborted) { setItems(page.data ?? []); setErrorMessage(null); }
    } catch (error) {
      if (!signal?.aborted) setErrorMessage(getNotificationDeliveryErrorMessage(error, "Unable to load notification delivery status."));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [enabled, organizationId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void load(controller.signal), 0);
    return () => { window.clearTimeout(timeoutId); controller.abort(); };
  }, [load]);

  const requeue = useCallback(async (deliveryId: string, reason: string) => {
    if (mutationRef.current) return null;
    mutationRef.current = true;
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const result = await requeueNotificationDelivery(organizationId, deliveryId, reason);
      toast.success("Notification delivery has been requeued.");
      await load();
      return result;
    } catch (error) {
      setErrorMessage(getNotificationDeliveryErrorMessage(error));
      return null;
    } finally {
      mutationRef.current = false;
      setIsMutating(false);
    }
  }, [load, organizationId]);

  return { items, isLoading, isMutating, errorMessage, refresh: () => load(), requeue };
}
