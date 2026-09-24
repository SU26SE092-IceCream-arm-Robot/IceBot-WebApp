import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocsChatWidget } from "@/components/features/docs/docs-chat-widget";

describe("DocsChatWidget", () => {
  it("opens as the documentation assistant and renders the local fallback", async () => {
    render(<DocsChatWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Mở trợ lý tài liệu" }));
    expect(screen.getByRole("dialog", { name: "Trợ lý tài liệu IceBot" })).toBeInTheDocument();
    expect(screen.getByText("Hỏi về cách sử dụng IceBot")).toBeInTheDocument();
    expect(screen.queryByText(/xem trước|demo|mock/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Câu hỏi cho trợ lý tài liệu"), {
      target: { value: "Tích hợp API thế nào?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));

    expect(screen.getByText("Tích hợp API thế nào?")).toBeInTheDocument();
    expect(await screen.findByText(/chưa được kết nối/i)).toBeInTheDocument();
  });

  it("delegates messages to the future API adapter", async () => {
    const adapter = vi.fn().mockResolvedValue("Phản hồi từ adapter");
    render(<DocsChatWidget onSendMessage={adapter} />);

    fireEvent.click(screen.getByRole("button", { name: "Mở trợ lý tài liệu" }));
    fireEvent.change(screen.getByLabelText("Câu hỏi cho trợ lý tài liệu"), {
      target: { value: "Kết nối realtime" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));

    await waitFor(() => expect(adapter).toHaveBeenCalled());
    expect(adapter.mock.calls[0]?.[0]).toBe("Kết nối realtime");
    expect(adapter.mock.calls[0]?.[1]).toEqual([]);
    expect(adapter.mock.calls[0]?.[2]).toBeInstanceOf(AbortSignal);
    expect(await screen.findByText("Phản hồi từ adapter")).toBeInTheDocument();
  });

  it("shows a user-facing error and offers retry without exposing API details", async () => {
    const adapter = vi.fn().mockRejectedValue(new Error("Chat API đang quá tải."));
    render(<DocsChatWidget onSendMessage={adapter} />);

    fireEvent.click(screen.getByRole("button", { name: "Mở trợ lý tài liệu" }));
    fireEvent.change(screen.getByLabelText("Câu hỏi cho trợ lý tài liệu"), {
      target: { value: "Kiểm tra dịch vụ" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));

    expect(await screen.findByText(/trợ lý hiện chưa thể trả lời/i)).toBeInTheDocument();
    expect(screen.queryByText("Chat API đang quá tải.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
