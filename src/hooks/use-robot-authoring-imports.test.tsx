import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRobotAuthoringImports } from "@/hooks/use-robot-authoring-imports";
import {
  getRobotAuthoringImport,
  getRobotAuthoringWorkspace,
  listRobotAuthoringImports,
  uploadRobotAuthoringImport,
  validateRobotAuthoringImport,
} from "@/lib/services/production-operations";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/services/production-operations", () => ({
  confirmRobotAuthoringComposition: vi.fn(),
  createRobotAuthoringReleaseDraft: vi.fn(),
  discardRobotAuthoringImport: vi.fn(),
  getConfigurationReleaseAuthoringOptions: vi.fn(),
  getProductionOperationsErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  getRobotAuthoringImport: vi.fn(),
  getRobotAuthoringWorkspace: vi.fn(),
  listRobotAuthoringImports: vi.fn(),
  materializeRobotAuthoringImport: vi.fn(),
  previewRobotAuthoringComposition: vi.fn(),
  publishRobotAuthoringImportResources: vi.fn(),
  uploadRobotAuthoringImport: vi.fn(),
  validateRobotAuthoringImport: vi.fn(),
}));

const page = (items: Array<{ id: string }>) => ({
  succeeded: true,
  statusCode: 200,
  data: items,
  pagination: { page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasNext: false, hasPrevious: false },
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

describe("useRobotAuthoringImports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listRobotAuthoringImports).mockResolvedValue(page([]));
    vi.mocked(getRobotAuthoringWorkspace).mockResolvedValue({ import: { id: "import-1" }, blockers: [], actions: [], packageTargets: [] } as never);
  });

  it("loads only the organization-scoped import list and resets its page when filtering", async () => {
    vi.mocked(listRobotAuthoringImports).mockResolvedValue(page([{ id: "import-1" }]));
    const { result } = renderHook(() => useRobotAuthoringImports("org-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listRobotAuthoringImports).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ status: "ALL", pageNumber: 1, pageSize: 10 }),
      expect.any(AbortSignal),
    );
    act(() => result.current.setStatus("Failed"));
    await waitFor(() => expect(result.current.query.status).toBe("Failed"));
    expect(result.current.query.pageNumber).toBe(1);
  });

  it("keeps the newest selection when an older detail request finishes later", async () => {
    const first = deferred<never>();
    vi.mocked(getRobotAuthoringImport)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ id: "import-b", nextActions: [], composedOptionCodes: [], items: [] } as never);
    const { result } = renderHook(() => useRobotAuthoringImports("org-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => { void result.current.selectImport("import-a"); });
    await act(async () => { await result.current.selectImport("import-b"); });
    first.resolve({ id: "import-a", nextActions: [], composedOptionCodes: [], items: [] } as never);
    await act(async () => { await first.promise; });

    expect(result.current.selectedImportId).toBe("import-b");
    expect(result.current.selectedImport?.id).toBe("import-b");
  });

  it("reports mutation success separately when the subsequent list refresh fails", async () => {
    vi.mocked(getRobotAuthoringImport).mockResolvedValue({ id: "import-1", nextActions: ["ValidateImport"], composedOptionCodes: [], items: [] } as never);
    vi.mocked(validateRobotAuthoringImport).mockResolvedValue({ id: "import-1" } as never);
    vi.mocked(listRobotAuthoringImports)
      .mockResolvedValueOnce(page([]))
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(page([]));
    const { result } = renderHook(() => useRobotAuthoringImports("org-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.selectImport("import-1"); });

    await act(async () => { await result.current.validate(); });

    expect(validateRobotAuthoringImport).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("Đã kiểm tra gói cấu hình.");
    expect(toast.warning).toHaveBeenCalledWith("Thao tác đã thành công nhưng danh sách mới chưa tải lại được. Hãy dùng nút Làm mới.");
    expect(result.current.refreshWarning).toBe("Thao tác đã thành công nhưng danh sách mới chưa tải lại được.");

    await act(async () => { await result.current.refresh(); });

    expect(validateRobotAuthoringImport).toHaveBeenCalledOnce();
    expect(listRobotAuthoringImports).toHaveBeenCalledTimes(3);
    expect(result.current.refreshWarning).toBeNull();
  });

  it("prevents duplicate bundle uploads while the first mutation is still pending", async () => {
    const pendingUpload = deferred<never>();
    vi.mocked(uploadRobotAuthoringImport).mockReturnValue(pendingUpload.promise);
    const { result } = renderHook(() => useRobotAuthoringImports("org-1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const file = new File(["bundle"], "fairino.zip", { type: "application/zip" });

    act(() => {
      void result.current.upload({ bundle: file });
      void result.current.upload({ bundle: file });
    });

    expect(uploadRobotAuthoringImport).toHaveBeenCalledOnce();
    pendingUpload.resolve({ id: "import-1" } as never);
    await act(async () => { await pendingUpload.promise; });
  });
});
