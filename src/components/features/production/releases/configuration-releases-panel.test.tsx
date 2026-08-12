import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConfigurationReleasesPanel } from "@/components/features/production/releases/configuration-releases-panel";

vi.mock("@/hooks/production/use-configuration-releases", () => ({
  useConfigurationReleases: () => ({
    releases: [
      {
        id: "release-12",
        releaseNumber: 12,
        status: "Published",
        routeCount: 3,
        releaseChecksum: "checksum",
      },
    ],
    authoringOptions: null,
    productionProgramBindings: [],
    isLoading: false,
    isMutating: false,
    errorMessage: null,
    refreshWarning: null,
    refresh: vi.fn(),
    createRelease: vi.fn(),
    publish: vi.fn(),
    discard: vi.fn(),
    retire: vi.fn(),
    loadEditor: vi.fn(),
    cancelEditorLoad: vi.fn(),
    replaceRoutes: vi.fn(),
  }),
}));

describe("ConfigurationReleasesPanel deployment handoff", () => {
  it("shows deployment to a scoped deployer without requiring publish permission", () => {
    render(
      <ConfigurationReleasesPanel
        organizationId="org-1"
        canManage={false}
        canDeploy
        selectedReleaseId={null}
        onSelectedReleaseChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Triển khai tới kiosk/i }),
    ).toHaveAttribute(
      "href",
      "/kiosks?organizationId=org-1&releaseId=release-12",
    );
    expect(
      screen.queryByRole("button", { name: /Ngừng sử dụng/i }),
    ).not.toBeInTheDocument();
  });
});
