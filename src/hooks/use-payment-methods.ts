import { useState, useCallback, useEffect } from "react";
import { getPaymentMethods, setPaymentMethodStatus } from "@/lib/services/payments";
import type { PaymentMethodResult } from "@/types/payments";
import { toast } from "sonner";

type LoadingState = "IDLE" | "LOADING" | "ERROR" | "SUCCESS";

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodResult[]>([]);
  const [state, setState] = useState<LoadingState>("LOADING");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchMethods = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const data = await getPaymentMethods(signal);
      if (signal?.aborted) return;
      setMethods(data);
      setState("SUCCESS");
    } catch (err: unknown) {
      if (signal?.aborted) return;
      setState("ERROR");
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Có lỗi xảy ra khi tải danh sách phương thức thanh toán.");
      }
    }
  }, []);

  const updateStatus = useCallback(async (id: number, isActive: boolean) => {
    try {
      setUpdatingId(id);
      const updated = await setPaymentMethodStatus(id, isActive);
      setMethods((prev) => prev.map((m) => (m.id === id ? updated : m)));
      toast.success("Cập nhật trạng thái thành công!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Cập nhật trạng thái thất bại.");
      }
      throw err;
    } finally {
      setUpdatingId(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMethods(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchMethods]);

  return {
    methods,
    state,
    error,
    updatingId,
    refresh: () => {
      setState("LOADING");
      void fetchMethods();
    },
    updateStatus,
  };
}
