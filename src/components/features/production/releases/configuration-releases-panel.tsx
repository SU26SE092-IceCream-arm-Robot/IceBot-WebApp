"use client";

import { ArrowLeft, FileStack, Plus, RefreshCw, Rocket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ConfigurationReleaseRoutesEditor } from "@/components/features/production/releases/configuration-release-routes-editor";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useConfigurationReleases } from "@/hooks/production/use-configuration-releases";
import type {
  ConfigurationReleaseResult,
  ConfigurationReleaseSummaryResult,
} from "@/types/production/operations";

const statusLabels: Record<string, string> = {
  Draft: "Bản nháp",
  Published: "Đã phát hành",
  Retired: "Đã ngừng sử dụng",
};

type ReleaseConfirmation = {
  action: "publish" | "discard" | "retire";
  release: ConfigurationReleaseSummaryResult;
};

export function ConfigurationReleasesPanel({
  organizationId,
  canManage,
  canDeploy,
  selectedReleaseId,
  onSelectedReleaseChange,
}: {
  organizationId: string;
  canManage: boolean;
  canDeploy: boolean;
  selectedReleaseId?: string | null;
  onSelectedReleaseChange: (releaseId: string | null) => void;
}) {
  const state = useConfigurationReleases(organizationId);
  const { cancelEditorLoad, loadEditor } = state;
  const [editorRelease, setEditorRelease] =
    useState<ConfigurationReleaseResult | null>(null);
  const [confirmation, setConfirmation] = useState<ReleaseConfirmation | null>(
    null,
  );
  const visibleEditorRelease =
    editorRelease?.id === selectedReleaseId ? editorRelease : null;

  useEffect(() => {
    if (!selectedReleaseId) return;
    if (editorRelease?.id === selectedReleaseId) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      const detail = await loadEditor(selectedReleaseId);
      if (!cancelled && detail) setEditorRelease(detail);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cancelEditorLoad();
    };
  }, [editorRelease?.id, selectedReleaseId, cancelEditorLoad, loadEditor]);

  if (selectedReleaseId && !visibleEditorRelease) {
    return (
      <section className="space-y-4 rounded-lg border bg-card p-5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSelectedReleaseChange(null)}
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách phiên bản
        </Button>
        {state.errorMessage ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.errorMessage}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Đang tải trình soạn phiên bản cấu hình...
          </p>
        )}
      </section>
    );
  }

  if (visibleEditorRelease) {
    return (
      <ConfigurationReleaseRoutesEditor
        release={visibleEditorRelease}
        options={state.authoringOptions}
        productionProgramBindings={state.productionProgramBindings}
        requireProductionBindings
        isSubmitting={state.isMutating}
        errorMessage={state.errorMessage}
        onClose={() => {
          setEditorRelease(null);
          onSelectedReleaseChange(null);
        }}
        onLoadOptions={() => state.loadEditor(visibleEditorRelease.id)}
        onSubmit={(routes) => state.replaceRoutes(visibleEditorRelease, routes)}
      />
    );
  }

  const confirmationCopy = confirmation
    ? confirmation.action === "publish"
      ? {
          title: `Phát hành phiên bản ${confirmation.release.releaseNumber}?`,
          description:
            "Sau khi phát hành, danh sách tuyến sẽ được khóa và không thể chỉnh sửa trên phiên bản này.",
          label: "Xác nhận phát hành",
          destructive: false,
        }
      : confirmation.action === "discard"
        ? {
            title: `Xóa bản nháp ${confirmation.release.releaseNumber}?`,
            description:
              "Bản nháp và các tuyến đang soạn sẽ bị xóa. Thao tác này không thể hoàn tác.",
            label: "Xóa bản nháp",
            destructive: true,
          }
        : {
            title: `Ngừng phiên bản ${confirmation.release.releaseNumber}?`,
            description:
              "Phiên bản sẽ không còn được chọn cho lượt triển khai mới. Lịch sử triển khai vẫn được giữ.",
            label: "Ngừng sử dụng",
            destructive: true,
          }
    : null;

  const confirmReleaseAction = async () => {
    if (!confirmation) return;
    const { action, release } = confirmation;
    if (action === "publish") await state.publish(release.id);
    if (action === "discard") await state.discard(release.id);
    if (action === "retire") await state.retire(release.id);
    setConfirmation(null);
  };

  return (
    <>
      <section className="rounded-lg border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <FileStack className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">Bản phát hành cấu hình</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Chọn các món đã liên kết với chương trình robot, kiểm tra điều
                kiện phát hành và tạo phiên bản cấu hình. Triển khai kiosk thực
                hiện ở khu vực Kiosk.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={state.isLoading || state.isMutating}
              onClick={() => void state.refresh()}
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
            {canManage ? (
              <Button
                size="sm"
                disabled={state.isMutating}
                onClick={() => void state.createRelease()}
              >
                <Plus className="size-4" />
                Tạo phiên bản nháp
              </Button>
            ) : null}
          </div>
        </header>

        {state.errorMessage ? (
          <p
            className="m-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {state.errorMessage}
          </p>
        ) : null}
        {state.refreshWarning ? (
          <p className="m-4 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            {state.refreshWarning}
          </p>
        ) : null}
        {state.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Đang tải bản phát hành cấu hình...
          </p>
        ) : state.releases.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Chưa có bản phát hành cấu hình trong tổ chức.
          </p>
        ) : (
          <div className="divide-y">
            {state.releases.map((release) => (
              <div
                key={release.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      Phiên bản {release.releaseNumber}
                    </p>
                    <Badge variant="outline">
                      {statusLabels[release.status] ?? release.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {release.routeCount} món đã cấu hình ·{" "}
                    {release.releaseChecksum
                      ? "Sẵn sàng triển khai"
                      : "Đang soạn"}
                  </p>
                </div>
                {canManage || (canDeploy && release.status === "Published") ? (
                  <div className="flex flex-wrap gap-2">
                    {canManage && release.status === "Draft" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={state.isMutating}
                          onClick={() => onSelectedReleaseChange(release.id)}
                        >
                          Cấu hình món
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            state.isMutating || release.routeCount === 0
                          }
                          onClick={() =>
                            setConfirmation({ action: "publish", release })
                          }
                        >
                          Phát hành
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={state.isMutating}
                          onClick={() =>
                            setConfirmation({ action: "discard", release })
                          }
                        >
                          Xóa nháp
                        </Button>
                      </>
                    ) : null}
                    {release.status === "Published" ? (
                      <>
                        {canDeploy ? (
                          <Link
                            href={`/kiosks?organizationId=${encodeURIComponent(organizationId)}&releaseId=${encodeURIComponent(release.id)}`}
                            className={buttonVariants({ size: "sm" })}
                          >
                            <Rocket className="size-4" />
                            Triển khai tới kiosk
                          </Link>
                        ) : null}
                        {canManage ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={state.isMutating}
                            onClick={() =>
                              setConfirmation({ action: "retire", release })
                            }
                          >
                            Ngừng sử dụng
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
      {confirmationCopy ? (
        <ConfirmationDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
          title={confirmationCopy.title}
          description={confirmationCopy.description}
          confirmLabel={confirmationCopy.label}
          isConfirming={state.isMutating}
          destructive={confirmationCopy.destructive}
          onConfirm={confirmReleaseAction}
        />
      ) : null}
    </>
  );
}
