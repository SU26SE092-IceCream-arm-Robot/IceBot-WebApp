import type {
  DocsChatApiMessage,
  DocsChatCompletionResponse,
} from "@/types/docs/chat";

const CHAT_API_PATH = "/v1/chat/completions";
const MAX_TOKENS = 512;

export class DocsChatApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DocsChatApiError";
  }
}

function removeTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getDocsChatApiBaseUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_CHAT_API_URL?.trim();
  return configuredUrl ? removeTrailingSlashes(configuredUrl) : null;
}

function getErrorDetail(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const detail = (payload as { detail?: unknown }).detail;
  return typeof detail === "string" && detail.trim() ? detail.trim() : undefined;
}

function getHttpErrorMessage(status: number, detail?: string): string {
  if (detail) return detail;

  switch (status) {
    case 400:
    case 422:
      return "Câu hỏi chưa đúng định dạng mà trợ lý tài liệu hỗ trợ.";
    case 429:
      return "Trợ lý tài liệu đang quá tải. Vui lòng thử lại sau ít phút.";
    case 503:
      return "Dịch vụ trợ lý tài liệu hiện chưa sẵn sàng.";
    case 504:
      return "Trợ lý tài liệu phản hồi quá lâu. Vui lòng thử lại với câu hỏi ngắn hơn.";
    default:
      return "Không thể nhận phản hồi từ trợ lý tài liệu.";
  }
}

function getAssistantContent(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new DocsChatApiError(
      "Phản hồi từ trợ lý tài liệu không hợp lệ.",
      200,
      "INVALID_RESPONSE",
    );
  }

  const content = (payload as DocsChatCompletionResponse).choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new DocsChatApiError(
      "Phản hồi từ trợ lý tài liệu không có nội dung.",
      200,
      "EMPTY_RESPONSE",
    );
  }

  return content.trim();
}

export async function sendDocsChatMessage(
  message: string,
  history: DocsChatApiMessage[] = [],
  signal?: AbortSignal,
): Promise<string> {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    throw new DocsChatApiError("Vui lòng nhập câu hỏi cho trợ lý tài liệu.", 0, "EMPTY_MESSAGE");
  }

  const baseUrl = getDocsChatApiBaseUrl();
  if (!baseUrl) {
    throw new DocsChatApiError(
      "Chatbot chưa được cấu hình API_BASE_URL. Vui lòng khai báo NEXT_PUBLIC_CHAT_API_URL.",
      0,
      "CONFIGURATION_ERROR",
    );
  }

  const messages: DocsChatApiMessage[] = [
    ...history.filter((item) => item.role === "user" || item.role === "assistant"),
    { role: "user", content: normalizedMessage },
  ];

  try {
    const response = await fetch(`${baseUrl}${CHAT_API_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        messages,
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
        stream: false,
        rag: {
          enabled: true,
          mode: "answer",
        },
      }),
      signal,
    });

    const payload = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw new DocsChatApiError(
        getHttpErrorMessage(response.status, getErrorDetail(payload)),
        response.status,
        `HTTP_${response.status}`,
      );
    }

    return getAssistantContent(payload);
  } catch (error) {
    if (error instanceof DocsChatApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw error;

    throw new DocsChatApiError(
      "Không thể kết nối tới trợ lý tài liệu. Vui lòng kiểm tra cấu hình API hoặc thử lại sau.",
      0,
      "NETWORK_ERROR",
    );
  }
}
