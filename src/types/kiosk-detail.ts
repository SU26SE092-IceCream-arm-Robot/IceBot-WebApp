import type { Kiosk } from "@/types";

export type KioskOperationMode = "READY" | "LOCKED" | "MAINTENANCE";

export type KioskEventSeverity = "INFO" | "WARNING" | "ERROR";

export interface KioskTemperaturePoint {
  timestamp: string;
  temperature: number;
}

export interface KioskEvent {
  id: string;
  timestamp: string;
  severity: KioskEventSeverity;
  title: string;
  description: string;
  code?: string;
}

export interface KioskDetail extends Kiosk {
  deviceSerial: string;
  firmwareVersion: string;
  operationMode: KioskOperationMode;
  temperatureHistory: KioskTemperaturePoint[];
  recentEvents: KioskEvent[];
}
