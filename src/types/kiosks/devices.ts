import type { ApiResult } from "@/types";

export type DeviceStatus =
  | "Provisioning"
  | "Online"
  | "Offline"
  | "Maintenance"
  | "Error"
  | "Disabled"
  | "Retired";

export interface DeviceResult {
  id: string;
  kioskId: string | null;
  kioskCode: string | null;
  storeId: string | null;
  organizationId: string | null;
  deviceTypeId: number;
  deviceTypeCode: string;
  deviceModelId: string | null;
  deviceModelCode: string | null;
  code: string;
  name: string;
  serialNumber: string | null;
  status: DeviceStatus;
  positionLabel: string | null;
  firmwareVersion: string | null;
  installedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateDeviceRequest {
  deviceTypeId: number;
  deviceModelId?: string | null;
  code: string;
  name: string;
  serialNumber?: string | null;
  positionLabel?: string | null;
  firmwareVersion?: string | null;
  installedAt?: string | null;
}

export type UpdateDeviceRequest = Omit<CreateDeviceRequest, "code">;

export interface SetDeviceStatusRequest {
  status: Exclude<DeviceStatus, "Retired">;
}

export interface ReplaceDeviceRequest {
  replacementDeviceId: string;
  reason: string;
}

export interface DeviceReplacementResult {
  sourceDeviceId: string;
  replacementDeviceId: string;
  reboundContainerCount: number;
  replacementDispenserStateIds: string[];
}

export type DeviceListResult = ApiResult<DeviceResult[]>;
