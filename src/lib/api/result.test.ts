import { describe, expect, it } from "vitest";

import {
  getApiResultMessage,
  unwrapApiResult,
  unwrapPagedApiResult,
} from "@/lib/api/result";

describe("API result helpers", () => {
  it("prefers validation details over generic response messages", () => {
    expect(
      getApiResultMessage(
        {
          succeeded: false,
          statusCode: 400,
          message: "Request failed.",
          validationErrors: { name: ["Name is required."], code: ["Code exists."] },
        },
        "Fallback.",
      ),
    ).toBe("Name is required. Code exists.");
  });

  it("returns data only from a successful result", () => {
    expect(
      unwrapApiResult(
        { succeeded: true, statusCode: 200, data: { id: "release-1" } },
        "Fallback.",
      ),
    ).toEqual({ id: "release-1" });
  });

  it("does not convert a failed result into undefined data", () => {
    expect(() =>
      unwrapApiResult(
        { succeeded: false, statusCode: 409, businessError: "Conflict." },
        "Fallback.",
      ),
    ).toThrow("Conflict.");
  });

  it("preserves a valid paging envelope", () => {
    const result = {
      succeeded: true,
      statusCode: 200,
      data: [{ id: "item-1" }],
      pagination: { page: 1 },
    };

    expect(unwrapPagedApiResult(result, "Fallback.")).toBe(result);
  });
});
