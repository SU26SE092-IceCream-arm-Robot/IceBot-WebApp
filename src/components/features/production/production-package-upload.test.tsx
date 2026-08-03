import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductionPackageUpload } from "@/components/features/production/production-package-upload";

describe("ProductionPackageUpload", () => {
  it("rejects a non-ZIP file before calling the upload mutation", () => {
    const onUpload = vi.fn();
    render(<ProductionPackageUpload canUpload disabled={false} isUploading={false} onUpload={onUpload} />);

    fireEvent.change(screen.getByLabelText("Chọn bundle Fairino định dạng ZIP"), {
      target: { files: [new File(["not-a-bundle"], "program.lua", { type: "text/plain" })] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Chỉ chấp nhận bundle định dạng .zip.");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uploads a valid ZIP only after the user confirms import", async () => {
    const onUpload = vi.fn().mockResolvedValue(true);
    render(<ProductionPackageUpload canUpload disabled={false} isUploading={false} onUpload={onUpload} />);
    const file = new File(["bundle"], "fairino-export.zip", { type: "application/zip" });

    fireEvent.change(screen.getByLabelText("Chọn bundle Fairino định dạng ZIP"), { target: { files: [file] } });
    expect(screen.getByText("fairino-export.zip")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nhập bundle" }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
    expect(screen.queryByText("fairino-export.zip")).not.toBeInTheDocument();
  });

  it("shows a read-only state when the account lacks upload access", () => {
    render(<ProductionPackageUpload canUpload={false} disabled={false} isUploading={false} onUpload={vi.fn()} />);

    expect(screen.getByText("Bạn có thể xem các gói đã nhập, nhưng không có quyền tải bundle mới trong tổ chức này.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Chọn bundle Fairino định dạng ZIP")).not.toBeInTheDocument();
  });
});
