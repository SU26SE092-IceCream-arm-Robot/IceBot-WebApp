import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocsChatWidget } from "@/components/features/docs/docs-chat-widget";

describe("DocsChatWidget", () => {
  it("opens as an accessible preview and renders a local reply", async () => {
    render(<DocsChatWidget />);

    fireEvent.click(screen.getByRole("button", { name: "Mở trợ lý tài liệu" }));
    expect(screen.getByRole("dialog", { name: "Trợ lý tài liệu IceBot" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Câu hỏi cho trợ lý tài liệu"), {
      target: { value: "Tích hợp API thế nào?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));

    expect(screen.getByText("Tích hợp API thế nào?")).toBeInTheDocument();
    expect(await screen.findByText(/phản hồi demo cục bộ/i)).toBeInTheDocument();
  });

  it("delegates messages to the future API adapter", async () => {
    const adapter = vi.fn().mockResolvedValue("Phản hồi từ adapter");
    render(<DocsChatWidget onSendMessage={adapter} />);

    fireEvent.click(screen.getByRole("button", { name: "Mở trợ lý tài liệu" }));
    fireEvent.change(screen.getByLabelText("Câu hỏi cho trợ lý tài liệu"), {
      target: { value: "Kết nối realtime" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi câu hỏi" }));

    await waitFor(() => expect(adapter).toHaveBeenCalledWith("Kết nối realtime"));
    expect(await screen.findByText("Phản hồi từ adapter")).toBeInTheDocument();
  });
});
