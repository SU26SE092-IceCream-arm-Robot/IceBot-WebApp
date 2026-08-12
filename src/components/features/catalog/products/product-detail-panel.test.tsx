import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductDetailPanel } from "@/components/features/catalog/products/product-detail-panel";
import type {
  ProductResult,
  ProductVariantResult,
} from "@/types/catalog/menu-management";

function createVariant(
  fulfillmentType: ProductVariantResult["fulfillmentType"],
): ProductVariantResult {
  return {
    id: `variant-${fulfillmentType}`,
    productId: "product-1",
    code: fulfillmentType.toUpperCase(),
    name: fulfillmentType,
    variantType: "Default",
    fulfillmentType,
    basePrice: 30000,
    currency: "VND",
    isAvailable: true,
    recipeCount: 0,
    sellableRecipeCount: 0,
    displayOrder: 1,
    createdAt: "2026-08-12T00:00:00Z",
  };
}

function createProduct(variants: ProductVariantResult[]): ProductResult {
  return {
    id: "product-1",
    code: "VANILLA",
    name: "Vanilla",
    productType: "IceCream",
    basePrice: 30000,
    currency: "VND",
    isAvailable: true,
    scopeType: "Organization",
    createdAt: "2026-08-12T00:00:00Z",
    variants,
    optionGroups: [],
  };
}

function renderPanel(product: ProductResult) {
  const onClose = vi.fn();
  const onManageRecipes = vi.fn();
  render(
    <ProductDetailPanel
      canManage
      categories={[]}
      errorMessage={null}
      isLoading={false}
      product={product}
      productActionId={null}
      variantActionId={null}
      onClose={onClose}
      onToggleProduct={vi.fn()}
      onToggleVariant={vi.fn()}
      onEditProduct={vi.fn()}
      onDeleteProduct={vi.fn()}
      onCreateVariant={vi.fn()}
      onManageOptions={vi.fn()}
      onManageRecipes={onManageRecipes}
      onEditVariant={vi.fn()}
      onDeleteVariant={vi.fn()}
    />,
  );
  return { onClose, onManageRecipes };
}

describe("ProductDetailPanel", () => {
  it("offers recipe authoring only for machine-produced variants", () => {
    const machine = createVariant("MachineProduced");
    const packaged = createVariant("Packaged");
    const { onManageRecipes } = renderPanel(createProduct([machine, packaged]));

    expect(screen.getAllByRole("button", { name: /Công thức/i })).toHaveLength(1);
    expect(screen.getByText("Chưa có công thức")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Công thức/i }));
    expect(onManageRecipes).toHaveBeenCalledWith(
      expect.objectContaining({ id: "product-1" }),
      machine,
    );
  });

  it("does not report a missing recipe for packaged products", () => {
    renderPanel(createProduct([createVariant("Packaged")]));

    expect(screen.getByText("Thiết lập sản phẩm đã hoàn thiện")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Công thức/i })).not.toBeInTheDocument();
  });

  it("closes the owned detail subview", () => {
    const { onClose } = renderPanel(createProduct([createVariant("Packaged")]));

    fireEvent.click(screen.getByRole("button", { name: "Đóng chi tiết" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
