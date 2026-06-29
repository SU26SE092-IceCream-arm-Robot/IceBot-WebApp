import type { Kiosk } from "@/types";
import type { KioskFleetItem } from "@/types";

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

export interface KioskManagementDetail extends KioskFleetItem {
  kioskType: string;
  timeZone: string;
  installedAt?: string | null;
  supportsOfflineMode: boolean;
  configurationVersion: number;
  settingsSchemaVersion: number;
  storeStatus?: string | null;
}

export type KioskHeartbeatStatus = "Online" | "Degraded" | "Offline";

export interface KioskHeartbeatResult {
  id: string;
  kioskId: string;
  nodeId: string;
  originNodeId: string;
  heartbeatSequence?: number | null;
  reportedAt: string;
  receivedAt: string;
  status: KioskHeartbeatStatus;
  robotStatus?: string | null;
  networkStatus?: string | null;
  appVersion?: string | null;
  firmwareVersion?: string | null;
  cpuUsagePercent?: number | null;
  memoryUsagePercent?: number | null;
  diskUsagePercent?: number | null;
  pendingSyncEventCount: number;
}

export type DeviceEventSeverity =
  | "Debug"
  | "Info"
  | "Warning"
  | "Error"
  | "Critical";

export interface KioskDeviceEventResult {
  id: string;
  deviceId: string;
  kioskId?: string | null;
  eventId: string;
  originNodeId: string;
  correlationId?: string | null;
  causationId?: string | null;
  eventType: string;
  severity: DeviceEventSeverity;
  message?: string | null;
  occurredAt: string;
}

export interface KioskTelemetryPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface KioskTelemetryPage<T> {
  data: T[];
  pagination: KioskTelemetryPagination;
}
