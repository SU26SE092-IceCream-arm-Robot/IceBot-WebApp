import { describe, expect, it } from "vitest";

import { getStoreOpeningState } from "@/lib/presenters/sales-admission";
import type { StoreResult } from "@/types/kiosks/management";

const baseStore: Pick<StoreResult, "openingHours" | "timeZone"> = {
  timeZone: "Asia/Bangkok",
  openingHours: [
    {
      dayOfWeek: "Monday",
      isClosed: false,
      opensAt: "09:00:00",
      closesAt: "17:00:00",
    },
  ],
};

describe("store opening-hours presentation", () => {
  it("distinguishes open and closed schedule state in the Store time zone", () => {
    expect(
      getStoreOpeningState(baseStore, new Date("2026-07-27T03:00:00Z")),
    ).toBe("OPEN");
    expect(
      getStoreOpeningState(baseStore, new Date("2026-07-27T13:00:00Z")),
    ).toBe("CLOSED");
  });

  it("supports an overnight opening period from the previous day", () => {
    const overnightStore = {
      ...baseStore,
      openingHours: [
        {
          dayOfWeek: "Monday" as const,
          isClosed: false,
          opensAt: "22:00:00",
          closesAt: "02:00:00",
        },
      ],
    };

    expect(
      getStoreOpeningState(
        overnightStore,
        new Date("2026-07-27T18:00:00Z"),
      ),
    ).toBe("OPEN");
  });

  it("keeps an empty schedule distinct from a closed Store", () => {
    expect(
      getStoreOpeningState(
        { timeZone: "Asia/Bangkok", openingHours: [] },
        new Date("2026-07-27T03:00:00Z"),
      ),
    ).toBe("UNRESTRICTED");
  });
});
