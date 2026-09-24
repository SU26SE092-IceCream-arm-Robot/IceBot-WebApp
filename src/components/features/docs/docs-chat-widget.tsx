"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, LoaderCircle, MessageCircle, Send, X } from "lucide-react";

import { DocsMarkdown } from "@/components/features/docs/docs-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DocsChatApiMessage } from "@/types/docs/chat";

export interface DocsChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  retryContent?: string;
}

export type DocsChatAdapter = (
  message: string,
  history: DocsChatApiMessage[],
  signal?: AbortSignal,
) => Promise<string>;

interface DocsChatWidgetProps {
  onSendMessage?: DocsChatAdapter;
}

const initialMessage: DocsChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi có thể giúp bạn tìm thông tin trong tài liệu IceBot và hướng dẫn bạn tới đúng thao tác.",
};

const suggestedQuestions = [
  "Cài đặt IceBot Kiosk thế nào?",
  "Kiểm tra kiosk trên Admin Web ra sao?",
];

const unavailableMessage =
  "Trợ lý hiện chưa thể trả lời. Vui lòng thử lại sau hoặc mở nội dung tài liệu trong menu bên trái.";

export function DocsChatWidget({ onSendMessage }: DocsChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<DocsChatMessage[]>([initialMessage]);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const messageSequenceRef = useRef(0);

  useEffect(() => () => requestControllerRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const messageEnd = messageEndRef.current;
    if (typeof messageEnd?.scrollIntoView === "function") {
      messageEnd.scrollIntoView({ block: "nearest" });
    }
  }, [messages, open]);

  async function sendMessage(content: string) {
    const normalizedMessage = content.trim();
    if (!normalizedMessage || sending) return;

    messageSequenceRef.current += 1;
    const messageSequence = messageSequenceRef.current;
    const userMessage: DocsChatMessage = {
      id: `user-${messageSequence}`,
      role: "user",
      content: normalizedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);
    requestControllerRef.current?.abort();
    const requestController = new AbortController();
    requestControllerRef.current = requestController;
    const history: DocsChatApiMessage[] = messages
      .filter((message) => message.id !== initialMessage.id)
      .map(({ role, content }) => ({ role, content }));

    try {
      const reply = onSendMessage
        ? await onSendMessage(normalizedMessage, history, requestController.signal)
        : "Trợ lý hiện chưa được kết nối. Bạn có thể tiếp tục đọc nội dung tài liệu trong menu bên trái.";

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${messageSequence}`,
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${messageSequence}`,
          role: "assistant",
          content: unavailableMessage,
          retryContent: normalizedMessage,
        },
      ]);
    } finally {
      if (requestControllerRef.current === requestController) {
        requestControllerRef.current = null;
      }
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(draft);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          className="mb-3 flex h-[min(36rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_60px_rgba(15,23,42,0.18)]"
          role="dialog"
          aria-label="Trợ lý tài liệu IceBot"
        >
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">Trợ lý tài liệu</h2>
                <p className="text-xs text-muted-foreground">Hỏi về cách sử dụng IceBot</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Đóng trợ lý tài liệu"
            >
              <X className="size-5" />
            </Button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-card text-foreground",
                  )}
                >
                  {message.role === "assistant" ? (
                    <DocsMarkdown content={message.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                  {message.retryContent && !sending ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      onClick={() => void sendMessage(message.retryContent ?? "")}
                    >
                      Thử lại
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Đang trả lời...
                </div>
              </div>
            ) : null}
            <div ref={messageEndRef} />
          </div>

          {messages.length === 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-border px-3 py-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="min-h-9 shrink-0 cursor-pointer rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                  onClick={() => void sendMessage(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}

          <form className="border-t border-border bg-card p-3" onSubmit={handleSubmit}>
            <label htmlFor="docs-chat-message" className="sr-only">
              Câu hỏi cho trợ lý tài liệu
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                id="docs-chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về tài liệu IceBot..."
                className="max-h-28 min-h-11 resize-none bg-background"
                rows={1}
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim() || sending}
                aria-label="Gửi câu hỏi"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Kiểm tra lại thông tin quan trọng trước khi thực hiện.
            </p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="ml-auto flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Ẩn trợ lý tài liệu" : "Mở trợ lý tài liệu"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="hidden text-sm sm:inline">Hỏi IceBot AI</span>
      </button>
    </div>
  );
}
