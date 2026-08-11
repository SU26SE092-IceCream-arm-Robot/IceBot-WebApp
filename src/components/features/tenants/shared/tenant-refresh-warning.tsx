import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TenantRefreshWarningProps {
  message: string | null;
  isRetrying: boolean;
  onRetry: () => void;
}

export function TenantRefreshWarning({
  message,
  isRetrying,
  onRetry,
}: TenantRefreshWarningProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>{message}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        isLoading={isRetrying}
        onClick={onRetry}
      >
        <RefreshCw className="size-4" />
        Tải lại dữ liệu
      </Button>
    </div>
  );
}
