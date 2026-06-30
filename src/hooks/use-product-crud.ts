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
  onChanged: (change: ProductCrudChange) => Promise<void>;
}

export function useProductCrud({ onChanged }: UseProductCrudOptions) {
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
  const runMutation = useCallback(
    async <T,>(
      mutation: () => Promise<T>,
      change: ProductCrudChange,
      success: string,
    ) => {
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await mutation();
        await onChanged(change);
        toast.success(success);
        return true;
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "dữ liệu sản phẩm"));
        return false;
      } finally {
        mutationRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onChanged],
  );

  const submitProductCreate = useCallback(
    async (request: CreateProductRequest) => {
      let createdProduct: ProductResult | null = null;
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        createdProduct = await createManagementProduct(request);
        await onChanged({ productId: createdProduct.id });
        toast.success(`Đã tạo sản phẩm ${createdProduct.displayName || createdProduct.name}.`);
        setProductFormOpen(false);
        return true;
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "sản phẩm"));
        return false;
      } finally {
        mutationRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onChanged],
  );

  const submitProductUpdate = useCallback(
    async (request: UpdateProductRequest) => {
      if (!editingProduct) return false;
      const succeeded = await runMutation(
        () => updateManagementProduct(editingProduct.id, request),
        { productId: editingProduct.id },
        `Đã cập nhật ${editingProduct.displayName || editingProduct.name}.`,
      );
      if (succeeded) {
        setProductFormOpen(false);
        setEditingProduct(null);
      }
      return succeeded;
    },
    [editingProduct, runMutation],
  );

  const submitVariantCreate = useCallback(
    async (request: UpsertProductVariantRequest) => {
      if (!variantProduct) return false;
      const succeeded = await runMutation(
        () => createManagementProductVariant(variantProduct.id, request),
        { productId: variantProduct.id },
        `Đã tạo biến thể ${request.displayName || request.name}.`,
      );
      if (succeeded) {
        setVariantFormOpen(false);
        setVariantProduct(null);
      }
      return succeeded;
    },
    [runMutation, variantProduct],
  );

  const submitVariantUpdate = useCallback(
    async (request: UpdateProductVariantRequest) => {
      if (!variantProduct || !editingVariant) return false;
      const succeeded = await runMutation(
        () =>
          updateManagementProductVariant(
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
    [editingVariant, runMutation, variantProduct],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return false;
    const succeeded = await (deleteTarget.kind === "product"
      ? runMutation(
          () => deleteManagementProduct(deleteTarget.product.id),
          { productId: deleteTarget.product.id, productDeleted: true },
          `Đã xóa sản phẩm ${deleteTarget.product.displayName || deleteTarget.product.name}.`,
        )
      : runMutation(
          () =>
            deleteManagementProductVariant(
              deleteTarget.product.id,
              deleteTarget.variant.id,
            ),
          { productId: deleteTarget.product.id },
          `Đã xóa biến thể ${deleteTarget.variant.displayName || deleteTarget.variant.name}.`,
        ));
    if (succeeded) setDeleteTarget(null);
    return succeeded;
  }, [deleteTarget, runMutation]);

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
