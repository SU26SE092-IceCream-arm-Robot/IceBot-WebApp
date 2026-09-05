import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOrderRealtime } from "@/hooks/realtime/use-order-realtime";

const signalR = vi.hoisted(() => {
  const eventHandlers = new Map<string, (payload: unknown) => void>();

  const connection = {
    state: "Disconnected",
    invoke: vi.fn(),
    off: vi.fn((eventName: string) => eventHandlers.delete(eventName)),
    on: vi.fn((eventName: string, handler: (payload: unknown) => void) => {
      eventHandlers.set(eventName, handler);
    }),
    onclose: vi.fn(),
    onreconnected: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  return {
    connection,
    emit(eventName: string, payload: unknown) {
      eventHandlers.get(eventName)?.(payload);
    },
    reset() {
      eventHandlers.clear();
      connection.state = "Disconnected";
      connection.invoke.mockReset().mockResolvedValue(undefined);
      connection.off.mockClear();
      connection.on.mockClear();
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
  getOrdersHubUrl: vi.fn(() => "/api/backend/hubs/orders"),
}));

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useOrderRealtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    signalR.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("joins order group and receives OrderStatusChanged event", async () => {
    const onOrderStatusChanged = vi.fn();
    renderHook(() =>
      useOrderRealtime({
        orderId: "order-123",
        onOrderStatusChanged,
      }),
    );
    await flushPromises();

    expect(signalR.connection.start).toHaveBeenCalledTimes(1);
    expect(signalR.connection.invoke).toHaveBeenCalledWith(
      "JoinOrder",
      "order-123",
    );

    act(() => {
      signalR.emit("OrderStatusChanged", {
        orderId: "order-123",
        newStatus: "PREPARING",
      });
    });

    expect(onOrderStatusChanged).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-123", newStatus: "PREPARING" }),
    );
  });

  it("ignores events for other orderIds", async () => {
    const onOrderStatusChanged = vi.fn();
    renderHook(() =>
      useOrderRealtime({
        orderId: "order-123",
        onOrderStatusChanged,
      }),
    );
    await flushPromises();

    act(() => {
      signalR.emit("OrderStatusChanged", {
        orderId: "other-order",
        newStatus: "COMPLETED",
      });
    });

    expect(onOrderStatusChanged).not.toHaveBeenCalled();
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
      useOrderRealtime({ orderId: "order-123" }),
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
