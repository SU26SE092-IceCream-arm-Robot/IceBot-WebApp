import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DocsMarkdown } from "@/components/features/docs/docs-markdown";

describe("DocsMarkdown", () => {
  it("renders bold headings and list items instead of exposing markdown markers", () => {
    render(
      <DocsMarkdown
        content={
          "Dưới đây là hướng dẫn:\n1. **Chuẩn bị dụng cụ**: - Khăn microfiber sạch\n- Bình khí nén"
        }
      />,
    );

    expect(screen.getByText("Chuẩn bị dụng cụ").tagName).toBe("STRONG");
    expect(screen.getByText("Khăn microfiber sạch")).toBeInTheDocument();
    expect(screen.getByText("Bình khí nén")).toBeInTheDocument();
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it("supports markdown-style headings and inline code", () => {
    render(<DocsMarkdown content={"### Cấu hình\nDùng `NEXT_PUBLIC_CHAT_API_URL`."} />);

    expect(screen.getByText("Cấu hình").closest("p")).toHaveClass("font-semibold");
    expect(screen.getByText("NEXT_PUBLIC_CHAT_API_URL").tagName).toBe("CODE");
  });
});
