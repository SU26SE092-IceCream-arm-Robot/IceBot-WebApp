"use client";

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef } from "react";

import { getStoredAccessToken } from "@/lib/auth-session";
import { getOperationsHubUrl } from "@/lib/operations-hub-url";

interface InventoryChangedEvent {
  kioskId: string;
}

export function useKioskOperationsRealtime(
  kioskIds: readonly string[],
  onInventoryChanged: () => void,
) {
  const onInventoryChangedRef = useRef(onInventoryChanged);
  const kioskKey = [...new Set(kioskIds)].sort().join(",");

  useEffect(() => {
    onInventoryChangedRef.current = onInventoryChanged;
  }, [onInventoryChanged]);

  useEffect(() => {
    const targets = kioskKey ? kioskKey.split(",") : [];
    if (targets.length === 0) return;

    const connection = new HubConnectionBuilder()
      .withUrl(getOperationsHubUrl(), {
        accessTokenFactory: () => getStoredAccessToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    const joinTargets = async () => {
      await Promise.all(targets.map((kioskId) => connection.invoke("JoinKiosk", kioskId)));
    };

    connection.on("InventoryChanged", (event: InventoryChangedEvent) => {
      if (targets.includes(event.kioskId)) onInventoryChangedRef.current();
    });
    connection.onreconnected(() => joinTargets().then(() => onInventoryChangedRef.current()).catch(() => undefined));
    void connection.start().then(joinTargets).catch(() => undefined);

    return () => {
      connection.off("InventoryChanged");
      void connection.stop();
    };
  }, [kioskKey]);
}
