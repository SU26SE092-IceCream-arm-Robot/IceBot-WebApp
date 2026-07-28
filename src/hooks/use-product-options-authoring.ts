"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { useMutationRefreshRecovery } from "@/hooks/use-mutation-refresh-recovery";
import {
  createOptionGroup,
  createProductOption,
  deleteOptionGroup,
  deleteProductOption,
  getMenuManagementErrorMessage,
  replaceProductOptionIngredientRequirements,
  setOptionGroupStatus,
  setProductOptionAvailability,
  updateOptionGroup,
  updateProductOption,
} from "@/lib/services/menu-management";
import type {
  ReplaceProductOptionIngredientRequirementsRequest,
  UpsertOptionGroupRequest,
  UpsertProductOptionRequest,
} from "@/types/menu-management";

export function useProductOptionsAuthoring({
  organizationId,
  productId,
  onChanged,
}: {
  organizationId: string;
  productId: string;
  onChanged: () => Promise<void>;
}) {
  const mutationRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const refreshRecovery = useMutationRefreshRecovery(
    async () => onChanged(),
    "Tùy chọn đã được cập nhật nhưng chi tiết sản phẩm chưa tải lại được.",
  );

  const run = useCallback(
    async (mutation: () => Promise<unknown>, successMessage: string) => {
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await mutation();
      } catch (error) {
        setErrorMessage(
          getMenuManagementErrorMessage(error, "tùy chọn sản phẩm"),
        );
        mutationRef.current = false;
        setIsSubmitting(false);
        return false;
      }
      toast.success(successMessage);
      await refreshRecovery.runRefresh(undefined);
      mutationRef.current = false;
      setIsSubmitting(false);
      return true;
    },
    [refreshRecovery],
  );

  return {
    isSubmitting,
    errorMessage,
    refreshWarningMessage: refreshRecovery.refreshWarningMessage,
    isRefreshRetrying: refreshRecovery.isRefreshRetrying,
    retryRefresh: refreshRecovery.retryRefresh,
    clearError: () => setErrorMessage(null),
    createGroup: (request: UpsertOptionGroupRequest) =>
      run(
        () => createOptionGroup(organizationId, productId, request),
        "Đã tạo nhóm tùy chọn.",
      ),
    updateGroup: (groupId: number, request: UpsertOptionGroupRequest) =>
      run(
        () => updateOptionGroup(organizationId, productId, groupId, request),
        "Đã cập nhật nhóm tùy chọn.",
      ),
    toggleGroup: (groupId: number, isActive: boolean) =>
      run(
        () =>
          setOptionGroupStatus(organizationId, productId, groupId, isActive),
        isActive ? "Đã kích hoạt nhóm tùy chọn." : "Đã tắt nhóm tùy chọn.",
      ),
    deleteGroup: (groupId: number) =>
      run(
        () => deleteOptionGroup(organizationId, productId, groupId),
        "Đã xóa nhóm tùy chọn.",
      ),
    createOption: (groupId: number, request: UpsertProductOptionRequest) =>
      run(
        () => createProductOption(organizationId, productId, groupId, request),
        "Đã tạo tùy chọn.",
      ),
    updateOption: (
      groupId: number,
      optionId: string,
      request: UpsertProductOptionRequest,
    ) =>
      run(
        () =>
          updateProductOption(
            organizationId,
            productId,
            groupId,
            optionId,
            request,
          ),
        "Đã cập nhật tùy chọn.",
      ),
    toggleOption: (groupId: number, optionId: string, isAvailable: boolean) =>
      run(
        () =>
          setProductOptionAvailability(
            organizationId,
            productId,
            groupId,
            optionId,
            isAvailable,
          ),
        isAvailable ? "Đã bật tùy chọn." : "Đã tắt tùy chọn.",
      ),
    deleteOption: (groupId: number, optionId: string) =>
      run(
        () => deleteProductOption(organizationId, productId, groupId, optionId),
        "Đã xóa tùy chọn.",
      ),
    replaceRequirements: (
      groupId: number,
      optionId: string,
      request: ReplaceProductOptionIngredientRequirementsRequest,
    ) =>
      run(
        () =>
          replaceProductOptionIngredientRequirements(
            organizationId,
            productId,
            groupId,
            optionId,
            request,
          ),
        "Đã cập nhật nguyên liệu thực thi của tùy chọn.",
      ),
  };
}
