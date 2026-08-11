import { describe, expect, it } from "vitest";

import { getMenuItemReadinessBlockers } from "@/lib/presenters/menu-item-readiness";
import type {
  ProductResult,
  ProductVariantResult,
} from "@/types/catalog/menu-management";

const option = {
  id: "option-1",
  name: "Thêm sốt",
  currency: "VND",
  isAvailable: true,
  executionImpact: "ProductionAffecting",
};
const product = {
  optionGroups: [
    {
      id: 1,
      name: "Sốt",
      isActive: true,
      minSelections: 1,
      maxSelections: 1,
      options: [option],
    },
  ],
} as ProductResult;

describe("menu item sellability presentation", () => {
  it("reports missing recipe and required option independently", () => {
    const blockers = getMenuItemReadinessBlockers({
      menuCurrency: "VND",
      product,
      recipeId: null,
      selectedOptionIds: [],
      variant: { fulfillmentType: "MachineProduced" } as ProductVariantResult,
    });

    expect(blockers).toEqual([
      "Món sản xuất bằng máy chưa có công thức hợp lệ.",
      "Nhóm Sốt cần ít nhất 1 lựa chọn khả dụng.",
    ]);
  });

  it("does not infer a blocker when authoritative configuration is valid", () => {
    expect(
      getMenuItemReadinessBlockers({
        menuCurrency: "VND",
        product,
        recipeId: "recipe-1",
        selectedOptionIds: ["option-1"],
        variant: {
          fulfillmentType: "MachineProduced",
        } as ProductVariantResult,
      }),
    ).toEqual([]);
  });

  it("keeps packaged execution impact and currency mismatches distinct", () => {
    const mismatched = {
      ...product,
      optionGroups: [
        {
          ...product.optionGroups[0],
          options: [{ ...option, currency: "USD" }],
        },
      ],
    } as ProductResult;

    expect(
      getMenuItemReadinessBlockers({
        menuCurrency: "VND",
        product: mismatched,
        recipeId: null,
        selectedOptionIds: ["option-1"],
        variant: { fulfillmentType: "Packaged" } as ProductVariantResult,
      }),
    ).toEqual([
      "Nhóm Sốt có tùy chọn khác tiền tệ thực đơn.",
      "Món đóng gói không thể dùng tùy chọn ảnh hưởng sản xuất trong nhóm Sốt.",
    ]);
  });
});
