"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createDeviceModel,
  createDeviceType,
  getDeviceCatalogErrorMessage,
  listDeviceModels,
  listDeviceTypes,
  retireDeviceModel,
  setDeviceTypeStatus,
  updateDeviceModel,
  updateDeviceType,
} from "@/lib/services/device-catalog";
import type {
  CreateDeviceModelRequest,
  CreateDeviceTypeRequest,
  DeviceModelResult,
  DeviceTypeResult,
  UpdateDeviceModelRequest,
  UpdateDeviceTypeRequest,
} from "@/types/device-catalog";

export type DeviceTypeStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function useDeviceCatalog(open: boolean, initialTypeId?: number | null) {
  const [types, setTypes] = useState<DeviceTypeResult[]>([]);
  const [models, setModels] = useState<DeviceModelResult[]>([]);
  const [typeSearch, setTypeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [status, setStatus] = useState<DeviceTypeStatusFilter>("ALL");
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [typesLoading, setTypesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationTarget, setMutationTarget] = useState<string | null>(null);
  const mutationInFlightRef = useRef(false);

  const loadTypes = useCallback(
    async (signal?: AbortSignal) => {
      setTypesLoading(true);
      setTypesError(null);
      try {
        const result = await listDeviceTypes(
          {
            search: typeSearch,
            isActive: status === "ALL" ? undefined : status === "ACTIVE",
          },
          signal,
        );
        if (signal?.aborted) return;
        setTypes(result);
        setSelectedTypeId((current) => {
          if (current !== null && result.some((type) => type.id === current)) {
            return current;
          }
          if (
            initialTypeId !== null &&
            initialTypeId !== undefined &&
            result.some((type) => type.id === initialTypeId)
          ) {
            return initialTypeId;
          }
          return result[0]?.id ?? null;
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setTypes([]);
        setSelectedTypeId(null);
        setTypesError(
          getDeviceCatalogErrorMessage(
            error,
            "Không thể tải danh mục loại thiết bị.",
          ),
        );
      } finally {
        if (!signal?.aborted) setTypesLoading(false);
      }
    },
    [initialTypeId, status, typeSearch],
  );

  const loadModels = useCallback(
    async (signal?: AbortSignal) => {
      if (selectedTypeId === null) {
        setModels([]);
        setModelsError(null);
        setModelsLoading(false);
        return;
      }

      setModelsLoading(true);
      setModelsError(null);
      try {
        const result = await listDeviceModels(
          selectedTypeId,
          { search: modelSearch },
          signal,
        );
        if (!signal?.aborted) setModels(result);
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) return;
        setModels([]);
        setModelsError(
          getDeviceCatalogErrorMessage(
            error,
            "Không thể tải danh mục model thiết bị.",
          ),
        );
      } finally {
        if (!signal?.aborted) setModelsLoading(false);
      }
    },
    [modelSearch, selectedTypeId],
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void loadTypes(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadTypes, open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => void loadModels(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadModels, open]);

  const runMutation = useCallback(
    async (
      target: string,
      action: () => Promise<unknown>,
      refresh: () => Promise<void>,
      successMessage: string,
    ) => {
      if (mutationInFlightRef.current) return false;
      mutationInFlightRef.current = true;
      setMutationTarget(target);
      setMutationError(null);
      try {
        await action();
        toast.success(successMessage);
        await refresh();
        return true;
      } catch (error) {
        setMutationError(
          getDeviceCatalogErrorMessage(error, "Không thể xử lý danh mục thiết bị."),
        );
        return false;
      } finally {
        mutationInFlightRef.current = false;
        setMutationTarget(null);
      }
    },
    [],
  );
  const clearMutationError = useCallback(() => setMutationError(null), []);

  return {
    types,
    models,
    typeSearch,
    modelSearch,
    status,
    selectedTypeId,
    selectedType: types.find((type) => type.id === selectedTypeId) ?? null,
    typesLoading,
    modelsLoading,
    typesError,
    modelsError,
    mutationError,
    mutationTarget,
    setTypeSearch,
    setModelSearch,
    setStatus,
    selectType: (typeId: number) => {
      setSelectedTypeId(typeId);
      setModelSearch("");
    },
    retryTypes: () => void loadTypes(),
    retryModels: () => void loadModels(),
    clearMutationError,
    createType: (request: CreateDeviceTypeRequest) =>
      runMutation(
        "new-type",
        () => createDeviceType(request),
        () => loadTypes(),
        "Đã tạo loại thiết bị.",
      ),
    updateType: (deviceTypeId: number, request: UpdateDeviceTypeRequest) =>
      runMutation(
        `type:${deviceTypeId}`,
        () => updateDeviceType(deviceTypeId, request),
        () => loadTypes(),
        "Đã cập nhật loại thiết bị.",
      ),
    setTypeStatus: (deviceType: DeviceTypeResult) =>
      runMutation(
        `type:${deviceType.id}`,
        () => setDeviceTypeStatus(deviceType.id, !deviceType.isActive),
        () => loadTypes(),
        deviceType.isActive
          ? "Đã tắt loại thiết bị."
          : "Đã kích hoạt loại thiết bị.",
      ),
    createModel: (deviceTypeId: number, request: CreateDeviceModelRequest) =>
      runMutation(
        "new-model",
        () => createDeviceModel(deviceTypeId, request),
        () => loadModels(),
        "Đã tạo model thiết bị.",
      ),
    updateModel: (deviceModelId: string, request: UpdateDeviceModelRequest) =>
      runMutation(
        `model:${deviceModelId}`,
        () => updateDeviceModel(deviceModelId, request),
        () => loadModels(),
        "Đã cập nhật model thiết bị.",
      ),
    retireModel: (deviceModel: DeviceModelResult) =>
      runMutation(
        `model:${deviceModel.id}`,
        () => retireDeviceModel(deviceModel.id),
        () => loadModels(),
        "Đã ngừng sử dụng model thiết bị.",
      ),
  };
}
