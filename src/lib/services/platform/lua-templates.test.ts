import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  assignLuaTemplateTechnicalContract,
  changeLuaTemplateLifecycle,
  listLuaTemplates,
  uploadLuaTemplate,
} from "@/lib/services/platform/lua-templates";
import type { ApiResult } from "@/types";
import type { LuaTemplateResult } from "@/types/platform/lua-templates";

vi.mock("@/lib/axios-client", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function response<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return { data: result, status: 200, statusText: "OK", headers: {}, config: { headers: {} } } as AxiosResponse<ApiResult<T>>;
}

const template = { id: "template-1", templateCode: "SCOOP" } as LuaTemplateResult;

describe("system Lua template contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists platform templates with server-side filters and pagination", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: true, statusCode: 200, data: [template] }),
      data: {
        succeeded: true,
        statusCode: 200,
        data: [template],
        pagination: { page: 2, pageSize: 20, totalCount: 21, totalPages: 2, hasNext: false, hasPrevious: true },
      },
    });

    await listLuaTemplates({ search: "scoop", status: "Draft", pageNumber: 2, pageSize: 20 });

    expect(axiosClient.get).toHaveBeenCalledWith(
      "/api/v1/management/robot-artifact-templates",
      { params: { search: "scoop", status: "Draft", pageNumber: 2, pageSize: 20 }, signal: undefined },
    );
  });

  it("does not turn a failed list envelope into an empty state", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue({
      ...response({ succeeded: false, statusCode: 403, message: "Access denied" }),
      data: { succeeded: false, statusCode: 403, message: "Access denied", pagination: {} },
    });

    await expect(listLuaTemplates({ pageNumber: 1, pageSize: 20 })).rejects.toThrow("Access denied");
  });

  it("uploads one Lua file with the exact multipart manifest expected by backend", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(response({
      succeeded: true,
      statusCode: 200,
      data: { uploadedCount: 1, existingCount: 0, failedCount: 0, items: [] },
    }));
    const file = new File(["print('ok')"], "scoop.lua", { type: "text/plain" });

    await uploadLuaTemplate({
      file,
      templateCode: " SCOOP ",
      templateName: " Scoop ",
      runtimeTargetCode: " FAIRINO ",
      machineModelCode: " FR5 ",
      description: " Standard ",
    });

    const [, formData] = vi.mocked(axiosClient.post).mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get("files")).toBe(file);
    expect(JSON.parse(String((formData as FormData).get("manifestJson")))).toEqual([{
      fileName: "scoop.lua",
      templateCode: "SCOOP",
      templateName: "Scoop",
      runtimeTargetCode: "FAIRINO",
      machineModelCode: "FR5",
      description: "Standard",
    }]);
  });

  it("assigns a published technical contract using UUID only in the payload", async () => {
    vi.mocked(axiosClient.put).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: template }));
    await assignLuaTemplateTechnicalContract("template/1", "contract-1");
    expect(axiosClient.put).toHaveBeenCalledWith(
      "/api/v1/management/robot-artifact-templates/template%2F1/technical-contract",
      { technicalContractId: "contract-1" },
    );
  });

  it("uses distinct lifecycle methods for publish and draft discard", async () => {
    vi.mocked(axiosClient.patch).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: template }));
    vi.mocked(axiosClient.delete).mockResolvedValue(response({ succeeded: true, statusCode: 200, data: {} }));
    await changeLuaTemplateLifecycle("template-1", "publish");
    await changeLuaTemplateLifecycle("template-1", "discard");
    expect(axiosClient.patch).toHaveBeenCalledWith("/api/v1/management/robot-artifact-templates/template-1/publish");
    expect(axiosClient.delete).toHaveBeenCalledWith("/api/v1/management/robot-artifact-templates/template-1");
  });
});
