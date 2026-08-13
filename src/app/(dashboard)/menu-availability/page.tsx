"use client";

import { AlertTriangle, Monitor, RefreshCw } from "lucide-react";

import { MenuItemAvailabilityPanel } from "@/components/features/kiosks/menu-item-availability-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMenuAvailabilityWorkspace } from "@/hooks/operations/use-menu-availability-workspace";

export default function MenuAvailabilityPage() {
  const workspace = useMenuAvailabilityWorkspace();
  const selectedKioskLabel = workspace.selectedKiosk
    ? `${workspace.selectedKiosk.name} — ${workspace.selectedKiosk.code}`
    : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Tình trạng bán món</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Tạm ngừng hoặc mở bán lại từng món tại kiosk mà không thay đổi thực đơn dùng chung.
          </p>
        </div>
        <Button variant="outline" onClick={workspace.refresh} isLoading={workspace.isLoading}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </section>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="border-b border-border">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Monitor className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Chọn kiosk vận hành</CardTitle>
              <CardDescription className="mt-1">
                Danh sách chỉ gồm các kiosk thuộc phạm vi mà tài khoản được cấp quyền.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {workspace.errorMessage ? (
            <div className="flex flex-col items-center gap-3 py-5 text-center">
              <AlertTriangle className="size-7 text-destructive" />
              <p role="alert" className="text-sm text-destructive">{workspace.errorMessage}</p>
              <Button variant="outline" onClick={workspace.refresh}>Thử lại</Button>
            </div>
          ) : (
            <div className="max-w-xl space-y-2">
              <Label htmlFor="menu-availability-kiosk">Kiosk</Label>
              <Select
                value={workspace.selectedKioskId}
                onValueChange={(value) => workspace.selectKiosk(value ?? "")}
                disabled={workspace.isLoading || workspace.kiosks.length === 0}
              >
                <SelectTrigger id="menu-availability-kiosk" className="w-full bg-card">
                  <SelectValue placeholder={workspace.isLoading ? "Đang tải kiosk..." : "Chọn kiosk"}>
                    {selectedKioskLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {workspace.kiosks.map((kiosk) => (
                    <SelectItem key={kiosk.id} value={kiosk.id}>
                      {kiosk.name} — {kiosk.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!workspace.isLoading && workspace.kiosks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có kiosk nào trong phạm vi được cấp quyền.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {workspace.selectedKiosk ? (
        <MenuItemAvailabilityPanel
          key={`${workspace.selectedKiosk.id}-${workspace.refreshVersion}`}
          kioskId={workspace.selectedKiosk.id}
          kioskName={workspace.selectedKiosk.name}
        />
      ) : null}
    </div>
  );
}
