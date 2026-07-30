"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useMutationRefreshRecovery } from "@/hooks/use-mutation-refresh-recovery";
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
  const currentOrganizationIdRef = useRef(organizationId);

  useEffect(() => {
    currentOrganizationIdRef.current = organizationId;
  }, [organizationId]);

  const load = useCallback(async (
    signal?: AbortSignal,
    propagateError = false,
    targetOrganizationId = organizationId,
  ) => {
    if (targetOrganizationId !== currentOrganizationIdRef.current) return;
    if (!enabled) { setItems([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const page = await listNotificationDeliveries(targetOrganizationId, undefined, signal);
      if (!signal?.aborted && targetOrganizationId === currentOrganizationIdRef.current) {
        setItems(page.data ?? []);
        setErrorMessage(null);
      }
    } catch (error) {
      if (!signal?.aborted && targetOrganizationId === currentOrganizationIdRef.current) {
        if (propagateError) throw error;
        setErrorMessage(getNotificationDeliveryErrorMessage(error, "Không thể tải trạng thái gửi thông báo."));
      }
    } finally {
      if (!signal?.aborted && targetOrganizationId === currentOrganizationIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, organizationId]);

  const refreshRecovery = useMutationRefreshRecovery(
    (targetOrganizationId: string) => load(undefined, true, targetOrganizationId),
    "Thao tác đã thành công nhưng danh sách gửi thông báo chưa tải lại được.",
  );

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
    const targetOrganizationId = organizationId;
    try {
      const result = await requeueNotificationDelivery(targetOrganizationId, deliveryId, reason);
      toast.success("Đã đưa thông báo vào hàng đợi lại.");
      await refreshRecovery.runRefresh(targetOrganizationId);
      return result;
    } catch (error) {
      if (targetOrganizationId === currentOrganizationIdRef.current) {
        setErrorMessage(getNotificationDeliveryErrorMessage(error));
      }
      return null;
    } finally {
      mutationRef.current = false;
      setIsMutating(false);
    }
  }, [organizationId, refreshRecovery]);

  return {
    items,
    isLoading,
    isMutating,
    errorMessage,
    refreshWarningMessage: refreshRecovery.refreshWarningMessage,
    isRefreshRetrying: refreshRecovery.isRefreshRetrying,
    retryRefresh: refreshRecovery.retryRefresh,
    refresh: () => load(),
    requeue,
  };
}
