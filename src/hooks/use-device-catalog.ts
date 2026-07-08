"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";

import {
  getDeviceCatalogErrorMessage,
  listDeviceModels,
  listDeviceTypes,
} from "@/lib/services/device-catalog";
import type {
  DeviceModelResult,
  DeviceTypeResult,
} from "@/types/device-catalog";

export type DeviceTypeStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function useDeviceCatalog(open: boolean) {
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
        setSelectedTypeId((current) =>
          current !== null && result.some((type) => type.id === current)
            ? current
            : (result[0]?.id ?? null),
        );
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
    [status, typeSearch],
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
    setTypeSearch,
    setModelSearch,
    setStatus,
    selectType: (typeId: number) => {
      setSelectedTypeId(typeId);
      setModelSearch("");
    },
    retryTypes: () => void loadTypes(),
    retryModels: () => void loadModels(),
  };
}
