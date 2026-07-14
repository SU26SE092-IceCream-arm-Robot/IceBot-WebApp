"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import {
  createManagementMenu,
  createManagementMenuItem,
  deleteManagementMenu,
  deleteManagementMenuItem,
  getMenuManagementErrorMessage,
  updateManagementMenu,
  updateManagementMenuItem,
} from "@/lib/services/menu-management";
import type {
  CreateMenuItemRequest,
  CreateMenuRequest,
  MenuItemResult,
  MenuResult,
  UpdateMenuItemRequest,
  UpdateMenuRequest,
} from "@/types/menu-management";

export type MenuDeleteTarget =
  | { kind: "menu"; menu: MenuResult }
  | {
      kind: "menu-item";
      menu: MenuResult;
      menuItem: MenuItemResult;
    };

export interface MenuCrudChange {
  menuId: string;
  menuDeleted?: boolean;
}

interface UseMenuCrudOptions {
  organizationId: string | null;
  onChanged: (change: MenuCrudChange) => Promise<void>;
}

export function useMenuCrud({ organizationId, onChanged }: UseMenuCrudOptions) {
  const mutationRef = useRef(false);
  const [menuFormOpen, setMenuFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuResult | null>(null);
  const [menuItemFormOpen, setMenuItemFormOpen] = useState(false);
  const [menuItemMenu, setMenuItemMenu] = useState<MenuResult | null>(null);
  const [editingMenuItem, setEditingMenuItem] =
    useState<MenuItemResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuDeleteTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runMutation = useCallback(
    async <T,>(
      mutation: () => Promise<T>,
      change: MenuCrudChange,
      success: string,
      tone: "success" | "warning" = "success",
    ) => {
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await mutation();
        await onChanged(change);
        if (tone === "warning") toast.warning(success);
        else toast.success(success);
        return true;
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "dữ liệu thực đơn"));
        return false;
      } finally {
        mutationRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onChanged],
  );

  const submitMenuCreate = useCallback(
    async (request: CreateMenuRequest) => {
      if (!organizationId) {
        setErrorMessage("Vui lòng chọn tổ chức trước khi tạo thực đơn.");
        return false;
      }
      let createdMenu: MenuResult | null = null;
      if (mutationRef.current) return false;
      mutationRef.current = true;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        createdMenu = await createManagementMenu(organizationId, request);
        await onChanged({ menuId: createdMenu.id });
        toast.success(`Đã tạo thực đơn ${createdMenu.name}.`);
        setMenuFormOpen(false);
        return true;
      } catch (error) {
        setErrorMessage(getMenuManagementErrorMessage(error, "thực đơn"));
        return false;
      } finally {
        mutationRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onChanged, organizationId],
  );

  const submitMenuUpdate = useCallback(
    async (menuId: string, request: UpdateMenuRequest) => {
      const ok = await runMutation(
        () => updateManagementMenu(organizationId ?? "", menuId, request),
        { menuId },
        `Đã cập nhật thực đơn ${request.name}.`,
      );
      if (ok) setMenuFormOpen(false);
      return ok;
    },
    [organizationId, runMutation],
  );

  const submitMenuDelete = useCallback(
    async (menu: MenuResult) => {
      const ok = await runMutation(
        () => deleteManagementMenu(organizationId ?? "", menu.id),
        { menuId: menu.id, menuDeleted: true },
        `Đã xóa thực đơn ${menu.name}.`,
        "warning",
      );
      if (ok) setDeleteTarget(null);
      return ok;
    },
    [organizationId, runMutation],
  );

  const submitMenuItemCreate = useCallback(
    async (menuId: string, request: CreateMenuItemRequest) => {
      const ok = await runMutation(
        () => createManagementMenuItem(organizationId ?? "", menuId, request),
        { menuId },
        `Đã thêm món ${request.displayName}.`,
      );
      if (ok) setMenuItemFormOpen(false);
      return ok;
    },
    [organizationId, runMutation],
  );

  const submitMenuItemUpdate = useCallback(
    async (menuId: string, menuItemId: string, request: UpdateMenuItemRequest) => {
      const ok = await runMutation(
        () => updateManagementMenuItem(organizationId ?? "", menuId, menuItemId, request),
        { menuId },
        `Đã cập nhật món ${request.displayName}.`,
      );
      if (ok) setMenuItemFormOpen(false);
      return ok;
    },
    [organizationId, runMutation],
  );

  const submitMenuItemDelete = useCallback(
    async (menu: MenuResult, menuItem: MenuItemResult) => {
      const ok = await runMutation(
        () => deleteManagementMenuItem(organizationId ?? "", menu.id, menuItem.id),
        { menuId: menu.id },
        `Đã xóa món ${menuItem.displayName}.`,
        "warning",
      );
      if (ok) setDeleteTarget(null);
      return ok;
    },
    [organizationId, runMutation],
  );

  const openMenuForm = useCallback((menu?: MenuResult) => {
    setErrorMessage(null);
    setEditingMenu(menu || null);
    setMenuFormOpen(true);
  }, []);

  const openMenuItemForm = useCallback(
    (menu: MenuResult, menuItem?: MenuItemResult) => {
      setErrorMessage(null);
      setMenuItemMenu(menu);
      setEditingMenuItem(menuItem || null);
      setMenuItemFormOpen(true);
    },
    [],
  );

  const requestDelete = useCallback((target: MenuDeleteTarget) => {
    setErrorMessage(null);
    setDeleteTarget(target);
  }, []);

  return {
    isSubmitting,
    errorMessage,
    menuFormOpen,
    editingMenu,
    menuItemFormOpen,
    menuItemMenu,
    editingMenuItem,
    deleteTarget,
    setMenuFormOpen,
    setMenuItemFormOpen,
    setDeleteTarget,
    setErrorMessage,
    openMenuForm,
    openMenuItemForm,
    requestDelete,
    submitMenuCreate,
    submitMenuUpdate,
    submitMenuDelete,
    submitMenuItemCreate,
    submitMenuItemUpdate,
    submitMenuItemDelete,
  };
}
