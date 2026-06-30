"use client";

import { AlertTriangle, UserRoundX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InternalAccountResult } from "@/types/accounts";

interface DisableAccountDialogProps {
  account: InternalAccountResult | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function DisableAccountDialog({
  account,
  errorMessage,
  isSubmitting,
  open,
  onConfirm,
  onOpenChange,
}: DisableAccountDialogProps) {
  const accountName = account?.fullName?.trim() || account?.userName || "tài khoản này";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <UserRoundX className="size-5" />
          </span>
          <DialogTitle>Vô hiệu hóa tài khoản?</DialogTitle>
          <DialogDescription>
            Tài khoản <span className="font-medium text-foreground">{accountName}</span> sẽ không
            thể đăng nhập sau thao tác này.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" isLoading={isSubmitting} onClick={onConfirm}>
            Vô hiệu hóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
