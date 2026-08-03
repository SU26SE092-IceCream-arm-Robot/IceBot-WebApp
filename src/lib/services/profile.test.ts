import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosClient from "@/lib/axios-client";
import {
  changeCurrentAccountPassword,
  getCurrentAccountProfile,
  listCurrentAccountSessions,
  listCurrentAccountNotificationDevices,
  revokeAllCurrentAccountSessions,
  unregisterCurrentAccountNotificationDevice,
  updateCurrentAccountProfile,
} from "@/lib/services/profile";
import type { ApiResult } from "@/types";
import type { CurrentAccountProfile } from "@/types/profile";

vi.mock("@/lib/axios-client", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function apiResponse<T>(result: ApiResult<T>): AxiosResponse<ApiResult<T>> {
  return {
    data: result,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: {} },
  } as AxiosResponse<ApiResult<T>>;
}

const profile: CurrentAccountProfile = {
  id: "account-1",
  userName: "manager.demo",
  email: "manager.demo@icebot.vn",
  emailConfirmed: true,
  fullName: "Manager Demo",
  phoneNumber: null,
  phoneNumberConfirmed: false,
  address: null,
  gender: "Other",
  status: "Active",
  localLoginEnabled: true,
  googleLoginEnabled: false,
  roles: [{ roleCode: "Manager", organizationId: "organization-1" }],
};

describe("current account profile service", () => {
  beforeEach(() => {
    vi.mocked(axiosClient.get).mockReset();
    vi.mocked(axiosClient.put).mockReset();
    vi.mocked(axiosClient.post).mockReset();
    vi.mocked(axiosClient.delete).mockReset();
  });

  it("loads the authenticated account from /me", async () => {
    vi.mocked(axiosClient.get).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: profile }),
    );

    await expect(getCurrentAccountProfile()).resolves.toEqual(profile);
    expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/me");
  });

  it("updates only profile fields through /me/profile", async () => {
    const request = {
      fullName: "Manager Updated",
      phoneNumber: "0900000000",
      address: "Ho Chi Minh City",
      gender: "Other",
    };
    vi.mocked(axiosClient.put).mockResolvedValue(
      apiResponse({
        succeeded: true,
        statusCode: 200,
        data: { ...profile, ...request },
      }),
    );

    await updateCurrentAccountProfile(request);
    expect(axiosClient.put).toHaveBeenCalledWith("/api/v1/me/profile", request);
  });

  it("does not turn a failed profile envelope into usable data", async () => {
    vi.mocked(axiosClient.put).mockResolvedValue(
      apiResponse<CurrentAccountProfile>({
        succeeded: false,
        statusCode: 400,
        message: "Profile update rejected.",
      }),
    );

    await expect(updateCurrentAccountProfile({ fullName: "Test" })).rejects.toThrow(
      "Profile update rejected.",
    );
  });

  it("changes the current account password through /me/password", async () => {
    const request = {
      currentPassword: "current-password",
      newPassword: "new-password",
    };
    vi.mocked(axiosClient.put).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: true }),
    );

    await expect(changeCurrentAccountPassword(request)).resolves.toBeUndefined();
    expect(axiosClient.put).toHaveBeenCalledWith("/api/v1/me/password", request);
  });

  it("lists notification devices without exposing a provider token", async () => {
    const devices = [
      {
        installationId: "installation-1",
        platform: "Android",
        deviceName: "Pixel demo",
        appVersion: "1.0.0",
        lastSeenAt: "2026-08-03T10:00:00Z",
        isActive: true,
      },
    ];
    vi.mocked(axiosClient.get).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: devices }),
    );

    await expect(listCurrentAccountNotificationDevices()).resolves.toEqual(devices);
    expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/me/notification-devices");
  });

  it("lists active sessions without exposing refresh tokens", async () => {
    const sessions = [
      {
        sessionId: "session-1",
        createdAt: "2026-08-03T10:00:00Z",
        expiresAt: "2026-08-10T10:00:00Z",
        ipAddress: "127.0.0.1",
        userAgent: "IceBot test browser",
      },
    ];
    vi.mocked(axiosClient.get).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: sessions }),
    );

    await expect(listCurrentAccountSessions()).resolves.toEqual(sessions);
    expect(axiosClient.get).toHaveBeenCalledWith("/api/v1/me/sessions");
  });

  it("revokes all current-account sessions through the authenticated endpoint", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue(
      apiResponse({ succeeded: true, statusCode: 200, data: { revoked: 3 } }),
    );

    await expect(revokeAllCurrentAccountSessions()).resolves.toBe(3);
    expect(axiosClient.post).toHaveBeenCalledWith(
      "/api/v1/authentication/revoke-all",
      {},
    );
  });

  it("unregisters only the selected current-account notification device", async () => {
    vi.mocked(axiosClient.delete).mockResolvedValue({ status: 204 });

    await expect(unregisterCurrentAccountNotificationDevice("installation-1")).resolves.toBeUndefined();
    expect(axiosClient.delete).toHaveBeenCalledWith(
      "/api/v1/me/notification-devices/installation-1",
    );
  });
});
