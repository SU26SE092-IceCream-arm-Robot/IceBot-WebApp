import type { PagedResult } from "@/types/accounts";

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
  status: string;
  positionLabel: string | null;
  firmwareVersion: string | null;
  installedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export type DeviceListResult = PagedResult<DeviceResult>;
