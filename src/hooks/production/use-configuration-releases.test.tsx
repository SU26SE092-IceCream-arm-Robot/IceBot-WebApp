import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useConfigurationReleases } from "@/hooks/production/use-configuration-releases";
import {
  createConfigurationRelease,
  getConfigurationRelease,
  getConfigurationReleaseAuthoringOptions,
  listConfigurationReleases,
  listProductionProgramBindings,
} from "@/lib/services/production/operations";
import type { ConfigurationReleaseResult } from "@/types/production/operations";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/services/production/operations", () => ({
  createConfigurationRelease: vi.fn(),
  discardConfigurationRelease: vi.fn(),
  getConfigurationRelease: vi.fn(),
  getConfigurationReleaseAuthoringOptions: vi.fn(),
  getProductionOperationsErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  listConfigurationReleases: vi.fn(),
  listProductionProgramBindings: vi.fn(),
  publishConfigurationRelease: vi.fn(),
  replaceConfigurationReleaseRoutes: vi.fn(),
  retireConfigurationRelease: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const release = {
  id: "release-1",
  revision: "a".repeat(64),
  routes: [],
} as unknown as ConfigurationReleaseResult;

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useConfigurationReleases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listConfigurationReleases).mockResolvedValue([]);
    vi.mocked(listProductionProgramBindings).mockResolvedValue([]);
  });

  it("loads release detail and authoritative authoring options together", async () => {
    vi.mocked(getConfigurationRelease).mockResolvedValue(release);
    vi.mocked(getConfigurationReleaseAuthoringOptions).mockResolvedValue({
      productVariants: [],
      recipes: [],
      robotPrograms: [],
      workcellCapabilities: [],
    });
    const { result } = renderHook(() => useConfigurationReleases("org-1"), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let detail: ConfigurationReleaseResult | null = null;
    await act(async () => {
      detail = await result.current.loadEditor("release-1");
    });

    expect(detail).toBe(release);
    expect(getConfigurationRelease).toHaveBeenCalledWith("org-1", "release-1");
    expect(getConfigurationReleaseAuthoringOptions).toHaveBeenCalledWith(
      "org-1",
    );
    expect(listProductionProgramBindings).toHaveBeenCalledWith("org-1");
  });

  it("keeps mutation success separate from a failed list refresh", async () => {
    vi.mocked(createConfigurationRelease).mockResolvedValue(release);
    vi.mocked(listConfigurationReleases)
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("refresh failed"));
    const { result } = renderHook(() => useConfigurationReleases("org-1"), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createRelease();
    });

    expect(toast.success).toHaveBeenCalledWith("Đã tạo bản nháp cấu hình.");
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledOnce();
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.refreshWarning).toContain("danh sách chưa tải lại");
  });

  it("prevents a duplicate create while the first mutation is pending", async () => {
    const pending = deferred<ConfigurationReleaseResult>();
    vi.mocked(createConfigurationRelease).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useConfigurationReleases("org-1"), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let first!: Promise<ConfigurationReleaseResult | null>;
    act(() => {
      first = result.current.createRelease();
    });
    await act(async () => {
      await result.current.createRelease();
    });
    expect(createConfigurationRelease).toHaveBeenCalledOnce();

    pending.resolve(release);
    await act(async () => {
      await first;
    });
  });
});
