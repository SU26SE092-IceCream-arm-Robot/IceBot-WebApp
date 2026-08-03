"use client";

import { useCallback } from "react";
import { CircleCheckBig, Layers3, Plus, RefreshCw } from "lucide-react";

import { CatalogActionDialog, MenuDetailDialog } from "@/components/features/menu/catalog-dialogs";
import {
  CatalogOrganizationSelector,
  CatalogRefreshWarning,
  CatalogSearchBar,
  CatalogStatCard,
  MenusPanel,
} from "@/components/features/menu/catalog-page-ui";
import {
  MenuDeleteDialog,
  MenuFormDialog,
  MenuItemFormDialog,
} from "@/components/features/menu/menu-crud-dialogs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCatalogOrganization } from "@/hooks/use-catalog-organization";
import { useMenuCrud, type MenuCrudChange } from "@/hooks/use-menu-crud";
import { useMenuManagement } from "@/hooks/use-menu-management";
import { useMenuScopeOptions } from "@/hooks/use-menu-scope-options";
import { hasScopedPermission } from "@/lib/rbac";

export function MenusManagementView() {
  const { effectiveAccess } = useAuth();
  const {
    organizations,
    selectedOrganizationId,
    selectedOrganization,
    setSelectedOrganizationId,
    isLoading: isOrganizationLoading,
    errorMessage: organizationError,
  } = useCatalogOrganization();
  const {
    searchTerm,
    menus,
    products,
    selectedMenu,
    pendingAction,
    isMenuDetailOpen,
    isMenuDetailLoading,
    menuDetailError,
    isActionDialogOpen,
    menuActionId,
    menuItemActionId,
    actionError,
    setSearchTerm,
    clearSearch,
    previousMenusPage,
    nextMenusPage,
    refresh,
    openMenuDetail,
    setMenuDetailOpen,
    requestMenuStatus,
    requestMenuItemStatus,
    setActionDialogOpen,
    confirmAction,
  } = useMenuManagement(selectedOrganizationId, {
    productSearchFollowsCatalog: false,
  });

  const handleMenuChanged = useCallback(
    async (change: MenuCrudChange) => {
      await refresh(true);
      if (change.menuDeleted) {
        if (selectedMenu?.id === change.menuId) setMenuDetailOpen(false);
        return;
      }
      if (isMenuDetailOpen && selectedMenu?.id === change.menuId) {
        await openMenuDetail(change.menuId, true);
      }
    },
    [isMenuDetailOpen, openMenuDetail, refresh, selectedMenu?.id, setMenuDetailOpen],
  );

  const menuCrud = useMenuCrud({
    organizationId: selectedOrganizationId,
    onChanged: handleMenuChanged,
  });
  const menuScopeOptions = useMenuScopeOptions(selectedOrganizationId);
  const canManage = selectedOrganizationId
    ? hasScopedPermission(effectiveAccess, "menus.manage", {
        organizationId: selectedOrganizationId,
      })
    : false;
  const activeMenusOnPage = menus.data.filter((menu) => menu.status === "Active").length;
  const deleteTarget = menuCrud.deleteTarget;

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Thực đơn</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Tổ chức sản phẩm thành danh sách bán theo phạm vi cửa hàng hoặc kiosk và quản lý trạng thái hiển thị.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" onClick={() => void refresh()} isLoading={menus.isLoading}>
            <RefreshCw className="size-4" />Làm mới
          </Button>
          {canManage ? (
            <Button className="h-10" disabled={!selectedOrganizationId} onClick={() => menuCrud.openMenuForm()}>
              <Plus className="size-4" />Tạo thực đơn
            </Button>
          ) : null}
        </div>
      </section>

      <CatalogRefreshWarning
        message={menuCrud.refreshWarningMessage}
        isRetrying={menuCrud.isRefreshRetrying}
        onRetry={menuCrud.retryRefresh}
      />

      <CatalogOrganizationSelector
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        selectedOrganization={selectedOrganization}
        isLoading={isOrganizationLoading}
        errorMessage={organizationError}
        noun="Thực đơn"
        onChange={setSelectedOrganizationId}
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <CatalogStatCard icon={Layers3} label="Tổng thực đơn" value={menus.pagination.totalCount} tone="primary" />
        <CatalogStatCard icon={CircleCheckBig} label="Đang bán trên trang" value={activeMenusOnPage} tone="success" />
      </section>

      <CatalogSearchBar
        value={searchTerm}
        placeholder="Tìm theo tên hoặc mã thực đơn..."
        onChange={setSearchTerm}
        onClear={clearSearch}
      />

      <MenusPanel
        canManage={canManage}
        collection={menus}
        menuActionId={menuActionId}
        onRetry={refresh}
        onPrevious={previousMenusPage}
        onNext={nextMenusPage}
        onView={(menuId) => void openMenuDetail(menuId)}
        onToggleStatus={requestMenuStatus}
      />

      <MenuDetailDialog
        canManage={canManage}
        errorMessage={menuDetailError}
        isLoading={isMenuDetailLoading}
        menu={selectedMenu}
        menuActionId={menuActionId}
        menuItemActionId={menuItemActionId}
        open={isMenuDetailOpen}
        onOpenChange={setMenuDetailOpen}
        onToggleMenu={requestMenuStatus}
        onToggleMenuItem={requestMenuItemStatus}
        onEditMenu={menuCrud.openMenuForm}
        onDeleteMenu={(menu) => menuCrud.requestDelete({ kind: "menu", menu })}
        onCreateMenuItem={menuCrud.openMenuItemForm}
        onEditMenuItem={menuCrud.openMenuItemForm}
        onDeleteMenuItem={(menu, menuItem) => menuCrud.requestDelete({ kind: "menu-item", menu, menuItem })}
      />

      <CatalogActionDialog
        action={pendingAction}
        errorMessage={actionError}
        isSubmitting={menuActionId !== null || menuItemActionId !== null}
        open={isActionDialogOpen}
        onConfirm={() => void confirmAction()}
        onOpenChange={setActionDialogOpen}
      />

      {menuCrud.menuFormOpen ? (
        <MenuFormDialog
          key={`${selectedOrganizationId ?? "no-organization"}:${menuCrud.editingMenu?.id ?? "create-menu"}`}
          kiosks={menuScopeOptions.kiosks}
          menu={menuCrud.editingMenu}
          open
          isSubmitting={menuCrud.isSubmitting}
          errorMessage={menuCrud.errorMessage}
          scopeErrorMessage={menuScopeOptions.errorMessage}
          scopeOptionsLoading={menuScopeOptions.isLoading}
          stores={menuScopeOptions.stores}
          onOpenChange={menuCrud.setMenuFormOpen}
          onCreate={menuCrud.submitMenuCreate}
          onUpdate={(request) => menuCrud.submitMenuUpdate(menuCrud.editingMenu!.id, request)}
        />
      ) : null}

      {menuCrud.menuItemFormOpen && menuCrud.menuItemMenu ? (
        <MenuItemFormDialog
          key={menuCrud.editingMenuItem?.id ?? `create-${menuCrud.menuItemMenu.id}`}
          menu={menuCrud.menuItemMenu}
          menuItem={menuCrud.editingMenuItem}
          products={products.data}
          open
          isSubmitting={menuCrud.isSubmitting}
          errorMessage={menuCrud.errorMessage}
          onOpenChange={menuCrud.setMenuItemFormOpen}
          onCreate={(request) => menuCrud.submitMenuItemCreate(menuCrud.menuItemMenu!.id, request)}
          onUpdate={(request) => menuCrud.submitMenuItemUpdate(menuCrud.menuItemMenu!.id, menuCrud.editingMenuItem!.id, request)}
        />
      ) : null}

      {deleteTarget ? (
        <MenuDeleteDialog
          target={deleteTarget}
          isSubmitting={menuCrud.isSubmitting}
          errorMessage={menuCrud.errorMessage}
          onOpenChange={(open) => {
            if (!open) menuCrud.setDeleteTarget(null);
          }}
          onConfirm={() =>
            deleteTarget.kind === "menu"
              ? menuCrud.submitMenuDelete(deleteTarget.menu)
              : menuCrud.submitMenuItemDelete(deleteTarget.menu, deleteTarget.menuItem)
          }
        />
      ) : null}
    </div>
  );
}
