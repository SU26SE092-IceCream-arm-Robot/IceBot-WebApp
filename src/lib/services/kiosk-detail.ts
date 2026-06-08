import { MOCK_KIOSK_DETAILS } from "@/lib/mocks/kiosk-detail";
import type { DashboardRole } from "@/types";
import type { KioskDetail } from "@/types/kiosk-detail";

const MOCK_DELAY_MS = 260;

export interface GetKioskDetailParams {
  kioskId: string;
  role: DashboardRole;
  locationIds?: string[];
}

export type GetKioskDetailResult =
  | { outcome: "SUCCESS"; kiosk: KioskDetail }
  | { outcome: "NOT_FOUND" }
  | { outcome: "FORBIDDEN" };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getKioskDetail(
  params: GetKioskDetailParams
): Promise<GetKioskDetailResult> {
  await delay(MOCK_DELAY_MS);

  const kiosk = MOCK_KIOSK_DETAILS.find((item) => item.kioskId === params.kioskId);

  if (!kiosk) {
    return { outcome: "NOT_FOUND" };
  }

  if (
    params.role === "LOCATION_OWNER" &&
    (!params.locationIds || !params.locationIds.includes(kiosk.locationId))
  ) {
    return { outcome: "FORBIDDEN" };
  }

  return { outcome: "SUCCESS", kiosk };
}
