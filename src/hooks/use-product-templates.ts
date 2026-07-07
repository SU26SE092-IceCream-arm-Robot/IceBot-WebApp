"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  cloneProductTemplate,
  getMenuManagementErrorMessage,
  listProductTemplates,
} from "@/lib/services/menu-management";
import type {
  MenuManagementPagination,
  ProductResult,
} from "@/types/menu-management";

const PAGE_SIZE = 6;

function emptyPagination(page = 1): MenuManagementPagination {
  return {
    page,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: page > 1,
  };
}

export function useProductTemplates({
  organizationId,
  onCloned,
}: {
  organizationId: string | null;
  onCloned: (product: ProductResult) => Promise<void>;
}) {
  const [open, setOpenState] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [templates, setTemplates] = useState<ProductResult[]>([]);
  const [pagination, setPagination] = useState<MenuManagementPagination>(emptyPagination());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cloningTemplateId, setCloningTemplateId] = useState<string | null>(null);

  const loadTemplates = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await listProductTemplates(
        { searchTerm, pageNumber: page, pageSize: PAGE_SIZE },
        signal,
      );
      if (signal?.aborted) return;
      setTemplates(result.data ?? []);
      setPagination(result.pagination);
    } catch (error) {
      if (axios.isCancel(error) || signal?.aborted) return;
      setTemplates([]);
      setPagination(emptyPagination(page));
      setErrorMessage(getMenuManagementErrorMessage(error, "danh sách mẫu sản phẩm"));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => void loadTemplates(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadTemplates, open]);

  const setOpen = useCallback((nextOpen: boolean) => {
    setOpenState(nextOpen);
    if (nextOpen) {
      setPage(1);
      setSearchTerm("");
      setErrorMessage(null);
    }
  }, []);

  const cloneTemplate = useCallback(async (template: ProductResult) => {
    if (!organizationId || cloningTemplateId) return;
    setCloningTemplateId(template.id);
    setErrorMessage(null);
    try {
      const product = await cloneProductTemplate(organizationId, {
        templateProductId: template.id,
      });
      await onCloned(product);
      toast.success(`Đã tạo sản phẩm ${product.displayName || product.name} từ mẫu.`);
      setOpenState(false);
    } catch (error) {
      setErrorMessage(getMenuManagementErrorMessage(error, "sản phẩm từ mẫu"));
    } finally {
      setCloningTemplateId(null);
    }
  }, [cloningTemplateId, onCloned, organizationId]);

  return {
    open,
    setOpen,
    searchTerm,
    setSearchTerm: (value: string) => {
      setSearchTerm(value);
      setPage(1);
    },
    templates,
    pagination,
    isLoading,
    errorMessage,
    cloningTemplateId,
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => current + 1),
    retry: () => void loadTemplates(),
    cloneTemplate,
  };
}
