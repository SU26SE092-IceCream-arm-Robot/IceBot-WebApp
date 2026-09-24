import { describe, expect, it } from "vitest";

import {
  DOCS_GROUPS,
  DOCS_PAGES,
  getAdjacentDocsPages,
  getDocsHref,
  getDocsPage,
} from "@/lib/docs/content";

describe("Docs content registry", () => {
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
    expect(getDocsPage("getting-started")?.title).toBe("Bắt đầu với IceBot");
  });

  it("provides ordered previous and next navigation", () => {
    expect(getAdjacentDocsPages("").previous).toBeUndefined();
    expect(getAdjacentDocsPages("").next?.slug).toBe("getting-started");
    expect(getAdjacentDocsPages("operations").next).toBeUndefined();
  });

  it("exposes the four Report 6 user-guide pages in the docs router", () => {
    expect(DOCS_GROUPS).toContain("Hướng dẫn sử dụng");
    expect(getDocsPage("admin-web")?.group).toBe("Hướng dẫn sử dụng");
    expect(getDocsPage("kiosk")?.group).toBe("Hướng dẫn sử dụng");
    expect(getDocsPage("full-edge")?.group).toBe("Hướng dẫn sử dụng");
    expect(getDocsPage("fairobot-studio")?.group).toBe("Hướng dẫn sử dụng");
  });

  it("keeps every published figure accessible and described", () => {
    const figures = DOCS_PAGES.flatMap((page) => page.sections.flatMap((section) => section.figures ?? []));

    expect(figures.length).toBeGreaterThan(0);
    for (const figure of figures) {
      expect(figure.src).toMatch(/^\/docs\/report6\/.+\.png$/);
      expect(figure.alt.trim()).not.toBe("");
      expect(figure.caption.trim()).not.toBe("");
    }
  });
});
