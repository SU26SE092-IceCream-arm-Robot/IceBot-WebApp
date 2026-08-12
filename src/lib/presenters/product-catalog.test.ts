import { describe, expect, it } from "vitest";

import {
  getProductReadinessIssues,
  getProductTypeOptions,
  getVariantReadinessIssues,
} from "@/lib/presenters/product-catalog";
import type {
  ProductCategoryResult,
  ProductResult,
  ProductVariantResult,
} from "@/types/catalog/menu-management";

function createVariant(
  overrides: Partial<ProductVariantResult> = {},
): ProductVariantResult {
  return {
    id: "variant-1",
    productId: "product-1",
    code: "VANILLA-M",
    name: "Vanilla M",
    variantType: "Default",
    fulfillmentType: "MachineProduced",
    basePrice: 30000,
    currency: "VND",
    isAvailable: true,
    recipeCount: 0,
    sellableRecipeCount: 0,
    displayOrder: 1,
    createdAt: "2026-08-12T00:00:00Z",
    ...overrides,
  };
}

function createProduct(
  variants: ProductVariantResult[],
  overrides: Partial<ProductResult> = {},
): ProductResult {
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
    ...overrides,
  };
}

describe("product catalog presentation rules", () => {
  it("keeps the supported product taxonomy and preserves catalog-specific values", () => {
    const categories: ProductCategoryResult[] = [
      {
        id: 1,
        code: "DRINK",
        name: "Drink",
        productType: "Beverage",
        isActive: true,
        displayOrder: 1,
      },
    ];

    const options = getProductTypeOptions(categories, "Seasonal");

    expect(options).toEqual(
      expect.arrayContaining([
        "General",
        "IceCream",
        "Packaged",
        "Mixed",
        "Beverage",
        "Seasonal",
      ]),
    );
  });

  it("requires a sellable recipe only for machine-produced variants", () => {
    expect(getVariantReadinessIssues(createVariant())).toEqual([
      expect.objectContaining({ code: "MISSING_SELLABLE_RECIPE" }),
    ]);
    expect(
      getVariantReadinessIssues(
        createVariant({ fulfillmentType: "Packaged" }),
      ),
    ).toEqual([]);
    expect(
      getVariantReadinessIssues(
        createVariant({ fulfillmentType: "Manual" }),
      ),
    ).toEqual([]);
  });

  it("reports incomplete variants and required option groups", () => {
    const issues = getProductReadinessIssues(
      createProduct([createVariant()], {
        optionGroups: [
          {
            id: 1,
            productId: "product-1",
            code: "TOPPING",
            name: "Topping",
            selectionType: "Multiple",
            minSelections: 1,
            maxSelections: 2,
            isRequired: true,
            isActive: true,
            displayOrder: 1,
            options: [],
          },
        ],
      }),
    );

    expect(issues.map((issue) => issue.code)).toEqual([
      "MISSING_SELLABLE_RECIPE",
      "EMPTY_REQUIRED_OPTION_GROUP",
    ]);
  });

  it("does not require a recipe for an available packaged product", () => {
    const issues = getProductReadinessIssues(
      createProduct([
        createVariant({ fulfillmentType: "Packaged" }),
      ]),
    );

    expect(issues).toEqual([]);
  });
});
