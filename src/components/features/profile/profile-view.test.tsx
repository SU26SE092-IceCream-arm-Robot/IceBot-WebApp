import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ActiveSessionsCard } from "@/components/features/profile/profile-view";
import type { CurrentAccountSession } from "@/types/profile";

const sessions: CurrentAccountSession[] = [
  {
    sessionId: "current-session",
    isCurrentSession: true,
    createdAt: "2026-08-10T08:00:00Z",
    expiresAt: "2026-08-17T08:00:00Z",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 Chrome/140 Windows",
    deviceName: "Chrome on Windows",
  },
  {
    sessionId: "other-session",
    isCurrentSession: false,
    createdAt: "2026-08-09T08:00:00Z",
    expiresAt: "2026-08-16T08:00:00Z",
    ipAddress: "192.0.2.10",
    userAgent: "Mozilla/5.0 Chrome/140 Android",
    deviceName: "Chrome on Android",
  },
];

describe("active account sessions", () => {
  it("shows backend device names and marks the current session", () => {
    render(
      <ActiveSessionsCard
        sessions={sessions}
        currentSessionId="current-session"
        isLoading={false}
        errorMessage={null}
        revokingSessionId={null}
        isRevokingAllSessions={false}
        onRetry={vi.fn()}
        onRevoke={vi.fn()}
        onRevokeAll={vi.fn()}
      />,
    );

    expect(screen.getByText("Chrome on Windows")).toBeInTheDocument();
    expect(screen.getByText("Chrome on Android")).toBeInTheDocument();
    expect(screen.getByText("Phiên hiện tại")).toBeInTheDocument();
  });

  it("requests revocation only for the selected session", () => {
    const onRevoke = vi.fn();
    render(
      <ActiveSessionsCard
        sessions={sessions}
        currentSessionId="current-session"
        isLoading={false}
        errorMessage={null}
        revokingSessionId={null}
        isRevokingAllSessions={false}
        onRetry={vi.fn()}
        onRevoke={onRevoke}
        onRevokeAll={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Đăng xuất" })[1]);

    expect(onRevoke).toHaveBeenCalledTimes(1);
    expect(onRevoke).toHaveBeenCalledWith(sessions[1]);
  });
});
