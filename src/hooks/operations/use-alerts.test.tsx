import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAlerts } from "@/hooks/operations/use-alerts";
import {
  acknowledgeAlert,
  getAlertById,
  listAlerts,
  resolveAlert,
} from "@/lib/services/operations/alerts";
import type { AlertResult } from "@/types/operations/alerts";

vi.mock("@/lib/services/operations/alerts", () => ({
  acknowledgeAlert: vi.fn(),
  getAlertById: vi.fn(),
  getAlertErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  listAlerts: vi.fn(),
  resolveAlert: vi.fn(),
}));

const pagination = {
  page: 1,
  pageSize: 20,
  totalCount: 1,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};
const alert = {
  id: "alert-1",
  status: "Open",
  occurrenceCount: 3,
  lastOccurredAt: "2026-07-28T10:00:00Z",
} as AlertResult;

describe("alert lifecycle evidence", () => {
  beforeEach(() => {
    vi.mocked(listAlerts).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [alert],
      pagination,
    });
    vi.mocked(getAlertById).mockResolvedValue(alert);
    vi.mocked(acknowledgeAlert).mockResolvedValue({
      ...alert,
      status: "Acknowledged",
    });
    vi.mocked(resolveAlert).mockResolvedValue({
      ...alert,
      status: "Resolved",
      resolutionNotes: "Đã kiểm tra nguyên nhân",
    });
  });

  it("preserves deduplicated occurrence evidence and lifecycle responses", async () => {
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.alerts).toHaveLength(1));
    expect(result.current.alerts[0].occurrenceCount).toBe(3);

    await act(async () => {
      await result.current.acknowledgeAlert("alert-1");
    });
    expect(result.current.alerts[0].status).toBe("Acknowledged");

    await act(async () => {
      await result.current.resolveAlert("alert-1", "Đã kiểm tra nguyên nhân");
    });
    expect(resolveAlert).toHaveBeenCalledWith("alert-1", {
      resolutionNotes: "Đã kiểm tra nguyên nhân",
    });
    expect(result.current.alerts[0].status).toBe("Resolved");
  });

  it("keeps list evidence when detail loading fails", async () => {
    vi.mocked(getAlertById).mockRejectedValueOnce(new Error("detail failed"));
    const { result } = renderHook(() => useAlerts());
    await waitFor(() => expect(result.current.alerts).toHaveLength(1));

    await act(async () => {
      await result.current.openAlertDetail("alert-1");
    });

    expect(result.current.alerts).toEqual([alert]);
    expect(result.current.detailErrorMessage).toBe(
      "Không thể tải chi tiết cảnh báo.",
    );
  });
});
