import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  createDeviceModel,
  createDeviceType,
  retireDeviceModel,
  setDeviceTypeStatus,
  updateDeviceModel,
  updateDeviceType,
} from "@/lib/services/device-catalog";
import {
  createIngredient,
  deleteIngredient,
  setIngredientStatus,
  updateIngredient,
} from "@/lib/services/ingredients";
import {
  createProductCategory,
  deleteProductCategory,
  setProductCategoryStatus,
  updateProductCategory,
} from "@/lib/services/menu-management";
import {
  getSyncDeadLetter,
  listSyncDeadLetters,
} from "@/lib/services/sync-dead-letters";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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

describe("SystemAdmin platform catalog contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const succeeded = response({ succeeded: true, statusCode: 200, data: {} });
    vi.mocked(axiosClient.post).mockResolvedValue(succeeded);
    vi.mocked(axiosClient.put).mockResolvedValue(succeeded);
    vi.mocked(axiosClient.patch).mockResolvedValue(succeeded);
    vi.mocked(axiosClient.delete).mockResolvedValue(succeeded);
  });

  it("uses exact Product Category management routes", async () => {
    const createRequest = {
      code: "ICE_CREAM",
      name: "Kem",
      productType: "IceCream",
      displayOrder: 1,
    };
    const updateRequest = {
      name: "Kem lạnh",
      productType: "IceCream",
      displayOrder: 2,
    };

    await createProductCategory(createRequest);
    await updateProductCategory(7, updateRequest);
    await setProductCategoryStatus(7, false);
    await deleteProductCategory(7);

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/product-categories",
      createRequest,
    );
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/product-categories/7",
      updateRequest,
    );
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/product-categories/7/status",
      { isActive: false },
    );
    expect(axiosClient.delete).toHaveBeenCalledWith(
      "/api/v1/management/product-categories/7",
    );
  });

  it("uses exact Ingredient management routes without changing payload", async () => {
    const createRequest = {
      code: "VANILLA_BASE",
      name: "Kem nền vani",
      ingredientType: "Consumable",
      unit: "gram",
      isPerishable: true,
      isAllergen: false,
      shelfLifeDays: 30,
    };
    const updateRequest = {
      name: createRequest.name,
      ingredientType: createRequest.ingredientType,
      unit: createRequest.unit,
      isPerishable: createRequest.isPerishable,
      isAllergen: createRequest.isAllergen,
      shelfLifeDays: createRequest.shelfLifeDays,
    };

    await createIngredient(createRequest);
    await updateIngredient("ingredient/1", updateRequest);
    await setIngredientStatus("ingredient/1", false);
    await deleteIngredient("ingredient/1");

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/management/ingredients",
      createRequest,
    );
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/ingredients/ingredient%2F1",
      updateRequest,
    );
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/ingredients/ingredient%2F1/status",
      { isActive: false },
    );
    expect(axiosClient.delete).toHaveBeenCalledWith(
      "/api/v1/management/ingredients/ingredient%2F1",
    );
  });

  it("keeps Device Type and Model lifecycle on catalog routes", async () => {
    const typeCreate = {
      code: "ROBOT_CONTROLLER",
      name: "Bộ điều khiển robot",
      category: "Controller",
      requiresKioskAssignment: true,
      displayOrder: 1,
    };
    const typeUpdate = {
      name: typeCreate.name,
      category: typeCreate.category,
      requiresKioskAssignment: typeCreate.requiresKioskAssignment,
      displayOrder: typeCreate.displayOrder,
    };
    const modelCreate = {
      code: "RC_01",
      name: "Robot Controller 01",
      capabilities: ["EXECUTE_PROGRAM"],
    };
    const modelUpdate = {
      name: modelCreate.name,
      capabilities: modelCreate.capabilities,
    };

    await createDeviceType(typeCreate);
    await updateDeviceType(3, typeUpdate);
    await setDeviceTypeStatus(3, false);
    await createDeviceModel(3, modelCreate);
    await updateDeviceModel("model/1", modelUpdate);
    await retireDeviceModel("model/1");

    expect(axiosClient.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/management/device-types",
      typeCreate,
    );
    expect(axiosClient.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/management/device-types/3/models",
      modelCreate,
    );
    expect(axiosClient.put).toHaveBeenNthCalledWith(
      1,
      "/api/v1/management/device-types/3",
      typeUpdate,
    );
    expect(axiosClient.put).toHaveBeenNthCalledWith(
      2,
      "/api/v1/management/device-models/model%2F1",
      modelUpdate,
    );
    expect(axiosClient.patch).toHaveBeenCalledWith(
      "/api/v1/management/device-types/3/status",
      { isActive: false },
    );
    expect(axiosClient.delete).toHaveBeenCalledWith(
      "/api/v1/management/device-models/model%2F1",
    );
  });
});

describe("SystemAdmin platform exception read contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists and reads sync dead letters without calling a mutation route", async () => {
    vi.mocked(axiosClient.get)
      .mockResolvedValueOnce(
        response({
          succeeded: true,
          statusCode: 200,
          data: [],
          pagination: {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          succeeded: true,
          statusCode: 200,
          data: {
            id: "dead-letter-1",
            eventType: "ExecutionReport.Completed",
            status: "Open",
            processingAttempts: 1,
            errorMessage: "Failed",
            failedAt: "2026-07-30T00:00:00Z",
            retryAttempts: [],
          },
        }),
      );

    await listSyncDeadLetters({ pageNumber: 1, pageSize: 20 });
    await getSyncDeadLetter("dead-letter-1");

    expect(axiosClient.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/management/sync-dead-letters",
      {
        params: {
          status: undefined,
          eventType: undefined,
          pageNumber: 1,
          pageSize: 20,
        },
        signal: undefined,
      },
    );
    expect(axiosClient.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/management/sync-dead-letters/dead-letter-1",
      { signal: undefined },
    );
    expect(axiosClient.post).not.toHaveBeenCalled();
    expect(axiosClient.patch).not.toHaveBeenCalled();
    expect(axiosClient.delete).not.toHaveBeenCalled();
  });
});
