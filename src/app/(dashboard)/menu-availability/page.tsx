"use client";

import { AlertTriangle, Monitor, RefreshCw } from "lucide-react";

import { MenuItemAvailabilityPanel } from "@/components/features/kiosks/menu-item-availability-panel";
import { PageHeader } from "@/components/shared/page-header";
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
    <div className="space-y-5">
      <PageHeader
        title="Trạng thái bán món"
        description="Tạm ngừng hoặc mở bán lại từng món tại một kiosk mà không thay đổi thực đơn dùng chung của cửa hàng."
        metadata={
          <p className="text-xs text-muted-foreground">
            Mọi thay đổi đều yêu cầu xác nhận và được giới hạn trong kiosk đã chọn
          </p>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={workspace.refresh}
            isLoading={workspace.isLoading}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Làm mới
          </Button>
        }
      />

      <Card className="gap-0 border-border/80 py-0 shadow-none">
        <CardHeader className="border-b border-border px-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Monitor className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-base">Chọn kiosk vận hành</CardTitle>
              <CardDescription className="mt-1">
                Danh sách chỉ gồm các kiosk thuộc phạm vi mà tài khoản được cấp quyền.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-muted/10 p-4">
          {workspace.errorMessage ? (
            <div className="flex flex-col items-center gap-3 py-5 text-center">
              <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
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
