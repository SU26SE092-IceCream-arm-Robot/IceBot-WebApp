"use client";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getRobotProgram,
  replaceRobotProgramArtifacts,
} from "@/lib/services/production-operations";
import type { RobotProgramResult } from "@/types/production-operations";

interface ProductionAwareProgramOrderPanelProps {
  organizationId: string;
  programId: string;
  canManage: boolean;
  onOrderSaved: () => void;
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function artifactLabel(artifact: RobotProgramResult["artifacts"][number]) {
  return (
    artifact.artifactName ?? artifact.artifactCode ?? artifact.robotArtifactId
  );
}

export function ProductionAwareProgramOrderPanel({
  organizationId,
  programId,
  canManage,
  onOrderSaved,
}: ProductionAwareProgramOrderPanelProps) {
  const [program, setProgram] = useState<RobotProgramResult | null>(null);
  const [draggedArtifactId, setDraggedArtifactId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movementNotice, setMovementNotice] = useState("");

  const loadProgram = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProgram(await getRobotProgram(organizationId, programId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải RobotProgram đã tạo.",
      );
      setProgram(null);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, programId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadProgram(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProgram]);

  const applyOrder = (fromIndex: number, toIndex: number) => {
    if (
      !program ||
      isSaving ||
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= program.artifacts.length
    )
      return;
    const nextArtifacts = reorder(program.artifacts, fromIndex, toIndex).map(
      (artifact, index) => ({ ...artifact, runOrder: index + 1 }),
    );
    const moved = nextArtifacts[toIndex];
    setProgram({ ...program, artifacts: nextArtifacts });
    setMovementNotice(
      `${artifactLabel(moved)} đã chuyển đến vị trí ${toIndex + 1}.`,
    );
  };

  const saveOrder = async () => {
    if (!program || program.status !== "Draft") return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await replaceRobotProgramArtifacts(
        organizationId,
        program.id,
        {
          expectedLastModifiedAt: program.lastModifiedAt,
          artifacts: program.artifacts.map((artifact, index) => ({
            robotArtifactId: artifact.robotArtifactId,
            runOrder: index + 1,
            parametersJson: artifact.parametersJson,
            requiredOptionCode: artifact.requiredOptionCode,
          })),
        },
      );
      setProgram(updated);
      setMovementNotice("Đã lưu thứ tự artifact.");
      onOrderSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể lưu thứ tự artifact.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) return null;

  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-label="Sắp xếp artifact"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            Thứ tự artifact của Production-aware Lua
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Kéo thả hoặc dùng nút lên/xuống khi Program còn Draft. Backend vẫn
            kiểm tra các ordering constraint bắt buộc khi preview composition.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={
            isLoading ||
            isSaving ||
            !program ||
            program.status !== "Draft" ||
            program.artifacts.length < 2
          }
          onClick={() => void saveOrder()}
        >
          <Save className="size-4" />
          {isSaving ? "Đang lưu..." : "Lưu thứ tự"}
        </Button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {movementNotice}
      </p>
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Đang tải RobotProgram...
        </div>
      ) : null}
      {program && program.status !== "Draft" ? (
        <p className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
          Chỉ RobotProgram ở trạng thái Draft mới được thay đổi thứ tự.
        </p>
      ) : null}
      {program?.status === "Draft" && program.artifacts.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
          Chưa có artifact nào được tạo cho RobotProgram này.
        </p>
      ) : null}
      {program?.status === "Draft" && program.artifacts.length > 0 ? (
        <ol
          className="divide-y rounded-md border"
          aria-label="Danh sách artifact theo thứ tự chạy"
        >
          {program.artifacts.map((artifact, index) => (
            <li
              key={artifact.id}
              draggable={!isSaving}
              onDragStart={() => setDraggedArtifactId(artifact.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!draggedArtifactId || draggedArtifactId === artifact.id)
                  return;
                const fromIndex = program.artifacts.findIndex(
                  (item) => item.id === draggedArtifactId,
                );
                applyOrder(fromIndex, index);
                setDraggedArtifactId(null);
              }}
              className="flex items-center gap-3 px-3 py-2"
            >
              <GripVertical
                className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-hidden="true"
              />
              <span
                className="w-5 font-mono text-xs text-muted-foreground"
                aria-label={`Vị trí ${index + 1}`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {artifactLabel(artifact)}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {artifact.artifactCode ?? artifact.robotArtifactId}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={isSaving || index === 0}
                  onClick={() => applyOrder(index, index - 1)}
                  aria-label={`Đưa ${artifactLabel(artifact)} lên`}
                  title="Đưa lên"
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  disabled={isSaving || index === program.artifacts.length - 1}
                  onClick={() => applyOrder(index, index + 1)}
                  aria-label={`Đưa ${artifactLabel(artifact)} xuống`}
                  title="Đưa xuống"
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
