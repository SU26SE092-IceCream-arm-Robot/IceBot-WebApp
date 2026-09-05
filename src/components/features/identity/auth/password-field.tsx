"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";

type PasswordFieldProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  label?: string;
  error?: string | null;
  errorId?: string;
  showError?: boolean;
};

export function PasswordField({
  label,
  error,
  errorId,
  showError = true,
  id,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const resolvedErrorId = errorId ?? `${id}-error`;
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? resolvedErrorId : undefined}
          className={`h-11 px-10 ${className ?? ""}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && showError ? (
        <p id={resolvedErrorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
