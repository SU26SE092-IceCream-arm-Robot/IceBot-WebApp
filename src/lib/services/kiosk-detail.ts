import axios from "axios";

import { toKioskDetailViewModel } from "@/lib/adapters/kiosk-fleet";
import {
  getKioskManagementErrorMessage,
  getManagementKioskById,
} from "@/lib/services/kiosk-management";
import {
  getManagementStoreById,
  getStoresErrorMessage,
} from "@/lib/services/stores";
import type { ApiResult } from "@/types";
import type { KioskManagementDetail } from "@/types/kiosk-detail";
import type { StoreResult } from "@/types/kiosk-management";

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GetKioskDetailParams {
  kioskId: string;
}

export type GetKioskDetailResult =
  | {
      outcome: "SUCCESS";
      kiosk: KioskManagementDetail;
      metadataWarning?: string;
    }
  | { outcome: "NOT_FOUND" }
  | { outcome: "FORBIDDEN" }
  | { outcome: "ERROR"; message: string };

export async function getKioskDetail(
  params: GetKioskDetailParams,
  signal?: AbortSignal,
): Promise<GetKioskDetailResult> {
  if (!GUID_PATTERN.test(params.kioskId)) {
    return {
      outcome: "ERROR",
      message: "Mã định danh kiosk không hợp lệ.",
    };
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

    return {
      outcome: "ERROR",
      message: getKioskManagementErrorMessage(
        error,
        "Không thể tải thông tin kiosk.",
      ),
    };
  }
}
