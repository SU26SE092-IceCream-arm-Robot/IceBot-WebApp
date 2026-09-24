import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DocsChatApiError,
  sendDocsChatMessage,
} from "@/lib/services/docs/chat";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("docs chat service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends the documented RAG chat contract and preserves user/assistant history", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_API_URL", "https://chat.example.test/");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({
          choices: [{ message: { role: "assistant", content: "  Câu trả lời RAG.  " } }],
          rag_sources: [],
          rag_metrics: { grounding_status: "grounded", context_trimmed: false },
        }),
      );

    await expect(
      sendDocsChatMessage("  Câu hỏi mới  ", [
        { role: "user", content: "Câu hỏi trước" },
        { role: "assistant", content: "Trả lời trước" },
      ]),
    ).resolves.toBe("Câu trả lời RAG.");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://chat.example.test/v1/chat/completions",
    );

    const request = fetchMock.mock.calls[0]?.[1];
    expect(request?.method).toBe("POST");
    expect(request?.headers).toEqual({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    expect(JSON.parse(String(request?.body))).toEqual({
      messages: [
        { role: "user", content: "Câu hỏi trước" },
        { role: "assistant", content: "Trả lời trước" },
        { role: "user", content: "Câu hỏi mới" },
      ],
      temperature: 0.2,
      max_tokens: 512,
      stream: false,
      rag: { enabled: true, mode: "answer" },
    });
  });

  it("maps API errors without retrying an expensive chat request", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_API_URL", "https://chat.example.test");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "Hàng chờ đang đầy." }, 429),
    );

    const request = sendDocsChatMessage("Thử lại giúp tôi");

    await expect(request).rejects.toMatchObject<Partial<DocsChatApiError>>({
      status: 429,
      code: "HTTP_429",
      message: "Hàng chờ đang đầy.",
    });
  });

  it("fails clearly when the chat API base URL is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_API_URL", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(sendDocsChatMessage("API ở đâu?"))
      .rejects.toMatchObject<Partial<DocsChatApiError>>({
        status: 0,
        code: "CONFIGURATION_ERROR",
      });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
