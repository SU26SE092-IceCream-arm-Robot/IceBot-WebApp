"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  MapPin,
  RefreshCw,
  Search,
  Store as StoreIcon,
  X,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useStoresList, type StoreOrganizationGroup } from "@/hooks/tenants/use-stores-list";
import type { StoreResult } from "@/types";

function storeStatusLabel(status: string) {
  return status === "Active" ? "Đang hoạt động" : status || "Chưa xác định";
}

export function StoresView() {
  const { stores, groups, organizations, isLoading, errorMessage, refresh } =
    useStoresList();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGroups = useMemo<StoreOrganizationGroup[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return groups;
    }

    return groups
      .map((group) => {
        const matchesOrg =
          group.organizationName.toLowerCase().includes(term) ||
          group.organizationCode.toLowerCase().includes(term);

        const matchingStores = group.stores.filter(
          (store) =>
            matchesOrg ||
            store.name.toLowerCase().includes(term) ||
            store.code.toLowerCase().includes(term) ||
            (store.address && store.address.toLowerCase().includes(term)) ||
            (store.city && store.city.toLowerCase().includes(term)),
        );

        return {
          ...group,
          stores: matchingStores,
        };
      })
      .filter((group) => group.stores.length > 0);
  }, [groups, searchTerm]);

  const totalFilteredStores = useMemo(
    () => filteredGroups.reduce((total, group) => total + group.stores.length, 0),
    [filteredGroups],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Cửa hàng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi và quản lý các cửa hàng được phân nhóm theo từng tổ chức.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => void refresh()}
        >
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </section>

      {/* Search & stats bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên cửa hàng, mã code, địa chỉ, tổ chức..."
            className="h-10 pl-9 pr-8"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Xóa tìm kiếm"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {!isLoading && !errorMessage ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Tổng số:</span>
            <Badge variant="secondary" className="font-medium">
              {totalFilteredStores} cửa hàng
            </Badge>
            <span>•</span>
            <Badge variant="outline" className="font-medium">
              {filteredGroups.length} tổ chức
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-36 animate-pulse rounded-lg border border-border bg-muted/40" />
          <div className="h-36 animate-pulse rounded-lg border border-border bg-muted/40" />
        </div>
      ) : null}

      {/* Error state */}
      {!isLoading && errorMessage ? (
        <Card className="border-border/80 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="size-6 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Empty overall state */}
      {!isLoading && !errorMessage && stores.length === 0 ? (
        <Card className="border-border/80 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <StoreIcon className="size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              Chưa có cửa hàng nào trong phạm vi hiện tại.
            </p>
            <p className="text-xs">
              Các cửa hàng thuộc tổ chức được phân quyền sẽ xuất hiện tại đây.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Empty search match state */}
      {!isLoading && !errorMessage && stores.length > 0 && filteredGroups.length === 0 ? (
        <Card className="border-border/80 shadow-none">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <Search className="size-6 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              Không tìm thấy cửa hàng nào phù hợp với &quot;{searchTerm}&quot;.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="mt-1 text-xs text-primary"
            >
              Xóa bộ lọc tìm kiếm
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Grouped store list by organization */}
      {!isLoading && !errorMessage && filteredGroups.length > 0 ? (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <Card
              key={group.organizationId}
              className="overflow-hidden border-border/80 shadow-none"
            >
              <CardHeader className="border-b border-border bg-muted/20 px-5 py-3.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <Building2 className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base font-semibold text-foreground">
                          {group.organizationName}
                        </CardTitle>
                        {group.organizationCode ? (
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {group.organizationCode}
                          </Badge>
                        ) : null}
                      </div>
                      {group.organizationId !== "unassigned" ? (
                        <Link
                          href={`/organizations/${group.organizationId}`}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                        >
                          Xem chi tiết tổ chức
                          <ArrowRight className="size-3" />
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <Badge variant="secondary" className="w-fit shrink-0 font-medium">
                    {group.stores.length} cửa hàng
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {group.stores.map((store: StoreResult) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.id}`}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                            {store.name}
                          </p>
                          {store.isSalesPaused ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Tạm dừng bán
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {store.code}
                        </p>
                        {store.address || store.city ? (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">
                              {[store.address, store.city, store.province, store.country]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-4 text-xs sm:flex-col sm:items-end sm:text-right">
                        <span
                          className={`font-medium ${
                            store.status === "Active"
                              ? "text-emerald-500 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {storeStatusLabel(store.status)}
                        </span>
                        <span className="text-muted-foreground">
                          {store.timeZone}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

