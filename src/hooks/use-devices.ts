import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createManagementDevice,
  getDeviceManagementErrorMessage,
  getDevicesByKiosk,
  retireManagementDevice,
  setManagementDeviceStatus,
  updateManagementDevice,
} from "@/lib/services/devices";
import type {
  CreateDeviceRequest,
  DeviceResult,
  DeviceStatus,
  UpdateDeviceRequest,
} from "@/types/devices";

type DeviceState = "IDLE" | "LOADING" | "ERROR" | "SUCCESS";

export function useDevices(kioskId: string) {
  const [state, setState] = useState<DeviceState>("IDLE");
  const [devices, setDevices] = useState<DeviceResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const mutationInFlightRef = useRef(false);

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

  const runMutation = useCallback(
    async (
      mutation: () => Promise<DeviceResult>,
      successMessage: string,
      mode: "upsert" | "remove" = "upsert",
    ) => {
      if (mutationInFlightRef.current) return null;
      mutationInFlightRef.current = true;
      setIsMutating(true);
      setMutationErrorMessage(null);
      try {
        const result = await mutation();
        setDevices((current) =>
          mode === "remove"
            ? current.filter((item) => item.id !== result.id)
            : current.some((item) => item.id === result.id)
              ? current.map((item) => (item.id === result.id ? result : item))
              : [result, ...current],
        );
        toast.success(successMessage);
        return result;
      } catch (error) {
        const message = getDeviceManagementErrorMessage(error);
        setMutationErrorMessage(message);
        toast.error(message);
        return null;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutating(false);
      }
    },
    [],
  );

  const createDevice = useCallback(
    (request: CreateDeviceRequest) =>
      runMutation(
        () => createManagementDevice(kioskId, request),
        "Đã tạo thiết bị.",
      ),
    [kioskId, runMutation],
  );

  const updateDevice = useCallback(
    (deviceId: string, request: UpdateDeviceRequest) =>
      runMutation(
        () => updateManagementDevice(kioskId, deviceId, request),
        "Đã cập nhật thiết bị.",
      ),
    [kioskId, runMutation],
  );

  const setDeviceStatus = useCallback(
    (deviceId: string, status: Exclude<DeviceStatus, "Retired">) =>
      runMutation(
        () => setManagementDeviceStatus(kioskId, deviceId, { status }),
        "Đã cập nhật trạng thái thiết bị.",
      ),
    [kioskId, runMutation],
  );

  const retireDevice = useCallback(
    (deviceId: string, reason: string) =>
      runMutation(
        () => retireManagementDevice(kioskId, deviceId, reason),
        "Đã ngừng sử dụng thiết bị và topology liên quan.",
        "remove",
      ),
    [kioskId, runMutation],
  );

  return {
    state,
    devices,
    errorMessage,
    mutationErrorMessage,
    isMutating,
    createDevice,
    updateDevice,
    setDeviceStatus,
    retireDevice,
    clearMutationError: () => setMutationErrorMessage(null),
    refresh: fetchDevices,
  };
}
