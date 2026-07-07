import type { StoreOpeningHoursDay } from "@/types/tenant-management";

export type KioskLifecycleStatus =
  | "Provisioning"
  | "Active"
  | "Offline"
  | "Maintenance"
  | "Disabled"
  | "Retired";

export interface KioskResult {
  id: string;
  organizationId: string;
  storeId: string;
  code: string;
  name: string;
  kioskType: string;
  status: KioskLifecycleStatus;
  serialNumber?: string | null;
  timeZone: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  installedAt?: string | null;
  lastOnlineAt?: string | null;
  supportsOfflineMode: boolean;
  configurationVersion: number;
  settingsSchemaVersion: number;
  settingsJson?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface StoreResult {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  storeType: string;
  status: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  timeZone: string;
  latitude?: number | null;
  longitude?: number | null;
  phoneNumber?: string | null;
  email?: string | null;
  openingHours: StoreOpeningHoursDay[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface ManagementKiosksQuery {
  organizationId?: string;
  storeId?: string;
  status?: KioskLifecycleStatus;
  search?: string;
}

export interface ManagementStoresQuery {
  organizationId?: string;
  status?: string;
  search?: string;
}
