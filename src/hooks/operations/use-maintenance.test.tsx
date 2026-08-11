import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMaintenance } from "@/hooks/operations/use-maintenance";
import {
  createManagementMaintenanceTicket,
  listMaintenanceTicketAssigneeOptions,
  listManagementMaintenanceTickets,
} from "@/lib/services/operations/maintenance";
import type { MaintenanceTicketResult } from "@/types/operations/maintenance";

vi.mock("@/lib/services/kiosks/management", () => ({
  getKioskManagementErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  getManagementKiosks: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/services/operations/maintenance", () => ({
  assignManagementMaintenanceTicket: vi.fn(),
  cancelManagementMaintenanceTicket: vi.fn(),
  closeManagementMaintenanceTicket: vi.fn(),
  createManagementMaintenanceTicket: vi.fn(),
  getMaintenanceErrorMessage: vi.fn(
    (_error: unknown, fallback: string) => fallback,
  ),
  getManagementMaintenanceTicketById: vi.fn(),
  listMaintenanceTicketAssigneeOptions: vi.fn(),
  listManagementMaintenanceTickets: vi.fn(),
  resolveManagementMaintenanceTicket: vi.fn(),
  startManagementMaintenanceTicket: vi.fn(),
  updateManagementMaintenanceTicket: vi.fn(),
}));

const pagination = {
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};
const ticket = {
  id: "ticket-1",
  ticketNumber: "MT-001",
  status: "Open",
  operationalImpact: "None",
} as MaintenanceTicketResult;
const request = {
  kioskId: "kiosk-1",
  title: "Kiểm tra kiosk",
  priority: "Medium" as const,
  operationalImpact: "None" as const,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("maintenance mutation recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listManagementMaintenanceTickets).mockResolvedValue({
      succeeded: true,
      statusCode: 200,
      data: [],
      pagination,
    });
    vi.mocked(createManagementMaintenanceTicket).mockResolvedValue(ticket);
    vi.mocked(listMaintenanceTicketAssigneeOptions).mockResolvedValue([]);
  });

  it("keeps mutation success when refresh fails and retries reads only", async () => {
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() =>
      expect(listManagementMaintenanceTickets).toHaveBeenCalledOnce(),
    );
    vi.mocked(listManagementMaintenanceTickets)
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce({
        succeeded: true,
        statusCode: 200,
        data: [ticket],
        pagination: { ...pagination, totalCount: 1 },
      });

    await act(async () => {
      await result.current.submitCreate(request);
    });

    expect(createManagementMaintenanceTicket).toHaveBeenCalledOnce();
    expect(result.current.successMessage).toContain("MT-001");
    expect(result.current.mutationErrorMessage).toBeNull();
    expect(result.current.refreshWarningMessage).toContain("đã thành công");

    await act(async () => {
      await result.current.retryRefresh();
    });
    expect(createManagementMaintenanceTicket).toHaveBeenCalledOnce();
    expect(result.current.refreshWarningMessage).toBeNull();
  });

  it("does not report success when the mutation fails", async () => {
    vi.mocked(createManagementMaintenanceTicket).mockRejectedValueOnce(
      new Error("mutation failed"),
    );
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() =>
      expect(listManagementMaintenanceTickets).toHaveBeenCalledOnce(),
    );

    await act(async () => {
      await result.current.submitCreate(request);
    });

    expect(result.current.successMessage).toBeNull();
    expect(result.current.mutationErrorMessage).toContain(
      "Không thể cập nhật yêu cầu bảo trì",
    );
  });

  it("prevents a duplicate create while the first mutation is pending", async () => {
    const pending = deferred<MaintenanceTicketResult>();
    vi.mocked(createManagementMaintenanceTicket).mockReturnValueOnce(
      pending.promise,
    );
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() =>
      expect(listManagementMaintenanceTickets).toHaveBeenCalledOnce(),
    );

    let first!: Promise<boolean>;
    act(() => {
      first = result.current.submitCreate(request);
    });
    await act(async () => {
      await result.current.submitCreate(request);
    });
    expect(createManagementMaintenanceTicket).toHaveBeenCalledOnce();

    pending.resolve(ticket);
    await act(async () => {
      await first;
    });
  });

  it("loads backend-authoritative assignee options only when assignment opens", async () => {
    const option = {
      accountId: "technician-1",
      displayName: "Kỹ thuật viên A",
      roleCodes: ["Technician"],
    };
    vi.mocked(listMaintenanceTicketAssigneeOptions).mockResolvedValue([option]);
    const { result } = renderHook(() => useMaintenance());
    await waitFor(() =>
      expect(listManagementMaintenanceTickets).toHaveBeenCalledOnce(),
    );

    act(() => result.current.requestWorkflow(ticket, "assign"));

    await waitFor(() => expect(result.current.assignees).toEqual([option]));
    expect(listMaintenanceTicketAssigneeOptions).toHaveBeenCalledWith("ticket-1");
  });
});
