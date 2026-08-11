"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RobotProgramSummaryResult } from "@/types/production/operations";
export function ProgramDialog({
  open,
  program,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  program?: Pick<RobotProgramSummaryResult, "id" | "code" | "name" | "description"> | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: {
    code: string;
    name: string;
    description?: string | null;
  }) => Promise<unknown>;
}) {
  const [code, setCode] = useState(program?.code ?? "");
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [validation, setValidation] = useState<string | null>(null);

  const submit = async () => {
    if (
      code.trim().length === 0 ||
      code.trim().length > 100 ||
      name.trim().length === 0 ||
      name.trim().length > 200
    ) {
      setValidation(
        "Mã và tên là bắt buộc; mã tối đa 100 ký tự, tên tối đa 200 ký tự.",
      );
      return;
    }
    if (description.trim().length > 500) {
      setValidation("Mô tả không được vượt quá 500 ký tự.");
      return;
    }
    const result = await onSubmit({
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || null,
    });
    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {program
              ? "Chỉnh sửa chương trình robot"
              : "Tạo chương trình robot"}
          </DialogTitle>
          <DialogDescription>
            Chỉ quản lý thông tin mô tả và vòng đời trong phạm vi kiosk. Tệp
            chương trình kỹ thuật được quản lý ở quy trình riêng.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="program-code">Mã chương trình</Label>
            <Input
              id="program-code"
              value={code}
              maxLength={100}
              disabled={isSubmitting}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program-name">Tên chương trình</Label>
            <Input
              id="program-name"
              value={name}
              maxLength={200}
              disabled={isSubmitting}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="program-description">Mô tả</Label>
            <Input
              id="program-description"
              value={description}
              maxLength={500}
              disabled={isSubmitting}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {validation || errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {validation || errorMessage}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={() => void submit()} disabled={isSubmitting}>
            {isSubmitting
              ? "Đang lưu..."
              : program
                ? "Lưu thay đổi"
                : "Tạo bản nháp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
