"use client";

import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPermissionPresentation } from "@/lib/presenters/permission-presentation";
import type {
  PermissionMatrixItem,
  PermissionMatrixResult,
} from "@/types/identity/accounts";

interface PresentedPermission {
  item: PermissionMatrixItem;
  group: string;
  label: string;
  description: string;
}

export function PermissionMatrixView({
  matrix,
}: {
  matrix: PermissionMatrixResult;
}) {
  const [search, setSearch] = useState("");
  const groups = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi-VN");
    const grouped = new Map<string, PresentedPermission[]>();

    for (const item of matrix) {
      const presentation = getPermissionPresentation(
        item.policy,
        item.description,
      );
      const roles = Array.isArray(item.roles) ? item.roles : [];
      const searchableText = [
        item.policy,
        presentation.label,
        presentation.description,
        presentation.group,
        ...roles,
      ]
        .join(" ")
        .toLocaleLowerCase("vi-VN");

      if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
        continue;
      }

      const current = grouped.get(presentation.group) ?? [];
      current.push({ item, ...presentation });
      grouped.set(presentation.group, current);
    }

    return [...grouped.entries()];
  }, [matrix, search]);

  if (matrix.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-10 text-center">
        <ShieldCheck
          className="size-6 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-semibold text-foreground">
          Chưa có dữ liệu phân quyền
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ma trận quyền sẽ xuất hiện khi backend cung cấp policy cho các role.
        </p>
      </div>
    );
  }

  const visibleCount = groups.reduce(
    (count, [, permissions]) => count + permissions.length,
    0,
  );

  return (
    <div className="space-y-4">
      <section
        className="rounded-lg border border-border bg-card p-3"
        aria-labelledby="permission-search-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="size-4 text-primary"
              aria-hidden="true"
            />
            <div>
              <h2
                id="permission-search-title"
                className="text-sm font-semibold"
              >
                Tra cứu quyền
              </h2>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Hiển thị {visibleCount.toLocaleString("vi-VN")}/
                {matrix.length.toLocaleString("vi-VN")} quyền
              </p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên quyền, mã policy hoặc role..."
              className="pl-9"
              aria-label="Tìm trong ma trận quyền"
            />
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            Không tìm thấy quyền phù hợp
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Thử tìm bằng tên hành động, mã policy hoặc role hệ thống.
          </p>
        </div>
      ) : (
        groups.map(([group, permissions]) => (
          <section
            key={group}
            className="overflow-hidden rounded-lg border border-border bg-card"
            aria-labelledby={`permission-group-${toDomId(group)}`}
          >
            <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3">
              <h2
                id={`permission-group-${toDomId(group)}`}
                className="text-sm font-semibold text-foreground"
              >
                {group}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {permissions.length} quyền
              </span>
            </header>
            <div className="divide-y divide-border">
              {permissions.map(({ item, label, description }) => {
                const roles = Array.isArray(item.roles) ? item.roles : [];
                return (
                  <article
                    key={item.policy}
                    className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(240px,0.9fr)_minmax(280px,1.2fr)_minmax(220px,0.9fr)] lg:items-start"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <ShieldCheck
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">
                          {label}
                        </h3>
                        <code className="mt-1 block break-all text-xs text-muted-foreground">
                          {item.policy}
                        </code>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {roles.length > 0 ? (
                          roles.map((role) => (
                            <Badge
                              key={`${item.policy}-${role}`}
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Chưa gán role
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {item.scopeRequired
                          ? "Áp dụng theo phạm vi được phân công"
                          : "Không yêu cầu chọn phạm vi"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function toDomId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
