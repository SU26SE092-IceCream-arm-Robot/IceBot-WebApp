"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { useProductionOperations } from "@/hooks/production/use-production-operations";
import type {
  PackageInstallRequest,
  ProductionPackageResult,
} from "@/types/production/operations";

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
export function PackageInstallDialog({
  open,
  packages,
  isSubmitting,
  preview,
  errorMessage,
  storeId,
  kioskId,
  onOpenChange,
  onPreview,
  onInstall,
}: {
  open: boolean;
  packages: ProductionPackageResult[];
  isSubmitting: boolean;
  preview: ReturnType<typeof useProductionOperations>["installationPreview"];
  errorMessage?: string | null;
  storeId: string;
  kioskId: string;
  onOpenChange: (open: boolean) => void;
  onPreview: (request: PackageInstallRequest) => Promise<unknown>;
  onInstall: (request: PackageInstallRequest) => Promise<unknown>;
}) {
  const choices = useMemo(
    () =>
      packages.flatMap((item) =>
        item.versions
          .filter((version) => version.status === "Published")
          .map((version) => ({ package: item, version })),
      ),
    [packages],
  );
  const [selected, setSelected] = useState(
    choices[0] ? `${choices[0].package.id}:${choices[0].version.id}` : "",
  );
  const current = choices.find(
    (item) => `${item.package.id}:${item.version.id}` === selected,
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    current?.version.products.map((item) => item.sourceKey) ?? [],
  );
  const request = current
    ? {
        packageId: current.package.id,
        packageVersionId: current.version.id,
        storeId,
        kioskId,
        productSourceKeys: selectedProducts,
      }
    : null;
  const previewMatchesRequest = Boolean(
    request &&
    preview?.packageVersionId === request.packageVersionId &&
    [...preview.productSourceKeys].sort().join("|") ===
      [...request.productSourceKeys].sort().join("|"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cài gói sản xuất</DialogTitle>
          <DialogDescription>
            Xem trước tài nguyên sẽ được tạo trước khi cài đặt. Yêu cầu trùng
            lặp được hệ thống kiểm soát và không gửi lệnh trực tiếp tới robot.
          </DialogDescription>
        </DialogHeader>
        {choices.length === 0 ? (
          <EmptyState>
            Chưa có phiên bản gói đã phát hành trong phạm vi này.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Gói và phiên bản</Label>
              <Select
                value={selected}
                onValueChange={(value) => {
                  setSelected(value ?? "");
                  const next = choices.find(
                    (item) => `${item.package.id}:${item.version.id}` === value,
                  );
                  setSelectedProducts(
                    next?.version.products.map((item) => item.sourceKey) ?? [],
                  );
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {current
                      ? `${current.package.name} — phiên bản ${current.version.version}`
                      : "Chọn gói"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {choices.map((item) => (
                    <SelectItem
                      key={item.version.id}
                      value={`${item.package.id}:${item.version.id}`}
                    >
                      {item.package.name} — phiên bản {item.version.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sản phẩm sẽ cài</Label>
              {current?.version.products.map((product) => (
                <label
                  key={product.sourceKey}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedProducts.includes(product.sourceKey)}
                    onChange={(event) =>
                      setSelectedProducts((items) =>
                        event.target.checked
                          ? [...items, product.sourceKey]
                          : items.filter((key) => key !== product.sourceKey),
                      )
                    }
                  />
                  <span>
                    <span className="font-medium">{product.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {product.code}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {preview ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Bản xem trước hợp lệ</p>
                <p className="mt-1 text-muted-foreground">
                  {preview.productSourceKeys.length} sản phẩm,{" "}
                  {preview.programBlueprintCodes.length} chương trình,{" "}
                  {preview.routeCodes.length} tuyến thực thi.
                </p>
                {preview.warnings.map((warning) => (
                  <p key={warning} className="mt-2 text-warning">
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            variant="outline"
            disabled={!request || selectedProducts.length === 0 || isSubmitting}
            onClick={() => request && void onPreview(request)}
          >
            Xem trước
          </Button>
          <Button
            disabled={!request || !previewMatchesRequest || isSubmitting}
            onClick={async () => {
              if (request && (await onInstall(request))) onOpenChange(false);
            }}
          >
            {isSubmitting ? "Đang cài..." : "Xác nhận cài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
