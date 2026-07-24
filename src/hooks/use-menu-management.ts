"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getMenuById,
  getMenuManagementErrorMessage,
  getProductById,
  listManagementMenus,
  listManagementProducts,
  setMenuItemStatus,
  setMenuStatus,
  setProductAvailability,
  setProductVariantAvailability,
} from "@/lib/services/menu-management";
import type {
  MenuItemResult,
  MenuItemStatus,
  MenuManagementPagination,
  MenuManagementQuery,
  MenuResult,
  MenuStatus,
  ProductResult,
  ProductVariantResult,
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

export interface MenuCollectionState<T> {
  data: T[];
  pagination: MenuManagementPagination;
  isLoading: boolean;
  errorMessage: string | null;
}

export type CatalogManagementAction =
  | {
      kind: "product-availability";
      productId: string;
      label: string;
      nextAvailable: boolean;
    }
  | {
      kind: "variant-availability";
      productId: string;
      variantId: string;
      label: string;
      nextAvailable: boolean;
    }
  | {
      kind: "menu-status";
      menuId: string;
      label: string;
      nextStatus: MenuStatus;
    }
  | {
      kind: "menu-item-status";
      menuId: string;
      menuItemId: string;
      label: string;
      nextStatus: MenuItemStatus;
    };

export interface UseMenuManagementResult {
  searchTerm: string;
  products: MenuCollectionState<ProductResult>;
  menus: MenuCollectionState<MenuResult>;
  selectedProduct: ProductResult | null;
  selectedMenu: MenuResult | null;
  pendingAction: CatalogManagementAction | null;
  isProductDetailOpen: boolean;
  isProductDetailLoading: boolean;
  productDetailError: string | null;
  isMenuDetailOpen: boolean;
  isMenuDetailLoading: boolean;
  menuDetailError: string | null;
  isActionDialogOpen: boolean;
  productActionId: string | null;
  variantActionId: string | null;
  menuActionId: string | null;
  menuItemActionId: string | null;
  actionError: string | null;
  setSearchTerm: (value: string) => void;
  clearSearch: () => void;
  previousProductsPage: () => void;
  nextProductsPage: () => void;
  previousMenusPage: () => void;
  nextMenusPage: () => void;
  refresh: (propagateError?: boolean) => Promise<void>;
  openProductDetail: (
    productId: string,
    propagateError?: boolean,
  ) => Promise<void>;
  setProductDetailOpen: (open: boolean) => void;
  openMenuDetail: (menuId: string, propagateError?: boolean) => Promise<void>;
  setMenuDetailOpen: (open: boolean) => void;
  requestProductAvailability: (product: ProductResult) => void;
  requestVariantAvailability: (variant: ProductVariantResult) => void;
  requestMenuStatus: (menu: MenuResult, status: MenuStatus) => void;
  requestMenuItemStatus: (item: MenuItemResult, status: MenuItemStatus) => void;
  setActionDialogOpen: (open: boolean) => void;
  confirmAction: () => Promise<void>;
}

export function useMenuManagement(organizationId: string | null): UseMenuManagementResult {
  const [searchTerm, setSearchTermValue] = useState("");
  const [productsPage, setProductsPage] = useState(1);
  const [menusPage, setMenusPage] = useState(1);
  const [products, setProducts] = useState<MenuCollectionState<ProductResult>>({
    data: [],
    pagination: emptyPagination(),
    isLoading: true,
    errorMessage: null,
  });
  const [menus, setMenus] = useState<MenuCollectionState<MenuResult>>({
    data: [],
    pagination: emptyPagination(),
    isLoading: true,
    errorMessage: null,
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuResult | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isProductDetailLoading, setIsProductDetailLoading] = useState(false);
  const [productDetailError, setProductDetailError] = useState<string | null>(null);
  const [isMenuDetailOpen, setIsMenuDetailOpen] = useState(false);
  const [isMenuDetailLoading, setIsMenuDetailLoading] = useState(false);
  const [menuDetailError, setMenuDetailError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<CatalogManagementAction | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [productActionId, setProductActionId] = useState<string | null>(null);
  const [variantActionId, setVariantActionId] = useState<string | null>(null);
  const [menuActionId, setMenuActionId] = useState<string | null>(null);
  const [menuItemActionId, setMenuItemActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (signal?: AbortSignal, propagateError = false) => {
      setProducts((current) => ({ ...current, isLoading: true, errorMessage: null }));

      const query: MenuManagementQuery = {
        organizationId: organizationId ?? undefined,
        searchTerm,
        pageNumber: productsPage,
        pageSize: PAGE_SIZE,
      };

      try {
        const result = await listManagementProducts(query, signal);
        if (signal?.aborted) {
          return;
        }

        setProducts({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setProducts({
          data: [],
          pagination: emptyPagination(productsPage),
          isLoading: false,
          errorMessage: getMenuManagementErrorMessage(error, "danh mục sản phẩm"),
        });
        if (propagateError) {
          throw error;
        }
      }
    },
    [organizationId, productsPage, searchTerm]
  );

  const fetchMenus = useCallback(
    async (signal?: AbortSignal, propagateError = false) => {
      setMenus((current) => ({ ...current, isLoading: true, errorMessage: null }));

      const query: MenuManagementQuery = {
        organizationId: organizationId ?? undefined,
        searchTerm,
        pageNumber: menusPage,
        pageSize: PAGE_SIZE,
      };

      try {
        const result = await listManagementMenus(query, signal);
        if (signal?.aborted) {
          return;
        }

        setMenus({
          data: result.data ?? [],
          pagination: result.pagination,
          isLoading: false,
          errorMessage: null,
        });
      } catch (error) {
        if (axios.isCancel(error) || signal?.aborted) {
          return;
        }

        setMenus({
          data: [],
          pagination: emptyPagination(menusPage),
          isLoading: false,
          errorMessage: getMenuManagementErrorMessage(error, "danh sách thực đơn"),
        });
        if (propagateError) {
          throw error;
        }
      }
    },
    [menusPage, organizationId, searchTerm]
  );

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchProducts(abortController.signal),
      searchTerm ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchProducts, organizationId, searchTerm]);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchMenus(abortController.signal),
      searchTerm ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchMenus, organizationId, searchTerm]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProductsPage(1);
      setMenusPage(1);
      setSelectedProduct(null);
      setSelectedMenu(null);
      setIsProductDetailOpen(false);
      setIsMenuDetailOpen(false);
      setPendingAction(null);
      setIsActionDialogOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [organizationId]);

  const setSearchTerm = useCallback((value: string) => {
    setSearchTermValue(value);
    setProductsPage(1);
    setMenusPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTermValue("");
    setProductsPage(1);
    setMenusPage(1);
  }, []);

  const openProductDetail = useCallback(async (
    productId: string,
    propagateError = false,
  ) => {
    setIsProductDetailOpen(true);
    setIsProductDetailLoading(true);
    setProductDetailError(null);
    setSelectedProduct(null);

    try {
      if (!organizationId) throw new Error("Vui lòng chọn tổ chức trước khi xem sản phẩm.");
      setSelectedProduct(await getProductById(organizationId, productId));
    } catch (error) {
      setProductDetailError(
        getMenuManagementErrorMessage(error, "chi tiết sản phẩm")
      );
      if (propagateError) {
        throw error;
      }
    } finally {
      setIsProductDetailLoading(false);
    }
  }, [organizationId]);

  const setProductDetailOpen = useCallback((open: boolean) => {
    setIsProductDetailOpen(open);
    if (!open) {
      setSelectedProduct(null);
      setProductDetailError(null);
    }
  }, []);

  const openMenuDetail = useCallback(async (
    menuId: string,
    propagateError = false,
  ) => {
    setIsMenuDetailOpen(true);
    setIsMenuDetailLoading(true);
    setMenuDetailError(null);
    setSelectedMenu(null);

    try {
      if (!organizationId) throw new Error("Vui lòng chọn tổ chức trước khi xem thực đơn.");
      setSelectedMenu(await getMenuById(organizationId, menuId));
    } catch (error) {
      setMenuDetailError(getMenuManagementErrorMessage(error, "chi tiết thực đơn"));
      if (propagateError) {
        throw error;
      }
    } finally {
      setIsMenuDetailLoading(false);
    }
  }, [organizationId]);

  const setMenuDetailOpen = useCallback((open: boolean) => {
    setIsMenuDetailOpen(open);
    if (!open) {
      setSelectedMenu(null);
      setMenuDetailError(null);
    }
  }, []);

  const openActionDialog = useCallback((action: CatalogManagementAction) => {
    setPendingAction(action);
    setActionError(null);
    setIsActionDialogOpen(true);
  }, []);

  const requestProductAvailability = useCallback(
    (product: ProductResult) => {
      openActionDialog({
        kind: "product-availability",
        productId: product.id,
        label: product.displayName?.trim() || product.name,
        nextAvailable: !product.isAvailable,
      });
    },
    [openActionDialog]
  );

  const requestVariantAvailability = useCallback(
    (variant: ProductVariantResult) => {
      openActionDialog({
        kind: "variant-availability",
        productId: variant.productId,
        variantId: variant.id,
        label: variant.displayName?.trim() || variant.name,
        nextAvailable: !variant.isAvailable,
      });
    },
    [openActionDialog]
  );

  const requestMenuStatus = useCallback(
    async (menu: MenuResult, status: MenuStatus) => {
      if (status === "Active") {
        const productCache = new Map(products.data.map((product) => [product.id, product]));
        const candidates = menu.items.filter(
          (item) => item.status === "Active" && !item.recipeId,
        );

        try {
          for (const item of candidates) {
            const product =
              productCache.get(item.productId) ??
              (organizationId ? await getProductById(organizationId, item.productId) : null);
            if (!product) {
              toast.error("Vui lòng chọn tổ chức trước khi kiểm tra thực đơn.");
              return;
            }
            productCache.set(product.id, product);
            const variant = product.variants.find(
              (productVariant) => productVariant.id === item.productVariantId,
            );
            if (variant?.fulfillmentType === "MachineProduced") {
              toast.error(
                `Không thể kích hoạt: món ${item.displayName} là món sản xuất bằng máy nhưng chưa có công thức.`,
              );
              return;
            }
          }
        } catch (error) {
          toast.error(
            getMenuManagementErrorMessage(error, "điều kiện bán của thực đơn"),
          );
          return;
        }
      }

      openActionDialog({
        kind: "menu-status",
        menuId: menu.id,
        label: menu.name,
        nextStatus: status,
      });
    },
    [openActionDialog, organizationId, products.data]
  );

  const requestMenuItemStatus = useCallback(
    async (item: MenuItemResult, status: MenuItemStatus) => {
      if (status === "Active" && !item.recipeId) {
        try {
          const product =
            products.data.find((candidate) => candidate.id === item.productId) ??
            (organizationId ? await getProductById(organizationId, item.productId) : null);
          if (!product) {
            toast.error("Vui lòng chọn tổ chức trước khi kiểm tra món.");
            return;
          }
          const variant = product.variants.find(
            (candidate) => candidate.id === item.productVariantId,
          );
          if (variant?.fulfillmentType === "MachineProduced") {
            toast.error(
              "Không thể bật bán món sản xuất bằng máy khi chưa có công thức hợp lệ.",
            );
            return;
          }
        } catch (error) {
          toast.error(getMenuManagementErrorMessage(error, "điều kiện bán của món"));
          return;
        }
      }

      openActionDialog({
        kind: "menu-item-status",
        menuId: item.menuId,
        menuItemId: item.id,
        label: item.displayName,
        nextStatus: status,
      });
    },
    [openActionDialog, organizationId, products.data]
  );

  const setActionDialogOpen = useCallback(
    (open: boolean) => {
      const isSubmitting =
        productActionId !== null ||
        variantActionId !== null ||
        menuActionId !== null ||
        menuItemActionId !== null;

      if (!open && isSubmitting) {
        return;
      }

      setIsActionDialogOpen(open);
      if (!open) {
        setPendingAction(null);
        setActionError(null);
      }
    },
    [menuActionId, menuItemActionId, productActionId, variantActionId]
  );

  const updateProduct = useCallback((updatedProduct: ProductResult) => {
    setProducts((current) => ({
      ...current,
      data: current.data.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      ),
    }));
    setSelectedProduct((current) =>
      current?.id === updatedProduct.id ? updatedProduct : current
    );
  }, []);

  const updateVariant = useCallback((updatedVariant: ProductVariantResult) => {
    const replaceVariant = (product: ProductResult): ProductResult =>
      product.id === updatedVariant.productId
        ? {
            ...product,
            variants: product.variants.map((variant) =>
              variant.id === updatedVariant.id ? updatedVariant : variant
            ),
          }
        : product;

    setProducts((current) => ({
      ...current,
      data: current.data.map(replaceVariant),
    }));
    setSelectedProduct((current) => (current ? replaceVariant(current) : current));
  }, []);

  const updateMenu = useCallback((updatedMenu: MenuResult) => {
    setMenus((current) => ({
      ...current,
      data: current.data.map((menu) =>
        menu.id === updatedMenu.id ? updatedMenu : menu
      ),
    }));
    setSelectedMenu((current) =>
      current?.id === updatedMenu.id ? updatedMenu : current
    );
  }, []);

  const updateMenuItem = useCallback((updatedItem: MenuItemResult) => {
    const replaceItem = (menu: MenuResult): MenuResult =>
      menu.id === updatedItem.menuId
        ? {
            ...menu,
            items: menu.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          }
        : menu;

    setMenus((current) => ({
      ...current,
      data: current.data.map(replaceItem),
    }));
    setSelectedMenu((current) => (current ? replaceItem(current) : current));
  }, []);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) {
      return;
    }

    if (!organizationId) {
      setActionError("Vui lòng chọn tổ chức trước khi cập nhật dữ liệu.");
      return;
    }

    setActionError(null);

    try {
      switch (pendingAction.kind) {
        case "product-availability": {
          setProductActionId(pendingAction.productId);
          const result = await setProductAvailability(
            organizationId,
            pendingAction.productId,
            pendingAction.nextAvailable
          );
          updateProduct(result);
          const message = `Đã ${pendingAction.nextAvailable ? "bật" : "tắt"} khả dụng cho sản phẩm ${pendingAction.label}.`;
          if (pendingAction.nextAvailable) toast.success(message);
          else toast.warning(message);
          break;
        }
        case "variant-availability": {
          setVariantActionId(pendingAction.variantId);
          const result = await setProductVariantAvailability(
            organizationId,
            pendingAction.productId,
            pendingAction.variantId,
            pendingAction.nextAvailable
          );
          updateVariant(result);
          const message = `Đã ${pendingAction.nextAvailable ? "bật" : "tắt"} khả dụng cho phiên bản ${pendingAction.label}.`;
          if (pendingAction.nextAvailable) toast.success(message);
          else toast.warning(message);
          break;
        }
        case "menu-status": {
          setMenuActionId(pendingAction.menuId);
          const result = await setMenuStatus(
            organizationId,
            pendingAction.menuId,
            pendingAction.nextStatus
          );
          updateMenu(result);
          const message = `Đã cập nhật trạng thái thực đơn ${pendingAction.label}.`;
          if (pendingAction.nextStatus === "Active") toast.success(message);
          else toast.warning(message);
          break;
        }
        case "menu-item-status": {
          setMenuItemActionId(pendingAction.menuItemId);
          const result = await setMenuItemStatus(
            organizationId,
            pendingAction.menuId,
            pendingAction.menuItemId,
            pendingAction.nextStatus
          );
          updateMenuItem(result);
          const message = `Đã cập nhật trạng thái món ${pendingAction.label}.`;
          if (pendingAction.nextStatus === "Active") toast.success(message);
          else toast.warning(message);
          break;
        }
      }

      setIsActionDialogOpen(false);
      setPendingAction(null);
    } catch (error) {
      setActionError(getMenuManagementErrorMessage(error, "trạng thái dữ liệu"));
    } finally {
      setProductActionId(null);
      setVariantActionId(null);
      setMenuActionId(null);
      setMenuItemActionId(null);
    }
  }, [organizationId, pendingAction, updateMenu, updateMenuItem, updateProduct, updateVariant]);

  return {
    searchTerm,
    products: organizationId
      ? products
      : { data: [], pagination: emptyPagination(), isLoading: false, errorMessage: null },
    menus: organizationId
      ? menus
      : { data: [], pagination: emptyPagination(), isLoading: false, errorMessage: null },
    selectedProduct,
    selectedMenu,
    pendingAction,
    isProductDetailOpen,
    isProductDetailLoading,
    productDetailError,
    isMenuDetailOpen,
    isMenuDetailLoading,
    menuDetailError,
    isActionDialogOpen,
    productActionId,
    variantActionId,
    menuActionId,
    menuItemActionId,
    actionError,
    setSearchTerm,
    clearSearch,
    previousProductsPage: () => setProductsPage((page) => Math.max(page - 1, 1)),
    nextProductsPage: () => setProductsPage((page) => page + 1),
    previousMenusPage: () => setMenusPage((page) => Math.max(page - 1, 1)),
    nextMenusPage: () => setMenusPage((page) => page + 1),
    refresh: async (propagateError = false) => {
      if (!organizationId) return;
      await Promise.all([
        fetchProducts(undefined, propagateError),
        fetchMenus(undefined, propagateError),
      ]);
    },
    openProductDetail,
    setProductDetailOpen,
    openMenuDetail,
    setMenuDetailOpen,
    requestProductAvailability,
    requestVariantAvailability,
    requestMenuStatus,
    requestMenuItemStatus,
    setActionDialogOpen,
    confirmAction,
  };
}
