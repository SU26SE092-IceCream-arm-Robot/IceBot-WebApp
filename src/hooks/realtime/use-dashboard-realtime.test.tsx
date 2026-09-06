import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboardRealtime } from "@/hooks/realtime/use-dashboard-realtime";

const signalR = vi.hoisted(() => {
  const eventHandlers = new Map<string, (payload: unknown) => void>();
  let reconnectingHandler: (() => void) | undefined;
  let reconnectedHandler: (() => void) | undefined;
  let closeHandler: (() => void) | undefined;

  const connection = {
    state: "Disconnected",
    invoke: vi.fn(),
    off: vi.fn((eventName: string) => eventHandlers.delete(eventName)),
    on: vi.fn((eventName: string, handler: (payload: unknown) => void) => {
      eventHandlers.set(eventName, handler);
    }),
    onclose: vi.fn((handler: () => void) => {
      closeHandler = handler;
    }),
    onreconnecting: vi.fn((handler: () => void) => {
      reconnectingHandler = handler;
    }),
    onreconnected: vi.fn((handler: () => void) => {
      reconnectedHandler = handler;
    }),
    start: vi.fn(),
    stop: vi.fn(),
  };

  return {
    connection,
    emit(eventName: string, payload: unknown) {
      eventHandlers.get(eventName)?.(payload);
    },
    reconnect() {
      reconnectedHandler?.();
    },
    reconnecting() {
      reconnectingHandler?.();
    },
    close() {
      connection.state = "Disconnected";
      closeHandler?.();
    },
    reset() {
      eventHandlers.clear();
      reconnectingHandler = undefined;
      reconnectedHandler = undefined;
      closeHandler = undefined;
      connection.state = "Disconnected";
      connection.invoke.mockReset().mockResolvedValue(undefined);
      connection.off.mockClear();
      connection.on.mockClear();
      connection.onclose.mockClear();
      connection.onreconnecting.mockClear();
      connection.onreconnected.mockClear();
      connection.start.mockReset().mockImplementation(async () => {
        connection.state = "Connected";
      });
      connection.stop.mockReset().mockResolvedValue(undefined);
    },
  };
});

vi.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return signalR.connection;
    }
  },
  HubConnectionState: {
    Connected: "Connected",
    Disconnected: "Disconnected",
  },
  LogLevel: {
    Warning: 3,
  },
}));

vi.mock("@/lib/auth-session", () => ({
  getStoredAccessToken: vi.fn(() => "mock-token"),
}));

vi.mock("@/lib/realtime/hub-urls", () => ({
  getManagementDashboardHubUrl: vi.fn(
    () => "/api/backend/hubs/management-dashboard",
  ),
}));

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useDashboardRealtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    signalR.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("joins dashboard group with system scope and triggers onInvalidated", async () => {
    const onInvalidated = vi.fn();
    const { result } = renderHook(() =>
      useDashboardRealtime({
        scope: "system",
        onInvalidated,
      }),
    );
    await flushPromises();

    expect(result.current).toBe("connected");
    expect(signalR.connection.start).toHaveBeenCalledTimes(1);
    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinDashboard",
      "system",
      null,
      null,
    );

    act(() => {
      signalR.emit("DashboardInvalidated", {
        scope: "system",
        reason: "OrderItemFulfillmentChanged",
      });
    });

    expect(onInvalidated).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(onInvalidated).toHaveBeenCalledTimes(1);
    expect(onInvalidated).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "system",
        reason: "OrderItemFulfillmentChanged",
      }),
    );
  });

  it("joins organization scoped dashboard group", async () => {
    const onInvalidated = vi.fn();
    renderHook(() =>
      useDashboardRealtime({
        scope: "organization",
        organizationId: "org-1",
        onInvalidated,
      }),
    );
    await flushPromises();

    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinDashboard",
      "organization",
      "org-1",
      null,
    );
  });

  it("rejoins and triggers refresh on reconnection", async () => {
    const onInvalidated = vi.fn();
    renderHook(() =>
      useDashboardRealtime({
        scope: "system",
        onInvalidated,
      }),
    );
    await flushPromises();
    signalR.connection.invoke.mockClear();

    act(() => {
      signalR.reconnect();
    });
    await flushPromises();

    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinDashboard",
      "system",
      null,
      null,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(onInvalidated).toHaveBeenCalledTimes(1);
  });

  it("reports reconnecting and connected states", async () => {
    const { result } = renderHook(() =>
      useDashboardRealtime({ scope: "system", onInvalidated: vi.fn() }),
    );
    await flushPromises();

    expect(result.current).toBe("connected");

    act(() => signalR.reconnecting());
    expect(result.current).toBe("reconnecting");

    act(() => signalR.reconnect());
    await flushPromises();
    expect(result.current).toBe("connected");
  });

  it("waits for a pending start before stopping on unmount", async () => {
    let resolveStart: (() => void) | undefined;
    signalR.connection.start.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveStart = () => {
            signalR.connection.state = "Connected";
            resolve();
          };
        }),
    );

    const { unmount } = renderHook(() =>
      useDashboardRealtime({ scope: "system", onInvalidated: vi.fn() }),
    );

    expect(signalR.connection.start).toHaveBeenCalledTimes(1);
    unmount();
    expect(signalR.connection.stop).not.toHaveBeenCalled();

    await act(async () => {
      resolveStart?.();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(signalR.connection.invoke).not.toHaveBeenCalled();
    expect(signalR.connection.stop).toHaveBeenCalledTimes(1);
  });
});
