"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createManagementProduct,
  createManagementProductVariant,
  deleteManagementProduct,
  deleteManagementProductVariant,
  getMenuManagementErrorMessage,
  updateManagementProduct,
  updateManagementProductVariant,
} from "@/lib/services/menu-management";
import type {
  CreateProductRequest,
  ProductResult,
  ProductVariantResult,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpsertProductVariantRequest,
} from "@/types/menu-management";
import { useMutationRefreshRecovery } from "@/hooks/use-mutation-refresh-recovery";

export type ProductDeleteTarget =
  | { kind: "product"; product: ProductResult }
  | {
      kind: "variant";
      product: ProductResult;
      variant: ProductVariantResult;
    };

export interface ProductCrudChange {
  productId: string;
  productDeleted?: boolean;
}

interface UseProductCrudOptions {
  organizationId: string | null;
  onChanged: (change: ProductCrudChange) => Promise<void>;
}

export function useProductCrud({ organizationId, onChanged }: UseProductCrudOptions) {
  const mutationRef = useRef(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResult | null>(null);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<ProductResult | null>(null);
  const [editingVariant, setEditingVariant] =
    useState<ProductVariantResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDeleteTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const refreshRecovery = useMutationRefreshRecovery(
    onChanged,
    "Sản phẩm đã được cập nhật nhưng dữ liệu mới chưa tải lại được.",
  );
  const runMutation = useCallback(
    async <T,>(
      mutation: () => Promise<T>,
      change: ProductCrudChange,
      success: string,
      tone: "success" | "warning" = "success",
    ) => {
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await mutation();
        if (tone === "warning") toast.warning(success);
        else toast.success(success);
        await refreshRecovery.runRefresh(change);
        return true;
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "dữ liệu sản phẩm"));
        return false;
      } finally {
        mutationRef.current = false;
        setIsSubmitting(false);
      }
    },
    [refreshRecovery],
  );

  const submitProductCreate = useCallback(
    async (request: CreateProductRequest) => {
      if (!organizationId) {
        setErrorMessage("Vui lòng chọn tổ chức trước khi tạo sản phẩm.");
        return false;
      }
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      let createdProduct: ProductResult;
      try {
        createdProduct = await createManagementProduct(organizationId, request);
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "sản phẩm"));
        mutationRef.current = false;
        setIsSubmitting(false);
        return false;
      }

      toast.success(`Đã tạo sản phẩm ${createdProduct.displayName || createdProduct.name}.`);
      setProductFormOpen(false);
      await refreshRecovery.runRefresh({ productId: createdProduct.id });
      mutationRef.current = false;
      setIsSubmitting(false);
      return true;
    },
    [organizationId, refreshRecovery],
  );

  const submitProductUpdate = useCallback(
    async (request: UpdateProductRequest) => {
      if (!editingProduct) return false;
      const succeeded = await runMutation(
        () => updateManagementProduct(organizationId ?? "", editingProduct.id, request),
        { productId: editingProduct.id },
        `Đã cập nhật ${editingProduct.displayName || editingProduct.name}.`,
      );
      if (succeeded) {
        setProductFormOpen(false);
        setEditingProduct(null);
      }
      return succeeded;
    },
    [editingProduct, organizationId, runMutation],
  );

  const submitVariantCreate = useCallback(
    async (request: UpsertProductVariantRequest) => {
      if (!variantProduct) return false;
      const succeeded = await runMutation(
        () => createManagementProductVariant(organizationId ?? "", variantProduct.id, request),
        { productId: variantProduct.id },
        `Đã tạo biến thể ${request.displayName || request.name}.`,
      );
      if (succeeded) {
        setVariantFormOpen(false);
        setVariantProduct(null);
      }
      return succeeded;
    },
    [organizationId, runMutation, variantProduct],
  );

  const submitVariantUpdate = useCallback(
    async (request: UpdateProductVariantRequest) => {
      if (!variantProduct || !editingVariant) return false;
      const succeeded = await runMutation(
        () =>
          updateManagementProductVariant(
            organizationId ?? "",
            variantProduct.id,
            editingVariant.id,
            request,
          ),
        { productId: variantProduct.id },
        `Đã cập nhật ${editingVariant.displayName || editingVariant.name}.`,
      );
      if (succeeded) {
        setVariantFormOpen(false);
        setVariantProduct(null);
        setEditingVariant(null);
      }
      return succeeded;
    },
    [editingVariant, organizationId, runMutation, variantProduct],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return false;
    const succeeded = await (deleteTarget.kind === "product"
      ? runMutation(
          () => deleteManagementProduct(organizationId ?? "", deleteTarget.product.id),
          { productId: deleteTarget.product.id, productDeleted: true },
          `Đã xóa sản phẩm ${deleteTarget.product.displayName || deleteTarget.product.name}.`,
          "warning",
        )
      : runMutation(
          () =>
            deleteManagementProductVariant(
              organizationId ?? "",
              deleteTarget.product.id,
              deleteTarget.variant.id,
          ),
          { productId: deleteTarget.product.id },
          `Đã xóa biến thể ${deleteTarget.variant.displayName || deleteTarget.variant.name}.`,
          "warning",
        ));
    if (succeeded) setDeleteTarget(null);
    return succeeded;
  }, [deleteTarget, organizationId, runMutation]);

  const closeDialog = (open: boolean, type: "product" | "variant") => {
    if (mutationRef.current) return;
    setErrorMessage(null);
    if (type === "product") {
      setProductFormOpen(open);
      if (!open) setEditingProduct(null);
    } else {
      setVariantFormOpen(open);
      if (!open) {
        setVariantProduct(null);
        setEditingVariant(null);
      }
    }
  };

  return {
    productFormOpen,
    editingProduct,
    variantFormOpen,
    variantProduct,
    editingVariant,
    deleteTarget,
    isSubmitting,
    errorMessage,
    refreshWarningMessage: refreshRecovery.refreshWarningMessage,
    isRefreshRetrying: refreshRecovery.isRefreshRetrying,
    retryRefresh: refreshRecovery.retryRefresh,
    openProductCreate: () => {
      setEditingProduct(null);
      setErrorMessage(null);
      setProductFormOpen(true);
    },
    openProductEdit: (product: ProductResult) => {
      setEditingProduct(product);
      setErrorMessage(null);
      setProductFormOpen(true);
    },
    setProductFormOpen: (open: boolean) => closeDialog(open, "product"),
    submitProductCreate,
    submitProductUpdate,
    openVariantCreate: (product: ProductResult) => {
      setVariantProduct(product);
      setEditingVariant(null);
      setErrorMessage(null);
      setVariantFormOpen(true);
    },
    openVariantEdit: (product: ProductResult, variant: ProductVariantResult) => {
      setVariantProduct(product);
      setEditingVariant(variant);
      setErrorMessage(null);
      setVariantFormOpen(true);
    },
    setVariantFormOpen: (open: boolean) => closeDialog(open, "variant"),
    submitVariantCreate,
    submitVariantUpdate,
    requestProductDelete: (product: ProductResult) => {
      setErrorMessage(null);
      setDeleteTarget({ kind: "product", product });
    },
    requestVariantDelete: (
      product: ProductResult,
      variant: ProductVariantResult,
    ) => {
      setErrorMessage(null);
      setDeleteTarget({ kind: "variant", product, variant });
    },
    setDeleteOpen: (open: boolean) => {
      if (!open && !mutationRef.current) {
        setDeleteTarget(null);
        setErrorMessage(null);
      }
    },
    confirmDelete,
  };
}
