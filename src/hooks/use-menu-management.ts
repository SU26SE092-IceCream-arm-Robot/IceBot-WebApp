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
  refresh: () => Promise<void>;
  openProductDetail: (productId: string) => Promise<void>;
  setProductDetailOpen: (open: boolean) => void;
  openMenuDetail: (menuId: string) => Promise<void>;
  setMenuDetailOpen: (open: boolean) => void;
  requestProductAvailability: (product: ProductResult) => void;
  requestVariantAvailability: (variant: ProductVariantResult) => void;
  requestMenuStatus: (menu: MenuResult, status: MenuStatus) => void;
  requestMenuItemStatus: (item: MenuItemResult, status: MenuItemStatus) => void;
  setActionDialogOpen: (open: boolean) => void;
  confirmAction: () => Promise<void>;
}

export function useMenuManagement(): UseMenuManagementResult {
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
    async (signal?: AbortSignal) => {
      setProducts((current) => ({ ...current, isLoading: true, errorMessage: null }));

      const query: MenuManagementQuery = {
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
      }
    },
    [productsPage, searchTerm]
  );

  const fetchMenus = useCallback(
    async (signal?: AbortSignal) => {
      setMenus((current) => ({ ...current, isLoading: true, errorMessage: null }));

      const query: MenuManagementQuery = {
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
      }
    },
    [menusPage, searchTerm]
  );

  useEffect(() => {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchProducts(abortController.signal),
      searchTerm ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchProducts, searchTerm]);

  useEffect(() => {
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => void fetchMenus(abortController.signal),
      searchTerm ? 250 : 0
    );

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fetchMenus, searchTerm]);

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

  const openProductDetail = useCallback(async (productId: string) => {
    setIsProductDetailOpen(true);
    setIsProductDetailLoading(true);
    setProductDetailError(null);
    setSelectedProduct(null);

    try {
      setSelectedProduct(await getProductById(productId));
    } catch (error) {
      setProductDetailError(
        getMenuManagementErrorMessage(error, "chi tiết sản phẩm")
      );
    } finally {
      setIsProductDetailLoading(false);
    }
  }, []);

  const setProductDetailOpen = useCallback((open: boolean) => {
    setIsProductDetailOpen(open);
    if (!open) {
      setSelectedProduct(null);
      setProductDetailError(null);
    }
  }, []);

  const openMenuDetail = useCallback(async (menuId: string) => {
    setIsMenuDetailOpen(true);
    setIsMenuDetailLoading(true);
    setMenuDetailError(null);
    setSelectedMenu(null);

    try {
      setSelectedMenu(await getMenuById(menuId));
    } catch (error) {
      setMenuDetailError(getMenuManagementErrorMessage(error, "chi tiết thực đơn"));
    } finally {
      setIsMenuDetailLoading(false);
    }
  }, []);

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
              (await getProductById(item.productId));
            productCache.set(product.id, product);
            const variant = product.variants.find(
              (productVariant) => productVariant.id === item.productVariantId,
            );
            if (variant?.fulfillmentType === "MachineProduced") {
              toast.error(
                `Không thể kích hoạt: món ${item.displayName} là MachineProduced nhưng chưa có Recipe.`,
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
    [openActionDialog, products.data]
  );

  const requestMenuItemStatus = useCallback(
    async (item: MenuItemResult, status: MenuItemStatus) => {
      if (status === "Active" && !item.recipeId) {
        try {
          const product =
            products.data.find((candidate) => candidate.id === item.productId) ??
            await getProductById(item.productId);
          const variant = product.variants.find(
            (candidate) => candidate.id === item.productVariantId,
          );
          if (variant?.fulfillmentType === "MachineProduced") {
            toast.error(
              "Không thể bật bán món MachineProduced khi chưa có Recipe hợp lệ.",
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
    [openActionDialog, products.data]
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

    setActionError(null);

    try {
      switch (pendingAction.kind) {
        case "product-availability": {
          setProductActionId(pendingAction.productId);
          const result = await setProductAvailability(
            pendingAction.productId,
            pendingAction.nextAvailable
          );
          updateProduct(result);
          toast.success(
            `Đã ${pendingAction.nextAvailable ? "bật" : "tắt"} khả dụng cho sản phẩm ${pendingAction.label}.`
          );
          break;
        }
        case "variant-availability": {
          setVariantActionId(pendingAction.variantId);
          const result = await setProductVariantAvailability(
            pendingAction.productId,
            pendingAction.variantId,
            pendingAction.nextAvailable
          );
          updateVariant(result);
          toast.success(
            `Đã ${pendingAction.nextAvailable ? "bật" : "tắt"} khả dụng cho biến thể ${pendingAction.label}.`
          );
          break;
        }
        case "menu-status": {
          setMenuActionId(pendingAction.menuId);
          const result = await setMenuStatus(
            pendingAction.menuId,
            pendingAction.nextStatus
          );
          updateMenu(result);
          toast.success(`Đã cập nhật trạng thái thực đơn ${pendingAction.label}.`);
          break;
        }
        case "menu-item-status": {
          setMenuItemActionId(pendingAction.menuItemId);
          const result = await setMenuItemStatus(
            pendingAction.menuId,
            pendingAction.menuItemId,
            pendingAction.nextStatus
          );
          updateMenuItem(result);
          toast.success(`Đã cập nhật trạng thái món ${pendingAction.label}.`);
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
  }, [pendingAction, updateMenu, updateMenuItem, updateProduct, updateVariant]);

  return {
    searchTerm,
    products,
    menus,
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
    refresh: async () => {
      await Promise.all([fetchProducts(), fetchMenus()]);
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
