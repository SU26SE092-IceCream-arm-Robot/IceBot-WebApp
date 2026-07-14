"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  createManagementKiosk,
  getKioskManagementErrorMessage,
} from "@/lib/services/kiosk-management";
import { listManagementOrganizations } from "@/lib/services/organizations";
import { getManagementStores, getStoresErrorMessage } from "@/lib/services/stores";
import type {
  CreateKioskRequest,
  StoreResult,
} from "@/types/kiosk-management";
import type { OrganizationResult } from "@/types/tenant-management";

interface UseCreateKioskOptions {
  onCreated: () => Promise<void> | void;
}

export interface UseCreateKioskResult {
  errorMessage: string | null;
  isLoadingOptions: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  organizations: OrganizationResult[];
  stores: StoreResult[];
  open: () => void;
  retryOptions: () => void;
  setOpen: (open: boolean) => void;
  submit: (storeId: string, request: CreateKioskRequest) => Promise<boolean>;
}

export function useCreateKiosk({
  onCreated,
}: UseCreateKioskOptions): UseCreateKioskResult {
  const [isOpen, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [isLoadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [optionsVersion, setOptionsVersion] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoadingOptions(true);
      setErrorMessage(null);

      void Promise.allSettled([
        listManagementOrganizations(
          { status: "Active", pageNumber: 1, pageSize: 100 },
          controller.signal,
        ),
        getManagementStores({ status: "Active" }, controller.signal),
      ]).then(([organizationsResult, storesResult]) => {
        if (controller.signal.aborted) return;

        const messages: string[] = [];
        if (organizationsResult.status === "fulfilled") {
          setOrganizations(organizationsResult.value.data ?? []);
        } else {
          setOrganizations([]);
          messages.push("Không thể tải danh sách tổ chức.");
        }

        if (storesResult.status === "fulfilled") {
          setStores(storesResult.value);
        } else {
          setStores([]);
          messages.push(
            getStoresErrorMessage(
              storesResult.reason,
              "Không thể tải danh sách cửa hàng.",
            ),
          );
        }

        setErrorMessage(messages.length > 0 ? messages.join(" ") : null);
        setLoadingOptions(false);
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isOpen, optionsVersion]);

  const retryOptions = useCallback(() => {
    setOptionsVersion((version) => version + 1);
  }, []);

  const submit = useCallback(
    async (storeId: string, request: CreateKioskRequest) => {
      if (isSubmitting) return false;

      setSubmitting(true);
      setErrorMessage(null);
      try {
        const kiosk = await createManagementKiosk(storeId, request);
        toast.success(`Đã tạo kiosk ${kiosk.name}.`);
        setOpen(false);
        await onCreated();
        return true;
      } catch (error) {
        setErrorMessage(
          getKioskManagementErrorMessage(error, "Không thể tạo kiosk."),
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [isSubmitting, onCreated],
  );

  const open = useCallback(() => {
    setErrorMessage(null);
    setOpen(true);
  }, []);

  return useMemo(
    () => ({
      errorMessage,
      isLoadingOptions,
      isOpen,
      isSubmitting,
      organizations,
      stores,
      open,
      retryOptions,
      setOpen,
      submit,
    }),
    [
      errorMessage,
      isLoadingOptions,
      isOpen,
      isSubmitting,
      open,
      organizations,
      retryOptions,
      stores,
      submit,
    ],
  );
}
