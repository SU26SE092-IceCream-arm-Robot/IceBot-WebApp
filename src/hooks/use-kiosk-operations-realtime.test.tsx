import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useKioskOperationsRealtime } from "@/hooks/use-kiosk-operations-realtime";

const signalR = vi.hoisted(() => {
  const eventHandlers = new Map<string, (payload: unknown) => void>();
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
    close() {
      connection.state = "Disconnected";
      closeHandler?.();
    },
    reset() {
      eventHandlers.clear();
      reconnectedHandler = undefined;
      closeHandler = undefined;
      connection.state = "Disconnected";
      connection.invoke.mockReset().mockResolvedValue(undefined);
      connection.off.mockClear();
      connection.on.mockClear();
      connection.onclose.mockClear();
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
    Disconnected: "Disconnected",
  },
  LogLevel: {
    Warning: 3,
  },
}));

vi.mock("@/lib/auth-session", () => ({
  getStoredAccessToken: vi.fn(() => "access-token"),
}));

vi.mock("@/lib/operations-hub-url", () => ({
  getOperationsHubUrl: vi.fn(() => "/api/backend/hubs/operations"),
}));

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useKioskOperationsRealtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    signalR.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries an initial connection failure and joins the kiosk", async () => {
    signalR.connection.start
      .mockRejectedValueOnce(new Error("backend unavailable"))
      .mockImplementationOnce(async () => {
        signalR.connection.state = "Connected";
      });

    renderHook(() =>
      useKioskOperationsRealtime(["kiosk-1"], vi.fn()),
    );
    await flushPromises();

    expect(signalR.connection.start).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(signalR.connection.start).toHaveBeenCalledTimes(2);
    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinKiosk",
      "kiosk-1",
    );
  });

  it("coalesces an inventory event burst into one refresh", async () => {
    const onInventoryChanged = vi.fn();
    renderHook(() =>
      useKioskOperationsRealtime(["kiosk-1"], onInventoryChanged),
    );
    await flushPromises();

    act(() => {
      signalR.emit("InventoryChanged", { kioskId: "kiosk-1" });
      signalR.emit("InventoryChanged", { kioskId: "kiosk-1" });
      signalR.emit("InventoryChanged", { kioskId: "kiosk-1" });
      signalR.emit("InventoryChanged", { kioskId: "other-kiosk" });
    });

    expect(onInventoryChanged).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(onInventoryChanged).toHaveBeenCalledTimes(1);
  });

  it("rejoins targets and refreshes after reconnect", async () => {
    const onInventoryChanged = vi.fn();
    renderHook(() =>
      useKioskOperationsRealtime(
        ["kiosk-2", "kiosk-1", "kiosk-1"],
        onInventoryChanged,
      ),
    );
    await flushPromises();
    signalR.connection.invoke.mockClear();

    act(() => signalR.reconnect());
    await flushPromises();

    expect(signalR.connection.invoke).toHaveBeenCalledTimes(2);
    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinKiosk",
      "kiosk-1",
    );
    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinKiosk",
      "kiosk-2",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(onInventoryChanged).toHaveBeenCalledTimes(1);
  });

  it("starts a new connection attempt after reconnect retries are exhausted", async () => {
    renderHook(() =>
      useKioskOperationsRealtime(["kiosk-1"], vi.fn()),
    );
    await flushPromises();
    signalR.connection.start.mockClear();

    act(() => signalR.close());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(signalR.connection.start).toHaveBeenCalledTimes(1);
    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinKiosk",
      "kiosk-1",
    );
  });

  it("cancels pending refresh work when unmounted", async () => {
    const onInventoryChanged = vi.fn();
    const { unmount } = renderHook(() =>
      useKioskOperationsRealtime(["kiosk-1"], onInventoryChanged),
    );
    await flushPromises();

    act(() => {
      signalR.emit("InventoryChanged", { kioskId: "kiosk-1" });
      unmount();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(onInventoryChanged).not.toHaveBeenCalled();
    expect(signalR.connection.off).toHaveBeenCalledWith("InventoryChanged");
    expect(signalR.connection.stop).toHaveBeenCalledTimes(1);
  });
});
