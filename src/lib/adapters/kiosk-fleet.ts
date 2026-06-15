import { MOCK_KIOSK_DETAILS } from "@/lib/mocks/kiosk-detail";
import { MOCK_KIOSKS } from "@/lib/mocks/kiosks";
import type { Kiosk } from "@/types";
import type { KioskDetail } from "@/types/kiosk-detail";
import type { KioskResult, StoreResult } from "@/types/kiosk-management";

function getStableTemplateIndex(value: string, length: number): number {
  const hash = Array.from(value).reduce(
    (current, character) => (current * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );

  return length === 0 ? 0 : hash % length;
}

function getTelemetryTemplate(metadata: KioskResult): Kiosk {
  const matchingTemplate = MOCK_KIOSKS.find(
    (kiosk) => kiosk.kioskId.toLowerCase() === metadata.code.toLowerCase(),
  );

  return (
    matchingTemplate ??
    MOCK_KIOSKS[getStableTemplateIndex(metadata.id, MOCK_KIOSKS.length)]
  );
}

function getDetailTemplate(metadata: KioskResult): KioskDetail {
  const matchingTemplate = MOCK_KIOSK_DETAILS.find(
    (kiosk) => kiosk.kioskId.toLowerCase() === metadata.code.toLowerCase(),
  );

  return (
    matchingTemplate ??
    MOCK_KIOSK_DETAILS[
      getStableTemplateIndex(metadata.id, MOCK_KIOSK_DETAILS.length)
    ]
  );
}

function getStoreLabel(store: StoreResult | undefined, storeId: string): string {
  return store?.name ?? `Cửa hàng ${storeId}`;
}

export function toKioskFleetViewModel(
  metadata: KioskResult,
  store?: StoreResult,
): Kiosk {
  const telemetry = getTelemetryTemplate(metadata);

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
    lastOnlineAt: metadata.lastOnlineAt ?? null,
    status: telemetry.status,
    hardwareState: { ...telemetry.hardwareState },
    currentOrderId: telemetry.currentOrderId,
  };
}

export function toKioskDetailViewModel(
  metadata: KioskResult,
  store?: StoreResult,
): KioskDetail {
  const telemetry = getDetailTemplate(metadata);

  return {
    ...telemetry,
    managementId: metadata.id,
    kioskId: metadata.code,
    name: metadata.name,
    organizationId: metadata.organizationId,
    locationId: metadata.storeId,
    locationName: getStoreLabel(store, metadata.storeId),
    address: metadata.address ?? store?.address ?? null,
    serialNumber: metadata.serialNumber ?? null,
    lifecycleStatus: metadata.status,
    lastOnlineAt: metadata.lastOnlineAt ?? null,
    deviceSerial: metadata.serialNumber ?? "Chưa cập nhật",
  };
}
