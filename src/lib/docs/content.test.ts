import { describe, expect, it } from "vitest";

import {
  DOCS_PAGES,
  getAdjacentDocsPages,
  getDocsHref,
  getDocsPage,
} from "@/lib/docs/content";

describe("docs content registry", () => {
  it("keeps every public docs route and section id unique", () => {
    const slugs = DOCS_PAGES.map((page) => page.slug);
    const sectionIds = DOCS_PAGES.flatMap((page) =>
      page.sections.map((section) => `${page.slug}:${section.id}`),
    );

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(DOCS_PAGES.every((page) => page.sections.length > 0)).toBe(true);
  });

  it("resolves docs routes without an authenticated dashboard prefix", () => {
    expect(getDocsHref("")).toBe("/docs");
    expect(getDocsHref("getting-started")).toBe("/docs/getting-started");
    expect(getDocsHref("getting-started")).not.toContain("dashboard");
    expect(getDocsPage("getting-started")?.title).toBe("Bắt đầu nhanh");
  });

  it("provides ordered previous and next navigation", () => {
    expect(getAdjacentDocsPages("").previous).toBeUndefined();
    expect(getAdjacentDocsPages("").next?.slug).toBe("getting-started");
    expect(getAdjacentDocsPages("realtime").next).toBeUndefined();
  });
});
