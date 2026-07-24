import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { readAuthSession, writeAuthSession } from "@/lib/auth-session";
import {
  getCurrentAccount,
  getCurrentAccountAccess,
  refreshAccessToken,
} from "@/lib/services/auth";
import type { AuthSession, CurrentAccountResult } from "@/types";
import type { EffectiveAccessResult } from "@/types/accounts";

vi.mock("@/lib/services/auth", () => ({
  getCurrentAccount: vi.fn(),
  getCurrentAccountAccess: vi.fn(),
  loginWithPassword: vi.fn(),
  refreshAccessToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

const storedSession: AuthSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  account: {
    id: "11111111-1111-1111-1111-111111111111",
    userName: "admin",
    fullName: "System Admin",
    email: "admin@icebot.vn",
    roles: [{ roleCode: "SystemAdmin" }],
    status: "Active",
    localLoginEnabled: true,
    googleLoginEnabled: false,
  },
};

const currentAccount: CurrentAccountResult = {
  ...storedSession.account,
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  gender: "Unknown",
};

const refreshedSession: AuthSession = {
  ...storedSession,
  accessToken: "refreshed-access-token",
  refreshToken: "refreshed-refresh-token",
};

const currentAccess: EffectiveAccessResult = {
  accountId: storedSession.account.id,
  isSystemAdmin: true,
  roles: ["SystemAdmin"],
  roleScopes: [],
  effectiveScope: {
    organizationIds: [],
    storeIds: [],
    kioskIds: [],
  },
};

function unauthorizedError(): AxiosError {
  const response = {
    data: {},
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse;

  return new AxiosError(
    "Request failed with status code 401",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    response,
  );
}

function AuthProbe() {
  const {
    status,
    session,
    errorMessage,
    effectiveAccess,
    retryRestore,
  } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="token">{session?.accessToken ?? "none"}</span>
      <span data-testid="error">{errorMessage ?? "none"}</span>
      <span data-testid="access">
        {effectiveAccess?.roles.join(",") ?? "none"}
      </span>
      <button type="button" onClick={() => void retryRestore()}>
        Retry restore
      </button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe("stored-session recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    writeAuthSession(storedSession);
    vi.mocked(getCurrentAccountAccess).mockResolvedValue(currentAccess);
  });

  it("keeps the stored session after a network timeout and allows retry", async () => {
    vi.mocked(getCurrentAccount)
      .mockRejectedValueOnce(
        new AxiosError("timeout", "ECONNABORTED"),
      )
      .mockResolvedValueOnce(currentAccount);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });
    expect(screen.getByTestId("token")).toHaveTextContent("access-token");
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Kết nối xác thực đã hết thời gian chờ",
    );
    expect(readAuthSession()).toEqual(storedSession);
    expect(refreshAccessToken).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retry restore" }));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(readAuthSession()?.accessToken).toBe("access-token");
  });

  it("clears the session when refresh fails with HTTP 401", async () => {
    vi.mocked(getCurrentAccount).mockRejectedValueOnce(unauthorizedError());
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(unauthorizedError());

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });
    expect(screen.getByTestId("token")).toHaveTextContent("none");
    expect(readAuthSession()).toBeNull();
  });

  it("keeps rotated tokens when account validation is temporarily unavailable", async () => {
    vi.mocked(getCurrentAccount)
      .mockRejectedValueOnce(unauthorizedError())
      .mockRejectedValueOnce(new AxiosError("timeout", "ECONNABORTED"));
    vi.mocked(refreshAccessToken).mockResolvedValueOnce(refreshedSession);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });
    expect(screen.getByTestId("token")).toHaveTextContent(
      "refreshed-access-token",
    );
    expect(readAuthSession()?.refreshToken).toBe("refreshed-refresh-token");
  });

  it("keeps the existing successful restore behavior", async () => {
    vi.mocked(getCurrentAccount).mockResolvedValueOnce(currentAccount);

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("token")).toHaveTextContent("access-token");
    expect(screen.getByTestId("error")).toHaveTextContent("none");
    expect(screen.getByTestId("access")).toHaveTextContent("SystemAdmin");
    expect(readAuthSession()?.account.email).toBe("admin@icebot.vn");
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("keeps authentication but denies effective permissions when access loading fails", async () => {
    vi.mocked(getCurrentAccount).mockResolvedValueOnce(currentAccount);
    vi.mocked(getCurrentAccountAccess).mockRejectedValueOnce(
      new AxiosError("network error", "ERR_NETWORK"),
    );

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByTestId("access")).toHaveTextContent("none");
    expect(readAuthSession()).toEqual(storedSession);
  });
});
