"use client";

import { FileStack, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

import { ConfigurationReleaseRoutesDialog } from "@/components/features/kiosks/configuration-release-routes-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfigurationReleases } from "@/hooks/use-configuration-releases";
import type { ConfigurationReleaseResult } from "@/types/production-operations";

const statusLabels: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã phát hành",
  Retired: "Đã ngừng sử dụng",
};

export function OrganizationConfigurationReleasesPanel({
  organizationId,
  canManage,
}: {
  organizationId: string;
  canManage: boolean;
}) {
  const state = useConfigurationReleases(organizationId);
  const [editorRelease, setEditorRelease] = useState<ConfigurationReleaseResult | null>(null);

  const openEditor = async (releaseId: string) => {
    const detail = await state.loadEditor(releaseId);
    if (detail) setEditorRelease(detail);
  };

  return (
    <section className="rounded-lg border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary"><FileStack className="size-4" /></span>
          <div><h2 className="font-semibold">Bản phát hành cấu hình</h2><p className="mt-1 text-sm text-muted-foreground">Soạn tuyến sản xuất của tổ chức trước khi chuyển sang Kiosk để kiểm tra và triển khai.</p></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={state.isLoading || state.isMutating} onClick={() => void state.refresh()}><RefreshCw className="size-4" />Làm mới</Button>
          {canManage ? <Button size="sm" disabled={state.isMutating} onClick={() => void state.createRelease()}><Plus className="size-4" />Tạo bản nháp</Button> : null}
        </div>
      </header>

      {state.errorMessage ? <p className="m-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{state.errorMessage}</p> : null}
      {state.refreshWarning ? <p className="m-4 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">{state.refreshWarning}</p> : null}
      {state.isLoading ? <p className="p-6 text-sm text-muted-foreground">Đang tải bản phát hành cấu hình...</p> : state.releases.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có bản phát hành cấu hình trong tổ chức.</p> : <div className="divide-y">{state.releases.map((release) => <div key={release.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">Bản phát hành #{release.releaseNumber}</p><Badge variant="outline">{statusLabels[release.status] ?? release.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{release.routeCount} tuyến · {release.releaseChecksum ? "Đã đóng gói" : "Chưa đóng gói"}</p></div>{canManage ? <div className="flex flex-wrap gap-2">{release.status === "Draft" ? <><Button size="sm" variant="outline" disabled={state.isMutating} onClick={() => void openEditor(release.id)}>Soạn tuyến</Button><Button size="sm" disabled={state.isMutating || release.routeCount === 0} onClick={() => { if (window.confirm("Phát hành bản cấu hình này? Sau khi phát hành sẽ không thể sửa tuyến.")) void state.publish(release.id); }}>Phát hành</Button><Button size="sm" variant="destructive" disabled={state.isMutating} onClick={() => { if (window.confirm("Xóa bản nháp cấu hình này?")) void state.discard(release.id); }}>Xóa nháp</Button></> : null}{release.status === "Published" ? <Button size="sm" variant="outline" disabled={state.isMutating} onClick={() => { if (window.confirm("Ngừng sử dụng bản phát hành này?")) void state.retire(release.id); }}>Ngừng sử dụng</Button> : null}</div> : null}</div>)}</div>}

      {editorRelease ? <ConfigurationReleaseRoutesDialog release={editorRelease} options={state.authoringOptions} isSubmitting={state.isMutating} errorMessage={state.errorMessage} onOpenChange={(open) => { if (!open) { state.cancelEditorLoad(); setEditorRelease(null); } }} onLoadOptions={() => state.loadEditor(editorRelease.id)} onSubmit={(routes) => state.replaceRoutes(editorRelease, routes)} /> : null}
    </section>
  );
}
