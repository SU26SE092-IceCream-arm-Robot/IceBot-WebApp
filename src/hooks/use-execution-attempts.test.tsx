import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useExecutionAttempts } from "@/hooks/use-execution-attempts";
import {
  getManagementExecutionAttempt,
  getManagementOrderExecutionAttempts,
} from "@/lib/services/transactions";
import type { ExecutionAttemptDetailResult } from "@/types/transactions";

vi.mock("@/lib/services/transactions", () => ({
  getManagementExecutionAttempt: vi.fn(),
  getManagementOrderExecutionAttempts: vi.fn(),
  getTransactionsErrorMessage: vi.fn(
    (_error: unknown, fallbackMessage: string) => fallbackMessage,
  ),
}));

const sourceCommandId = "22222222-2222-2222-2222-222222222222";
const secondSourceCommandId = "33333333-3333-3333-3333-333333333333";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function detailFor(sourceId: string): ExecutionAttemptDetailResult {
  return {
    attempt: { sourceCommandId: sourceId },
  } as ExecutionAttemptDetailResult;
}

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
    <div>
      <span data-testid="expanded">{state.expandedId ?? "none"}</span>
      <span data-testid="detail">
        {state.detail?.attempt.sourceCommandId ?? "none"}
      </span>
      <span data-testid="detail-error">
        {state.detailErrorMessage ?? "none"}
      </span>
      <span data-testid="detail-loading">
        {state.isDetailLoading ? "loading" : "idle"}
      </span>
      <button
        type="button"
        onClick={() => void state.toggleDetail(sourceCommandId)}
      >
        Toggle A
      </button>
      <button
        type="button"
        onClick={() => void state.toggleDetail(secondSourceCommandId)}
      >
        Toggle B
      </button>
    </div>
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
    fireEvent.click(screen.getByRole("button", { name: "Toggle A" }));

    expect(getManagementExecutionAttempt).not.toHaveBeenCalled();
  });

  it("keeps the existing diagnostics request when permission is granted", async () => {
    vi.mocked(getManagementExecutionAttempt).mockResolvedValue(
      detailFor(sourceCommandId),
    );
    render(<ExecutionAttemptProbe canViewDiagnostics />);

    await waitFor(() => {
      expect(getManagementOrderExecutionAttempts).toHaveBeenCalledOnce();
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle A" }));

    await waitFor(() => {
      expect(getManagementExecutionAttempt).toHaveBeenCalledWith(
        "11111111-1111-1111-1111-111111111111",
        sourceCommandId,
        expect.any(AbortSignal),
      );
    });
  });

  it("keeps B when A resolves after the newer detail request", async () => {
    const requestA = deferred<ExecutionAttemptDetailResult>();
    const requestB = deferred<ExecutionAttemptDetailResult>();
    vi.mocked(getManagementExecutionAttempt).mockImplementation(
      (_orderId, requestedSourceId) =>
        requestedSourceId === sourceCommandId
          ? requestA.promise
          : requestB.promise,
    );
    render(<ExecutionAttemptProbe canViewDiagnostics />);

    await waitFor(() => {
      expect(getManagementOrderExecutionAttempts).toHaveBeenCalledOnce();
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle A" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle B" }));

    requestB.resolve(detailFor(secondSourceCommandId));
    await waitFor(() => {
      expect(screen.getByTestId("detail")).toHaveTextContent(
        secondSourceCommandId,
      );
    });

    requestA.resolve(detailFor(sourceCommandId));
    await waitFor(() => {
      expect(screen.getByTestId("detail")).toHaveTextContent(
        secondSourceCommandId,
      );
    });
  });

  it("ignores an old error after the newer detail request succeeds", async () => {
    const requestA = deferred<ExecutionAttemptDetailResult>();
    const requestB = deferred<ExecutionAttemptDetailResult>();
    vi.mocked(getManagementExecutionAttempt).mockImplementation(
      (_orderId, requestedSourceId) =>
        requestedSourceId === sourceCommandId
          ? requestA.promise
          : requestB.promise,
    );
    render(<ExecutionAttemptProbe canViewDiagnostics />);

    await waitFor(() => {
      expect(getManagementOrderExecutionAttempts).toHaveBeenCalledOnce();
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle A" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle B" }));

    requestB.resolve(detailFor(secondSourceCommandId));
    await waitFor(() => {
      expect(screen.getByTestId("detail")).toHaveTextContent(
        secondSourceCommandId,
      );
    });

    requestA.reject(new Error("stale request failed"));
    await waitFor(() => {
      expect(screen.getByTestId("detail-error")).toHaveTextContent("none");
    });
  });

  it("does not restore detail state after closing before the response", async () => {
    const requestA = deferred<ExecutionAttemptDetailResult>();
    vi.mocked(getManagementExecutionAttempt).mockReturnValue(requestA.promise);
    render(<ExecutionAttemptProbe canViewDiagnostics />);

    await waitFor(() => {
      expect(getManagementOrderExecutionAttempts).toHaveBeenCalledOnce();
    });
    fireEvent.click(screen.getByRole("button", { name: "Toggle A" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle A" }));
    requestA.resolve(detailFor(sourceCommandId));

    await waitFor(() => {
      expect(screen.getByTestId("expanded")).toHaveTextContent("none");
      expect(screen.getByTestId("detail")).toHaveTextContent("none");
      expect(screen.getByTestId("detail-loading")).toHaveTextContent("idle");
    });
  });
});
