import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createOptionGroup,
  createRecipe,
  listRecipes,
  replaceProductOptionIngredientRequirements,
  setProductOptionAvailability,
  setRecipeStatus,
} from "@/lib/services/menu-management";
import type { ApiResult } from "@/types";
import type {
  OptionGroupResult,
  RecipeResult,
} from "@/types/menu-management";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<T>;
}

const group = { id: 7, name: "Kích cỡ" } as OptionGroupResult;
const recipe = { id: "recipe-1", name: "Kem vani" } as RecipeResult;

describe("menu option and recipe authoring contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosClient.post).mockResolvedValue(
      response<ApiResult<unknown>>({
        succeeded: true,
        statusCode: 200,
        data: group,
      }),
    );
    vi.mocked(axiosClient.put).mockResolvedValue(
      response<ApiResult<unknown>>({
        succeeded: true,
        statusCode: 200,
        data: group,
      }),
    );
    vi.mocked(axiosClient.patch).mockResolvedValue(
      response<ApiResult<unknown>>({
        succeeded: true,
        statusCode: 200,
        data: recipe,
      }),
    );
  });

  it("uses the organization-owned option group route", async () => {
    const request = {
      code: "SIZE",
      name: "Kích cỡ",
      selectionType: "Single" as const,
      minSelections: 1,
      maxSelections: 1,
      isRequired: true,
      displayOrder: 1,
    };

    await createOptionGroup("org 1", "product/1", request);

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org%201/products/product%2F1/option-groups",
      request,
    );
  });

  it("keeps availability and ingredient requirements as typed operations", async () => {
    await setProductOptionAvailability("org-1", "product-1", 7, "option-1", false);
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/products/product-1/option-groups/7/options/option-1/availability",
      { isAvailable: false },
    );

    const request = {
      items: [
        {
          ingredientId: "ingredient-1",
          quantity: 10,
          unit: "gram",
          requiredWorkcellCapabilityCode: "DISPENSE",
        },
      ],
    };
    await replaceProductOptionIngredientRequirements(
      "org-1",
      "product-1",
      7,
      "option-1",
      request,
    );
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/organizations/org-1/products/product-1/option-groups/7/options/option-1/ingredient-requirements",
      request,
    );
  });

  it("uses variant-owned recipe routes and explicit lifecycle payload", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      response({
        succeeded: true,
        statusCode: 200,
        data: [recipe],
        pagination: {
          page: 1,
          pageSize: 100,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      }),
    );
    const root =
      "/api/v1/management/organizations/org-1/products/product-1/variants/variant-1/recipes";

    await listRecipes("org-1", "product-1", "variant-1");
    expect(axiosClient.get).toHaveBeenCalledWith(root, {
      params: { pageNumber: 1, pageSize: 100 },
      signal: undefined,
    });

    const request = {
      code: "VANILLA",
      name: "Kem vani",
      yieldQuantity: 1,
      unit: "serving",
      isDefault: true,
    };
    vi.mocked(axiosClient.post).mockResolvedValue(
      response<ApiResult<RecipeResult>>({
        succeeded: true,
        statusCode: 201,
        data: recipe,
      }),
    );
    await createRecipe("org-1", "product-1", "variant-1", request);
    expect(axiosClient.post).toHaveBeenCalledWith(root, request);

    await setRecipeStatus(
      "org-1",
      "product-1",
      "variant-1",
      "recipe-1",
      "Published",
    );
    expect(axiosClient.patch).toHaveBeenCalledWith(`${root}/recipe-1/status`, {
      status: "Published",
    });
  });
});
