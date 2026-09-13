"use client";

import { useEffect, useState } from "react";

import { PackageInstallDialog } from "@/components/features/production/packages/package-install-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductionOperations } from "@/hooks/production/use-production-operations";
import { getManagementKiosks } from "@/lib/services/kiosks/management";
import type { KioskResult } from "@/types/kiosks/management";

function InstallationWorkspace({ organizationId, storeId, kioskId }: { organizationId: string; storeId: string; kioskId: string }) {
  const operations = useProductionOperations({ organizationId, storeId, kioskId });
  const [installOpen, setInstallOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-sm font-semibold">Cài đặt và nâng cấp</p>
          <p className="text-xs text-muted-foreground">Chỉ hiển thị công việc của kiosk đã chọn.</p>
        </div>
        <Button size="sm" onClick={() => setInstallOpen(true)}>Cài gói</Button>
      </div>
      {operations.warnings.map((warning) => <p key={warning} role="alert" className="text-sm text-warning">{warning}</p>)}
      {operations.installations.length === 0 && !operations.isLoading ? (
        <Card><CardContent className="py-8 text-sm text-muted-foreground">Kiosk chưa có gói sản xuất. Chọn “Cài gói” để xem trước trước khi xác nhận.</CardContent></Card>
      ) : operations.installations.map((installation) => (
        <Card key={installation.id}>
          <CardHeader className="flex-row items-center justify-between py-3"><CardTitle className="text-sm">{installation.packageVersionId}</CardTitle><span className="text-xs text-muted-foreground">{installation.status}</span></CardHeader>
          {installation.status === "Failed" ? <CardContent className="flex items-center justify-between gap-3 pt-0 text-sm text-destructive"><span>{installation.failureMessage ?? "Cài đặt không hoàn tất."}</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void operations.recoverInstallation(installation.id, "repair")}>Sửa</Button><Button size="sm" onClick={() => void operations.recoverInstallation(installation.id, "retry")}>Thử lại</Button></div></CardContent> : null}
        </Card>
      ))}
      <PackageInstallDialog open={installOpen} packages={operations.packages} isSubmitting={operations.isMutating} preview={operations.installationPreview} errorMessage={operations.mutationError} storeId={storeId} kioskId={kioskId} onOpenChange={setInstallOpen} onPreview={operations.previewInstall} onInstall={operations.installPackage} />
    </div>
  );
}

export function ProductionOperationsWorkspace({ organizationId }: { organizationId: string }) {
  const [kiosks, setKiosks] = useState<KioskResult[]>([]);
  const [selectedKioskId, setSelectedKioskId] = useState("");
  useEffect(() => { void getManagementKiosks({ organizationId }).then(setKiosks).catch(() => setKiosks([])); }, [organizationId]);
  const selected = kiosks.find((kiosk) => kiosk.id === selectedKioskId) ?? kiosks[0];
  return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Vận hành theo kiosk</p><p className="text-xs text-muted-foreground">Chọn kiosk trước khi cài hoặc xử lý gói sản xuất.</p></div><Select value={selected?.id ?? ""} onValueChange={(value) => setSelectedKioskId(value ?? "")}><SelectTrigger className="w-64"><SelectValue placeholder="Chọn kiosk" /></SelectTrigger><SelectContent>{kiosks.map((kiosk) => <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name}</SelectItem>)}</SelectContent></Select></div>{selected ? <InstallationWorkspace organizationId={organizationId} storeId={selected.storeId} kioskId={selected.id} /> : <p className="border border-dashed px-4 py-8 text-sm text-muted-foreground">Chưa có kiosk trong phạm vi tổ chức.</p>}</section>;
}
