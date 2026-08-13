"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CirclePause, CirclePlay, RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getManagementKiosks } from "@/lib/services/kiosks/management";
import {
  getKioskMenuItemAvailability,
  getMenuItemAvailabilityErrorMessage,
  setKioskMenuItemAvailability,
} from "@/lib/services/operations/menu-availability";
import type { KioskResult } from "@/types/kiosks/management";
import type {
  KioskMenuItemAvailabilityResult,
  MenuItemOperationalAvailabilityReasonCode,
} from "@/types/operations/menu-availability";

const REASON_OPTIONS: { value: MenuItemOperationalAvailabilityReasonCode; label: string }[] = [
  { value: "OutOfStock", label: "Tạm hết hàng" },
  { value: "EquipmentFault", label: "Thiết bị gặp sự cố" },
  { value: "QualityIssue", label: "Chất lượng cần kiểm tra" },
  { value: "Cleaning", label: "Đang vệ sinh" },
  { value: "ManualPause", label: "Tạm ngừng thủ công" },
  { value: "Other", label: "Lý do khác" },
];

function newRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function MenuAvailabilityPage() {
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [kioskId, setKioskId] = useState("");
  const [items, setItems] = useState<KioskMenuItemAvailabilityResult[]>([]);
  const [search, setSearch] = useState("");
  const [reasonCode, setReasonCode] = useState<MenuItemOperationalAvailabilityReasonCode>("OutOfStock");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedKiosk = useMemo(
    () => kiosks.find((kiosk) => kiosk.id === kioskId),
    [kiosks, kioskId],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const availableKiosks = await getManagementKiosks();
      setKiosks(availableKiosks);
      const nextKioskId = kioskId || availableKiosks[0]?.id || "";
      setKioskId(nextKioskId);
      setItems(nextKioskId ? await getKioskMenuItemAvailability(nextKioskId, { search }) : []);
    } catch (error) {
      setErrorMessage(getMenuItemAvailabilityErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateAvailability = async (item: KioskMenuItemAvailabilityResult) => {
    const pausing = item.state === "Available";
    if (pausing && !reason.trim()) {
      setErrorMessage("Nhập lý do trước khi tạm ngừng bán món.");
      return;
    }

    setIsMutatingId(item.menuItemId);
    setErrorMessage(null);
    try {
      await setKioskMenuItemAvailability(kioskId, item.menuItemId, {
        state: pausing ? "Paused" : "Available",
        reasonCode,
        reason: pausing ? reason.trim() : "Đã cho phép bán lại.",
        expectedRevision: item.revision,
        requestId: newRequestId(),
      });
      setReason("");
      setItems(await getKioskMenuItemAvailability(kioskId, { search }));
    } catch (error) {
      setErrorMessage(getMenuItemAvailabilityErrorMessage(error));
    } finally {
      setIsMutatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Tình trạng bán món</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Tạm ngừng hoặc cho phép bán lại từng món tại kiosk. Thao tác này không thay đổi thực đơn gốc.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} isLoading={isLoading}>
          <RefreshCw className="size-4" /> Làm mới
        </Button>
      </section>

      <Card className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Kiosk và lý do tạm ngừng</CardTitle>
          <CardDescription>Lý do được ghi vào lịch sử vận hành của kiosk đã chọn.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Kiosk</Label>
            <Select value={kioskId} onValueChange={(value) => setKioskId(value ?? "")}>
              <SelectTrigger><SelectValue placeholder="Chọn kiosk" /></SelectTrigger>
              <SelectContent>{kiosks.map((kiosk) => <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name} - {kiosk.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lý do</Label>
            <Select value={reasonCode} onValueChange={(value) => setReasonCode(value as MenuItemOperationalAvailabilityReasonCode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REASON_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Máy cấp kem đang bảo trì" />
          </div>
        </CardContent>
      </Card>

      {errorMessage ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{errorMessage}</p> : null}

      <Card className="border-border/80 shadow-none">
        <CardHeader className="gap-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle className="text-base">Món tại {selectedKiosk?.name ?? "kiosk"}</CardTitle><CardDescription>{items.filter((item) => item.state === "Paused").length} món đang tạm ngừng bán.</CardDescription></div>
          <div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm món hoặc thực đơn" className="pl-9" /></div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <p className="px-5 py-10 text-sm text-muted-foreground">Đang tải món...</p> : items.length === 0 ? <p className="px-5 py-10 text-sm text-muted-foreground">Kiosk này chưa có món đang bán.</p> : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium">{item.displayName}</p><p className="text-sm text-muted-foreground">{item.menuName}{item.state === "Paused" && item.reason ? ` - ${item.reason}` : ""}</p></div>
                  <Button variant={item.state === "Paused" ? "outline" : "destructive"} size="sm" isLoading={isMutatingId === item.menuItemId} onClick={() => void updateAvailability(item)}>
                    {item.state === "Paused" ? <CirclePlay className="size-4" /> : <CirclePause className="size-4" />}
                    {item.state === "Paused" ? "Cho phép bán lại" : "Tạm ngừng bán"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
