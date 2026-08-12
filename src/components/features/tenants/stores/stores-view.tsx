"use client";

import { AlertTriangle, Building2, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoresList } from "@/hooks/tenants/use-stores-list";

function storeStatusLabel(status: string) {
  return status === "Active" ? "Đang hoạt động" : status || "Chưa xác định";
}

export function StoresView() {
  const { stores, isLoading, errorMessage, refresh } = useStoresList();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Cửa hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi các cửa hàng trong phạm vi được cấp quyền.</p>
        </div>
        <Button variant="outline" disabled={isLoading} onClick={() => void refresh()}>
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </section>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Building2 className="size-5" /></span>
            <div>
              <CardTitle className="text-base">Danh sách cửa hàng</CardTitle>
              <CardDescription className="mt-1">{stores.length} cửa hàng trong kết quả hiện tại</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="space-y-3 p-5"><div className="h-14 animate-pulse rounded-md bg-muted" /><div className="h-14 animate-pulse rounded-md bg-muted" /></div> : null}
          {!isLoading && errorMessage ? <div className="flex flex-col items-center gap-3 p-10 text-center"><AlertTriangle className="size-5 text-destructive" /><p className="text-sm text-destructive">{errorMessage}</p><Button variant="outline" size="sm" onClick={() => void refresh()}>Thử lại</Button></div> : null}
          {!isLoading && !errorMessage && stores.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Chưa có cửa hàng nào trong phạm vi hiện tại.</div> : null}
          {!isLoading && !errorMessage && stores.length > 0 ? <div className="divide-y divide-border">{stores.map((store) => <Link key={store.id} href={`/stores/${store.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{store.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{store.code}</p>{store.address || store.city ? <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{store.address || store.city}</p> : null}</div><div className="text-sm sm:text-right"><p className="font-medium text-foreground">{storeStatusLabel(store.status)}</p><p className="mt-0.5 text-xs text-muted-foreground">{store.timeZone}</p></div></Link>)}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
