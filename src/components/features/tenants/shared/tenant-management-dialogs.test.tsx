import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StoreFormDialog } from "@/components/features/tenants/shared/tenant-management-dialogs";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zones";

describe("StoreFormDialog", () => {
  it("uses the Vietnam default and explains the direct-create workflow", () => {
    render(
      <StoreFormDialog
        organizationName="Kem Tự Động"
        store={null}
        open
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        existingStores={[]}
      />,
    );

    expect(screen.getByLabelText(/Múi giờ/)).toHaveValue(DEFAULT_TIME_ZONE);
    expect(
      screen.getByText(/không khởi động quy trình Thiết lập nhanh điểm bán/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Giới hạn thời gian bán")).toBeInTheDocument();
  });

  it("blocks an invalid IANA time zone before calling the API", () => {
    const onCreate = vi.fn();
    render(
      <StoreFormDialog
        organizationName="Kem Tự Động"
        store={null}
        open
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        existingStores={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Mã cửa hàng/), {
      target: { value: "HCM01" },
    });
    fireEvent.change(screen.getByLabelText(/Tên cửa hàng/), {
      target: { value: "Cửa hàng Quận 1" },
    });
    fireEvent.change(screen.getByLabelText(/Múi giờ/), {
      target: { value: "Asia/Invalid_City" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo cửa hàng" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Múi giờ không hợp lệ",
    );
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("submits the configured opening hours instead of silently dropping them", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <StoreFormDialog
        organizationName="Kem Tự Động"
        store={null}
        open
        isSubmitting={false}
        errorMessage={null}
        onOpenChange={vi.fn()}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        existingStores={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Mã cửa hàng/), {
      target: { value: "HCM01" },
    });
    fireEvent.change(screen.getByLabelText(/Tên cửa hàng/), {
      target: { value: "Cửa hàng Quận 1" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Giới hạn theo lịch" }),
    );
    fireEvent.click(
      screen.getAllByRole("checkbox", { name: "Đóng cửa" })[0],
    );
    fireEvent.change(screen.getByLabelText("Giờ mở cửa Thứ 2"), {
      target: { value: "08:00" },
    });
    fireEvent.change(screen.getByLabelText("Giờ đóng cửa Thứ 2"), {
      target: { value: "22:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tạo cửa hàng" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "HCM01",
          timeZone: DEFAULT_TIME_ZONE,
          openingHours: expect.arrayContaining([
            {
              dayOfWeek: "Monday",
              isClosed: false,
              opensAt: "08:00:00",
              closesAt: "22:00:00",
            },
          ]),
        }),
      );
    });
  });
});
