import type { KioskFleetItem } from "@/types";
import type { KioskManagementDetail } from "@/types/kiosk-detail";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";

function getStoreLabel(store: StoreResult | undefined, storeId: string): string {
  return store?.name ?? `Cửa hàng ${storeId}`;
}

export function toKioskFleetViewModel(
  metadata: KioskResult,
  store?: StoreResult,
): KioskFleetItem {
  return {
    managementId: metadata.id,
    kioskId: metadata.code,
    name: metadata.name,
    organizationId: metadata.organizationId,
    locationId: metadata.storeId,
    locationName: getStoreLabel(store, metadata.storeId),
    address: metadata.address ?? store?.address ?? null,
    serialNumber: metadata.serialNumber ?? null,
    lifecycleStatus: metadata.status,
    operationalState: metadata.operationalState,
    operationalStateReason: metadata.operationalStateReason ?? null,
    operationalStateChangedAt: metadata.operationalStateChangedAt ?? null,
    lastOnlineAt: metadata.lastOnlineAt ?? null,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt ?? null,
  };
}

export function toKioskDetailViewModel(
  metadata: KioskResult,
  store?: StoreResult,
): KioskManagementDetail {
  return {
    managementId: metadata.id,
    kioskId: metadata.code,
    name: metadata.name,
    organizationId: metadata.organizationId,
    locationId: metadata.storeId,
    locationName: getStoreLabel(store, metadata.storeId),
    address: metadata.address ?? store?.address ?? null,
    serialNumber: metadata.serialNumber ?? null,
    lifecycleStatus: metadata.status,
    operationalState: metadata.operationalState,
    operationalStateReason: metadata.operationalStateReason ?? null,
    operationalStateChangedAt: metadata.operationalStateChangedAt ?? null,
    lastOnlineAt: metadata.lastOnlineAt ?? null,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt ?? null,
    kioskType: metadata.kioskType,
    timeZone: metadata.timeZone,
    installedAt: metadata.installedAt ?? null,
    configurationVersion: metadata.configurationVersion,
    settingsSchemaVersion: metadata.settingsSchemaVersion,
    storeStatus: store?.status ?? null,
  };
}
