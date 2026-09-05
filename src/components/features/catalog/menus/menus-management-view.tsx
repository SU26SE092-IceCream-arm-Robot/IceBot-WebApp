"use client";

import { useCallback } from "react";
import {
  CircleCheckBig,
  CirclePause,
  Layers3,
  ListTree,
  Plus,
  RefreshCw,
} from "lucide-react";

import { CatalogActionDialog, MenuDetailDialog } from "@/components/features/catalog/shared/catalog-dialogs";
import {
  CatalogOrganizationSelector,
  CatalogRefreshWarning,
  CatalogSearchBar,
  MenusPanel,
} from "@/components/features/catalog/shared/catalog-page-ui";
import {
  MenuDeleteDialog,
  MenuFormDialog,
  MenuItemFormDialog,
} from "@/components/features/catalog/menus/menu-crud-dialogs";
import { MetricStrip, MetricStripItem } from "@/components/shared/metric-strip";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/identity/use-auth";
import { useCatalogOrganization } from "@/hooks/catalog/use-catalog-organization";
import { useMenuCrud, type MenuCrudChange } from "@/hooks/catalog/use-menu-crud";
import { useMenuManagement } from "@/hooks/catalog/use-menu-management";
import { useMenuScopeOptions } from "@/hooks/catalog/use-menu-scope-options";
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
  const inactiveMenusOnPage = menus.data.length - activeMenusOnPage;
  const deleteTarget = menuCrud.deleteTarget;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Thực đơn"
        description="Tổ chức sản phẩm thành danh sách bán, xác định phạm vi áp dụng và kiểm soát thời gian hiệu lực."
        metadata={
          <p className="text-xs text-muted-foreground">
            {selectedOrganization
              ? `Phạm vi: ${selectedOrganization.name || selectedOrganization.code}`
              : "Chọn tổ chức để tải thực đơn"}
          </p>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              isLoading={menus.isLoading}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Làm mới
            </Button>
            {canManage ? (
              <Button
                size="sm"
                disabled={!selectedOrganizationId}
                onClick={() => menuCrud.openMenuForm()}
              >
                <Plus className="size-4" aria-hidden="true" />
                Tạo thực đơn
              </Button>
            ) : null}
          </>
        }
      />

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

      <MetricStrip>
        <MetricStripItem
          icon={Layers3}
          label="Tổng thực đơn"
          value={menus.pagination.totalCount.toLocaleString("vi-VN")}
          description="Trong tổ chức đã chọn"
          tone="primary"
        />
        <MetricStripItem
          icon={ListTree}
          label="Đang hiển thị"
          value={menus.data.length.toLocaleString("vi-VN")}
          description="Kết quả trên trang hiện tại"
          tone="neutral"
        />
        <MetricStripItem
          icon={CircleCheckBig}
          label="Đang bán trên trang"
          value={activeMenusOnPage.toLocaleString("vi-VN")}
          description="Đã kích hoạt"
          tone="success"
        />
        <MetricStripItem
          icon={CirclePause}
          label="Chưa bán trên trang"
          value={inactiveMenusOnPage.toLocaleString("vi-VN")}
          description="Nháp, tạm dừng hoặc lưu trữ"
          tone={inactiveMenusOnPage > 0 ? "warning" : "neutral"}
        />
      </MetricStrip>

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
