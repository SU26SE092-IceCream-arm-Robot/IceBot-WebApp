import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductionProgramBindingsPanel } from "@/components/features/production/bindings/production-program-bindings-panel";
import {
  getConfigurationReleaseAuthoringOptions,
  listProductionProgramBindings,
} from "@/lib/services/production/operations";
import type { ConfigurationReleaseAuthoringOptions } from "@/types/production/operations";

vi.mock("@/lib/services/production/operations", () => ({
  createProductionProgramBinding: vi.fn(),
  getConfigurationReleaseAuthoringOptions: vi.fn(),
  getProductionOperationsErrorMessage: (
    error: unknown,
    fallbackMessage: string,
  ) => (error instanceof Error ? error.message : fallbackMessage),
  listProductionProgramBindings: vi.fn(),
  retireProductionProgramBinding: vi.fn(),
}));

const options = {
  productVariants: [],
  recipes: [
    {
      id: "recipe-1",
      productId: "product-1",
      productCode: "ICE-CREAM",
      productName: "Kem vani",
      productVariantId: "variant-1",
      productVariantCode: "DEFAULT",
      productVariantName: "Mặc định",
      code: "RECIPE-VANILLA",
      name: "Công thức vani",
      version: 1,
      status: "Published",
      isDefault: true,
      productionOptionCandidates: [],
    },
  ],
  robotPrograms: [
    {
      id: "program-1",
      code: "PROGRAM-VANILLA",
      name: "Chương trình vani",
      scopeType: "Organization",
      programManifestChecksum: "checksum",
      artifactCount: 1,
      workcellCapabilityCodes: [],
    },
  ],
  workcellCapabilities: [],
} satisfies ConfigurationReleaseAuthoringOptions;

describe("ProductionProgramBindingsPanel", () => {
  beforeEach(() => {
    vi.mocked(getConfigurationReleaseAuthoringOptions).mockResolvedValue(
      options,
    );
  });

  it("keeps Recipe and Robot Program selectable when the bindings list fails", async () => {
    vi.mocked(listProductionProgramBindings).mockRejectedValue(
      new Error("Không thể tải danh sách liên kết hiện có."),
    );

    render(
      <ProductionProgramBindingsPanel
        organizationId="organization-1"
        canManage
      />,
    );

    const recipeSelect = await screen.findByRole("combobox", {
      name: "Recipe",
    });
    const programSelect = screen.getByRole("combobox", {
      name: "Robot Program",
    });
    await waitFor(() => expect(recipeSelect).toBeEnabled());
    expect(programSelect).toBeEnabled();
    expect(
      screen.getByText("Chưa tải được các liên kết hiện có."),
    ).toBeInTheDocument();

    fireEvent.click(recipeSelect);
    fireEvent.click(await screen.findByText(/Kem vani \/ Mặc định/));
    await waitFor(() =>
      expect(recipeSelect).toHaveTextContent("Kem vani · Mặc định"),
    );

    fireEvent.click(programSelect);
    fireEvent.click(await screen.findByText(/Chương trình vani \/ PROGRAM/));
    await waitFor(() =>
      expect(programSelect).toHaveTextContent(
        "Chương trình vani · PROGRAM-VANILLA",
      ),
    );

    expect(screen.getByRole("button", { name: "Tạo liên kết" })).toBeDisabled();
  });
});
