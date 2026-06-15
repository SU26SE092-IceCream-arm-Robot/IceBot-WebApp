import axios from "axios";

import { toKioskDetailViewModel } from "@/lib/adapters/kiosk-fleet";
import { MOCK_KIOSK_DETAILS } from "@/lib/mocks/kiosk-detail";
import {
  getKioskManagementErrorMessage,
  getManagementKioskById,
} from "@/lib/services/kiosk-management";
import {
  getManagementStoreById,
  getStoresErrorMessage,
} from "@/lib/services/stores";
import type { ApiResult, DashboardRole } from "@/types";
import type { KioskDetail } from "@/types/kiosk-detail";
import type { StoreResult } from "@/types/kiosk-management";

const MOCK_DELAY_MS = 260;
const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GetKioskDetailParams {
  kioskId: string;
  role: DashboardRole;
  locationIds?: string[];
}

export type KioskDetailMetadataSource = "API" | "MOCK";

export type GetKioskDetailResult =
  | {
      outcome: "SUCCESS";
      kiosk: KioskDetail;
      metadataSource: KioskDetailMetadataSource;
      metadataWarning?: string;
    }
  | { outcome: "NOT_FOUND" }
  | { outcome: "FORBIDDEN" }
  | { outcome: "ERROR"; message: string };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function findScopedMockKiosk(
  params: GetKioskDetailParams,
  allowTemplateFallback = false,
): GetKioskDetailResult {
  const scopedKiosks =
    params.role === "LOCATION_OWNER"
      ? MOCK_KIOSK_DETAILS.filter(
          (item) =>
            params.locationIds?.includes(item.locationId) ?? false,
        )
      : MOCK_KIOSK_DETAILS;
  const exactMatch = scopedKiosks.find(
    (item) => item.kioskId === params.kioskId,
  );
  const fallbackIndex = Array.from(params.kioskId).reduce(
    (hash, character) =>
      (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  const kiosk =
    exactMatch ??
    (allowTemplateFallback && scopedKiosks.length > 0
      ? scopedKiosks[fallbackIndex % scopedKiosks.length]
      : undefined);

  if (!kiosk) {
    return params.role === "LOCATION_OWNER"
      ? { outcome: "FORBIDDEN" }
      : { outcome: "NOT_FOUND" };
  }

  return {
    outcome: "SUCCESS",
    kiosk: allowTemplateFallback
      ? { ...kiosk, managementId: params.kioskId }
      : kiosk,
    metadataSource: "MOCK",
    metadataWarning:
      "Metadata quản lý và telemetry trên trang này đang được mô phỏng.",
  };
}

export async function getMockKioskDetail(
  params: GetKioskDetailParams,
): Promise<GetKioskDetailResult> {
  await delay(MOCK_DELAY_MS);
  return findScopedMockKiosk(params);
}

export async function getKioskDetail(
  params: GetKioskDetailParams,
  signal?: AbortSignal,
): Promise<GetKioskDetailResult> {
  if (!GUID_PATTERN.test(params.kioskId)) {
    return getMockKioskDetail(params);
  }

  try {
    const metadata = await getManagementKioskById(params.kioskId, signal);
    let store: StoreResult | undefined;
    let metadataWarning: string | undefined;

    try {
      store = await getManagementStoreById(metadata.storeId, signal);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      metadataWarning = `${getStoresErrorMessage(error)} Tên địa điểm tạm hiển thị theo Store ID.`;
    }

    return {
      outcome: "SUCCESS",
      kiosk: toKioskDetailViewModel(metadata, store),
      metadataSource: "API",
      metadataWarning,
    };
  } catch (error) {
    if (axios.isAxiosError<ApiResult<unknown>>(error)) {
      if (error.response?.status === 403) {
        return { outcome: "FORBIDDEN" };
      }

      if (error.response?.status === 404) {
        return { outcome: "NOT_FOUND" };
      }
    }

    const fallback = findScopedMockKiosk(params, true);
    if (fallback.outcome === "SUCCESS") {
      return {
        ...fallback,
        metadataWarning: `${getKioskManagementErrorMessage(
          error,
          "Không thể tải metadata kiosk từ API.",
        )} Đang hiển thị dữ liệu mô phỏng.`,
      };
    }

    return {
      outcome: "ERROR",
      message: getKioskManagementErrorMessage(
        error,
        "Không thể tải metadata kiosk từ backend.",
      ),
    };
  }
}
