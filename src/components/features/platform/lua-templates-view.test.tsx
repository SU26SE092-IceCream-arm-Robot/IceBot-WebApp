import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LuaTemplatesView } from "@/components/features/platform/lua-templates-view";
import type { EffectiveAccessResult } from "@/types/identity/accounts";

const mocks = vi.hoisted(() => ({
  permissions: ["artifact-template.read"] as string[],
}));

vi.mock("@/hooks/identity/use-auth", () => ({
  useAuth: () => ({
    effectiveAccess: {
      roles: [],
      roleScopes: [],
      permissionCodes: mocks.permissions,
      permissionScopes: [],
      isSystemAdmin: false,
    } as EffectiveAccessResult,
  }),
}));

vi.mock("@/hooks/platform/use-lua-templates", () => ({
  useLuaTemplates: () => ({
    items: [],
    contracts: [],
    pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    page: 1,
    search: "",
    status: "ALL",
    isLoading: false,
    isMutating: false,
    error: null,
    refreshWarning: null,
    setSearch: vi.fn(),
    setStatus: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    refresh: vi.fn(),
    upload: vi.fn(),
    assignContract: vi.fn(),
    changeLifecycle: vi.fn(),
    openReview: vi.fn(),
  }),
}));

describe("LuaTemplatesView authorization", () => {
  afterEach(() => {
    cleanup();
    mocks.permissions = ["artifact-template.read"];
  });

  it("keeps the workspace read-only without artifact-template.manage", () => {
    render(<LuaTemplatesView />);
    expect(screen.getByRole("heading", { name: "Mẫu LUA hệ thống" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thêm mẫu LUA" })).not.toBeInTheDocument();
  });

  it("shows authoring controls only with artifact-template.manage", () => {
    mocks.permissions = ["artifact-template.read", "artifact-template.manage"];
    render(<LuaTemplatesView />);
    expect(screen.getByRole("button", { name: "Thêm mẫu LUA" })).toBeInTheDocument();
  });
});
