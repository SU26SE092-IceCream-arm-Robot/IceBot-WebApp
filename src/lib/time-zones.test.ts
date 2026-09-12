import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_ZONE, isValidIanaTimeZone } from "@/lib/time-zones";

describe("time zone helpers", () => {
  it("uses the canonical IANA identifier for Vietnam", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Asia/Ho_Chi_Minh");
    expect(isValidIanaTimeZone(DEFAULT_TIME_ZONE)).toBe(true);
  });

  it("accepts other valid IANA zones", () => {
    expect(isValidIanaTimeZone("Asia/Singapore")).toBe(true);
    expect(isValidIanaTimeZone("UTC")).toBe(true);
  });

  it("rejects empty and unknown zones", () => {
    expect(isValidIanaTimeZone(" ")).toBe(false);
    expect(isValidIanaTimeZone("Asia/Not_A_Real_City")).toBe(false);
  });
});
