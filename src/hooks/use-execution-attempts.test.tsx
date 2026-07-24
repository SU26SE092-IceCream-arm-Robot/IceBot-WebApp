import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useExecutionAttempts } from "@/hooks/use-execution-attempts";
import {
  getManagementExecutionAttempt,
  getManagementOrderExecutionAttempts,
} from "@/lib/services/transactions";

vi.mock("@/lib/services/transactions", () => ({
  getManagementExecutionAttempt: vi.fn(),
  getManagementOrderExecutionAttempts: vi.fn(),
  getTransactionsErrorMessage: vi.fn(
    (_error: unknown, fallbackMessage: string) => fallbackMessage,
  ),
}));

const sourceCommandId = "22222222-2222-2222-2222-222222222222";

function ExecutionAttemptProbe({
  canViewDiagnostics,
}: {
  canViewDiagnostics: boolean;
}) {
  const state = useExecutionAttempts(
    "11111111-1111-1111-1111-111111111111",
    canViewDiagnostics,
  );

  return (
    <button
      type="button"
      onClick={() => void state.toggleDetail(sourceCommandId)}
    >
      Load diagnostics
    </button>
  );
}

describe("execution attempt diagnostics access", () => {
  beforeEach(() => {
    vi.mocked(getManagementOrderExecutionAttempts).mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    });
    vi.mocked(getManagementExecutionAttempt).mockReset();
  });

  it("does not request diagnostics without operations.diagnostics", async () => {
    render(<ExecutionAttemptProbe canViewDiagnostics={false} />);

    await waitFor(() => {
      expect(getManagementOrderExecutionAttempts).toHaveBeenCalledOnce();
    });
    fireEvent.click(screen.getByRole("button", { name: "Load diagnostics" }));

    expect(getManagementExecutionAttempt).not.toHaveBeenCalled();
  });

  it("keeps the existing diagnostics request when permission is granted", async () => {
    vi.mocked(getManagementExecutionAttempt).mockResolvedValue({} as never);
    render(<ExecutionAttemptProbe canViewDiagnostics />);

    await waitFor(() => {
      expect(getManagementOrderExecutionAttempts).toHaveBeenCalledOnce();
    });
    fireEvent.click(screen.getByRole("button", { name: "Load diagnostics" }));

    await waitFor(() => {
      expect(getManagementExecutionAttempt).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        sourceCommandId,
      );
    });
  });
});
