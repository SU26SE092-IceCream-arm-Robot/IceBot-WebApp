"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { useMutationRefreshRecovery } from "@/hooks/use-mutation-refresh-recovery";
import {
  createDispenserState,
  getInventoryErrorMessage,
  listDispenserStates,
  rebindDispenserState,
  setDispenserStateStatus,
  updateDispenserState,
} from "@/lib/services/inventory";
import {
  getIngredientsErrorMessage,
  listIngredients,
} from "@/lib/services/ingredients";
import type { IngredientResult } from "@/types/ingredients";
import type {
  CreateDispenserStateRequest,
  DispenserStateResult,
  RebindDispenserStateRequest,
  SetDispenserStateStatusRequest,
  UpdateDispenserStateRequest,
} from "@/types/inventory-management";

export function useInventoryTopologyOperations(
  kioskId: string | null,
  refreshInventoryEvidence: () => Promise<void>,
) {
  const mutationInFlightRef = useRef(false);
  const [ingredients, setIngredients] = useState<IngredientResult[]>([]);
  const [dispenserStates, setDispenserStates] = useState<DispenserStateResult[]>([]);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [lookupErrorMessage, setLookupErrorMessage] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null);

  const refreshRecovery = useMutationRefreshRecovery(
    async () => refreshInventoryEvidence(),
    "Thao tác đã thành công nhưng dữ liệu topology mới chưa tải lại được.",
  );

  const loadResources = useCallback(async () => {
    if (!kioskId) return [];
    setIsLoadingIngredients(true);
    setLookupErrorMessage(null);
    try {
      const [ingredientResult, stateResult] = await Promise.all([
        listIngredients({
          isActive: true,
          pageNumber: 1,
          pageSize: 100,
        }),
        listDispenserStates({ kioskId, pageNumber: 1, pageSize: 100 }),
      ]);
      const nextStates = stateResult.data ?? [];
      setIngredients(ingredientResult.data ?? []);
      setDispenserStates(nextStates);
      return nextStates;
    } catch (error) {
      setIngredients([]);
      setDispenserStates([]);
      setLookupErrorMessage(
        getInventoryErrorMessage(
          error,
          getIngredientsErrorMessage(
            error,
            "Không thể tải tài nguyên cấu hình tồn kho.",
          ),
        ),
      );
      return [];
    } finally {
      setIsLoadingIngredients(false);
    }
  }, [kioskId]);

  const runMutation = useCallback(
    async <T,>(mutation: () => Promise<T>, successMessage: string) => {
      if (!kioskId || mutationInFlightRef.current) return null;
      mutationInFlightRef.current = true;
      setIsMutating(true);
      setMutationErrorMessage(null);
      try {
        const result = await mutation();
        toast.success(successMessage);
        await refreshRecovery.runRefresh(kioskId);
        return result;
      } catch (error) {
        setMutationErrorMessage(
          getInventoryErrorMessage(error, "Không thể cập nhật topology tồn kho."),
        );
        return null;
      } finally {
        mutationInFlightRef.current = false;
        setIsMutating(false);
      }
    },
    [kioskId, refreshRecovery],
  );

  const create = useCallback(
    (request: CreateDispenserStateRequest) =>
      runMutation(
        () => createDispenserState(kioskId!, request),
        "Đã tạo bộ phân phối nguyên liệu.",
      ),
    [kioskId, runMutation],
  );

  const update = useCallback(
    (dispenserStateId: string, request: UpdateDispenserStateRequest) =>
      runMutation(
        () => updateDispenserState(kioskId!, dispenserStateId, request),
        "Đã cập nhật cấu hình bộ phân phối.",
      ),
    [kioskId, runMutation],
  );

  const setStatus = useCallback(
    (dispenserStateId: string, request: SetDispenserStateStatusRequest) =>
      runMutation(
        () => setDispenserStateStatus(kioskId!, dispenserStateId, request),
        request.isActive
          ? "Đã kích hoạt lại bộ phân phối."
          : "Đã ngừng sử dụng bộ phân phối.",
      ),
    [kioskId, runMutation],
  );

  const rebind = useCallback(
    (dispenserStateId: string, request: RebindDispenserStateRequest) =>
      runMutation(
        () => rebindDispenserState(kioskId!, dispenserStateId, request),
        request.estimateDisposition === "Transfer"
          ? "Đã thay thế liên kết và chuyển lượng tồn ước tính."
          : "Đã thay thế liên kết bộ phân phối.",
      ),
    [kioskId, runMutation],
  );

  return {
    ingredients,
    dispenserStates,
    isLoadingIngredients,
    lookupErrorMessage,
    isMutating,
    mutationErrorMessage,
    refreshWarningMessage: refreshRecovery.refreshWarningMessage,
    isRefreshRetrying: refreshRecovery.isRefreshRetrying,
    loadResources,
    create,
    update,
    setStatus,
    rebind,
    retryRefresh: refreshRecovery.retryRefresh,
    clearMutationError: () => setMutationErrorMessage(null),
  };
}
