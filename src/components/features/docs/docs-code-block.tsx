"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DocsCodeBlockProps {
  label: string;
  language: string;
  code: string;
}

export function DocsCodeBlock({ label, language, code }: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-800 bg-[#111827] text-slate-100 shadow-sm">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-white/10 px-4">
        <span className="min-w-0 truncate text-xs font-medium text-slate-300">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] uppercase tracking-[0.12em] text-slate-500 sm:inline">
            {language}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => void copyCode()}
            aria-label={copied ? "Đã sao chép mã" : "Sao chép mã"}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}
