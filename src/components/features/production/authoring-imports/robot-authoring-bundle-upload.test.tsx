import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RobotAuthoringBundleUpload } from "@/components/features/production/authoring-imports/robot-authoring-bundle-upload";

describe("RobotAuthoringBundleUpload", () => {
  it("rejects a non-ZIP file before calling the upload mutation", () => {
    const onUpload = vi.fn();
    render(
      <RobotAuthoringBundleUpload
        canUpload
        disabled={false}
        isUploading={false}
        onUpload={onUpload}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("Chọn bundle Fairino định dạng ZIP"),
      {
        target: {
          files: [
            new File(["not-a-bundle"], "program.lua", { type: "text/plain" }),
          ],
        },
      },
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Chỉ chấp nhận bundle định dạng .zip.",
    );
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("uploads a valid ZIP only after the user confirms import", async () => {
    const scrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    const onUpload = vi.fn().mockResolvedValue(true);
    render(
      <RobotAuthoringBundleUpload
        canUpload
        disabled={false}
        isUploading={false}
        onUpload={onUpload}
      />,
    );
    const file = new File(["bundle"], "fairino-export.zip", {
      type: "application/zip",
    });

    fireEvent.change(
      screen.getByLabelText("Chọn bundle Fairino định dạng ZIP"),
      { target: { files: [file] } },
    );
    expect(screen.getByText("fairino-export.zip")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nhập chương trình" }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
    expect(screen.queryByText("fairino-export.zip")).not.toBeInTheDocument();
    await waitFor(() => expect(scrollTo).toHaveBeenCalled());
    scrollTo.mockRestore();
  });

  it("keeps the dashboard viewport after a successful upload replaces the upload action", async () => {
    const requestAnimationFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        return window.setTimeout(() => callback(0), 0);
      });
    const scrollContainerRef: { current: HTMLElement | null } = {
      current: null,
    };
    const onUpload = vi.fn().mockImplementation(async () => {
      if (scrollContainerRef.current)
        scrollContainerRef.current.scrollTop = 1200;
      return true;
    });

    render(
      <main data-testid="dashboard-scroll" style={{ overflowY: "auto" }}>
        <RobotAuthoringBundleUpload
          canUpload
          disabled={false}
          isUploading={false}
          onUpload={onUpload}
        />
      </main>,
    );
    const scrollContainer = screen.getByTestId("dashboard-scroll");
    scrollContainerRef.current = scrollContainer;
    Object.defineProperty(scrollContainer, "scrollHeight", {
      configurable: true,
      value: 1600,
    });
    Object.defineProperty(scrollContainer, "clientHeight", {
      configurable: true,
      value: 600,
    });
    scrollContainer.scrollTop = 420;
    const file = new File(["bundle"], "fairino-export.zip", {
      type: "application/zip",
    });

    fireEvent.change(
      screen.getByLabelText("Chọn bundle Fairino định dạng ZIP"),
      { target: { files: [file] } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Nhập chương trình" }));

    await waitFor(() => expect(scrollContainer.scrollTop).toBe(420));
    expect(
      screen.getByRole("button", { name: "Chọn file .zip" }),
    ).toHaveFocus();
    requestAnimationFrame.mockRestore();
  });

  it("shows a read-only state when the account lacks upload access", () => {
    render(
      <RobotAuthoringBundleUpload
        canUpload={false}
        disabled={false}
        isUploading={false}
        onUpload={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Bạn có thể xem các gói đã nhập, nhưng không có quyền tải bundle mới trong tổ chức này.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Chọn bundle Fairino định dạng ZIP"),
    ).not.toBeInTheDocument();
  });
});
