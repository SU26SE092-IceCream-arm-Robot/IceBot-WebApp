"use client";

import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { PermissionMatrixResult } from "@/types/accounts";

export function PermissionMatrixView({ matrix }: { matrix: PermissionMatrixResult }) {
  if (matrix.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
        <p>Không có dữ liệu ma trận phân quyền.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden grid-cols-[minmax(180px,0.8fr)_minmax(260px,1.5fr)_minmax(180px,1fr)_120px] gap-4 border-b border-border bg-muted/30 px-4 py-3 text-xs font-semibold text-muted-foreground md:grid">
        <span>Policy</span>
        <span>Mô tả backend</span>
        <span>Vai trò</span>
        <span>Phạm vi</span>
      </div>
      <div className="divide-y divide-border">
        {matrix.map((item) => {
          const roles = Array.isArray(item.roles) ? item.roles : [];

          return (
            <div
              key={item.policy}
              className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[minmax(180px,0.8fr)_minmax(260px,1.5fr)_minmax(180px,1fr)_120px] md:gap-4"
            >
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <code className="break-all text-xs font-semibold text-foreground">
                  {item.policy}
                </code>
              </div>
              <p className="text-sm leading-5 text-muted-foreground">
                {item.description || "Backend chưa cung cấp mô tả."}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <Badge key={`${item.policy}-${role}`} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Không có vai trò</span>
                )}
              </div>
              <div>
                <Badge variant="outline">
                  {item.scopeRequired ? "Bắt buộc" : "Không bắt buộc"}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
