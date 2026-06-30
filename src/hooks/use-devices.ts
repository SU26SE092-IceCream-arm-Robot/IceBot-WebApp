import { useCallback, useEffect, useState } from "react";

import { getDevicesByKiosk } from "@/lib/services/devices";
import type { DeviceResult } from "@/types/devices";

type DeviceState = "IDLE" | "LOADING" | "ERROR" | "SUCCESS";

export function useDevices(kioskId: string) {
  const [state, setState] = useState<DeviceState>("IDLE");
  const [devices, setDevices] = useState<DeviceResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDevices = useCallback(async (signal?: AbortSignal) => {
    if (!kioskId) return;
    
    setState("LOADING");
    setErrorMessage(null);

    try {
      const result = await getDevicesByKiosk(kioskId, signal);
      if (signal?.aborted) return;
      
      setDevices(result.data || []);
      setState("SUCCESS");
    } catch (err: unknown) {
      if (signal?.aborted) return;
      setState("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách thiết bị");
    }
  }, [kioskId]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices(controller.signal);
    return () => controller.abort();
  }, [fetchDevices]);

  return {
    state,
    devices,
    errorMessage,
    refresh: fetchDevices,
  };
}
