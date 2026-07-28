"use client";

import { AlertTriangle, Boxes, Link2, Settings2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IngredientResult } from "@/types/ingredients";
import type {
  CreateDispenserStateRequest,
  DispenserLevelQuantityPoint,
  DispenserStateResult,
  InventoryEstimateDisposition,
  InventoryTopologyDeviceResult,
  RebindDispenserStateRequest,
  UpdateDispenserStateRequest,
} from "@/types/inventory-management";

export type TopologyOperationMode = "create" | "update" | "rebind" | "status";

interface InventoryTopologyOperationDialogProps {
  mode: TopologyOperationMode;
  target: DispenserStateResult | null;
  devices: InventoryTopologyDeviceResult[];
  ingredients: IngredientResult[];
  isLoadingIngredients: boolean;
  lookupErrorMessage: string | null;
  mutationErrorMessage: string | null;
  isSubmitting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateDispenserStateRequest) => Promise<unknown>;
  onUpdate: (
    dispenserStateId: string,
    request: UpdateDispenserStateRequest,
  ) => Promise<unknown>;
  onRebind: (
    dispenserStateId: string,
    request: RebindDispenserStateRequest,
  ) => Promise<unknown>;
  onSetStatus: (
    dispenserStateId: string,
    request: { isActive: boolean; reason: string },
  ) => Promise<unknown>;
}

const DEFAULT_PROFILE: DispenserLevelQuantityPoint[] = [
  { level: "Low", estimatedQuantity: 0 },
  { level: "Medium", estimatedQuantity: 0 },
  { level: "Full", estimatedQuantity: 0 },
];

const MODE_COPY: Record<TopologyOperationMode, { title: string; description: string }> = {
  create: {
    title: "Tạo bộ phân phối nguyên liệu",
    description: "Liên kết một khay với thiết bị và nguyên liệu trong kiosk đã chọn.",
  },
  update: {
    title: "Cập nhật cấu hình khay",
    description: "Điều chỉnh sức chứa, đơn vị và quy đổi mức cảm biến.",
  },
  rebind: {
    title: "Thay thế liên kết khay",
    description: "Tạo liên kết thay thế và ngừng sử dụng liên kết hiện tại.",
  },
  status: {
    title: "Cập nhật trạng thái khay",
    description: "Ghi nhận kích hoạt lại hoặc ngừng sử dụng với lý do rõ ràng.",
  },
};

function numericValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function InventoryTopologyOperationDialog({
  mode,
  target,
  devices,
  ingredients,
  isLoadingIngredients,
  lookupErrorMessage,
  mutationErrorMessage,
  isSubmitting,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  onRebind,
  onSetStatus,
}: InventoryTopologyOperationDialogProps) {
  const [deviceId, setDeviceId] = useState(target?.deviceId ?? "");
  const [ingredientId, setIngredientId] = useState(target?.ingredientId ?? "");
  const [containerCode, setContainerCode] = useState(target?.containerCode ?? "");
  const [capacity, setCapacity] = useState(
    target?.capacityQuantity?.toString() ?? "",
  );
  const [unit, setUnit] = useState(target?.unit ?? "gram");
  const [profileEnabled, setProfileEnabled] = useState(
    Boolean(target?.levelToQuantityProfile.length),
  );
  const [profile, setProfile] = useState<DispenserLevelQuantityPoint[]>(
    target?.levelToQuantityProfile.length
      ? target.levelToQuantityProfile
      : DEFAULT_PROFILE,
  );
  const [reason, setReason] = useState("");
  const [estimateDisposition, setEstimateDisposition] =
    useState<InventoryEstimateDisposition>(
      target?.estimatedQuantity && target.estimatedQuantity > 0
        ? "Discard"
        : "None",
    );
  const [acknowledged, setAcknowledged] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const availableDevices = useMemo(
    () => devices.filter((device) => device.canHostDispenser && device.status !== "Retired"),
    [devices],
  );
  const currentIngredient = ingredients.find((item) => item.id === ingredientId);
  const canTransferEstimate = Boolean(
    target &&
      target.ingredientId === ingredientId &&
      target.unit.trim().toLocaleLowerCase() === unit.trim().toLocaleLowerCase(),
  );
  const copy = MODE_COPY[mode];
  const isStatusMode = mode === "status";

  const updateProfile = (
    level: DispenserLevelQuantityPoint["level"],
    value: string,
  ) => {
    const quantity = Number(value);
    setProfile((current) =>
      current.map((point) =>
        point.level === level
          ? { ...point, estimatedQuantity: Number.isFinite(quantity) ? quantity : 0 }
          : point,
      ),
    );
  };

  const submit = async () => {
    const normalizedReason = reason.trim();
    if (isStatusMode) {
      if (!target || normalizedReason.length < 3) {
        setValidationMessage("Vui lòng nhập lý do ít nhất 3 ký tự.");
        return;
      }
      if (!acknowledged) {
        setValidationMessage("Vui lòng xác nhận tác động của thay đổi trạng thái.");
        return;
      }
      const result = await onSetStatus(target.id, {
        isActive: !target.isActive,
        reason: normalizedReason,
      });
      if (result) onOpenChange(false);
      return;
    }

    const parsedCapacity = numericValue(capacity);
    if ((mode === "create" || mode === "rebind") && (!deviceId || !ingredientId)) {
      setValidationMessage("Thiết bị và nguyên liệu là bắt buộc.");
      return;
    }
    if (!containerCode.trim() || !unit.trim()) {
      setValidationMessage("Mã khay và đơn vị là bắt buộc.");
      return;
    }
    if (Number.isNaN(parsedCapacity) || (parsedCapacity !== null && parsedCapacity <= 0)) {
      setValidationMessage("Sức chứa phải là số lớn hơn 0 hoặc để trống.");
      return;
    }

    const normalizedProfile = profileEnabled ? profile : [];
    if (profileEnabled) {
      const quantities = normalizedProfile.map((point) => point.estimatedQuantity);
      if (
        quantities.some((quantity) => quantity < 0) ||
        !(quantities[0] < quantities[1] && quantities[1] < quantities[2])
      ) {
        setValidationMessage("Mức Sắp hết, Trung bình và Đầy phải tăng dần.");
        return;
      }
      if (parsedCapacity !== null && quantities.some((quantity) => quantity > parsedCapacity)) {
        setValidationMessage("Mức quy đổi không được vượt quá sức chứa.");
        return;
      }
    }

    const commonRequest = {
      capacityQuantity: parsedCapacity,
      unit: unit.trim(),
      levelToQuantityProfile: normalizedProfile,
    };
    let result: unknown = null;
    if (mode === "create") {
      result = await onCreate({
        ...commonRequest,
        deviceId,
        ingredientId,
        containerCode: containerCode.trim(),
      });
    } else if (mode === "update" && target) {
      if (normalizedReason.length < 3) {
        setValidationMessage("Vui lòng nhập lý do ít nhất 3 ký tự.");
        return;
      }
      result = await onUpdate(target.id, {
        ...commonRequest,
        reason: normalizedReason,
      });
    } else if (mode === "rebind" && target) {
      if (normalizedReason.length < 3) {
        setValidationMessage("Vui lòng nhập lý do ít nhất 3 ký tự.");
        return;
      }
      if (target.estimatedQuantity && target.estimatedQuantity > 0) {
        if (estimateDisposition === "None") {
          setValidationMessage("Phải chọn chuyển tiếp hoặc loại bỏ lượng tồn hiện tại.");
          return;
        }
        if (estimateDisposition === "Transfer" && !canTransferEstimate) {
          setValidationMessage("Chỉ được chuyển lượng tồn khi nguyên liệu và đơn vị không đổi.");
          return;
        }
      }
      if (!acknowledged) {
        setValidationMessage("Vui lòng xác nhận liên kết hiện tại sẽ được ngừng sử dụng.");
        return;
      }
      result = await onRebind(target.id, {
        ...commonRequest,
        deviceId,
        ingredientId,
        containerCode: containerCode.trim(),
        estimateDisposition,
        reason: normalizedReason,
      });
    }

    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!isSubmitting}>
        <DialogHeader className="gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            {mode === "rebind" ? <Link2 className="size-5" /> : mode === "status" ? <Boxes className="size-5" /> : <Settings2 className="size-5" />}
          </span>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {!isStatusMode ? (
          <div className="space-y-4">
            {mode === "create" || mode === "rebind" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Thiết bị</Label>
                  <Select value={deviceId} onValueChange={(value) => setDeviceId(value ?? "")} disabled={isSubmitting}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn thiết bị" /></SelectTrigger>
                    <SelectContent>
                      {availableDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.name} · {device.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nguyên liệu</Label>
                  <Select value={ingredientId} onValueChange={(value) => setIngredientId(value ?? "")} disabled={isSubmitting || isLoadingIngredients}>
                    <SelectTrigger className="w-full"><SelectValue placeholder={isLoadingIngredients ? "Đang tải..." : "Chọn nguyên liệu"} /></SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} · {ingredient.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {lookupErrorMessage ? (
              <p className="text-sm text-destructive">{lookupErrorMessage}</p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="topology-container-code">Mã khay</Label>
                <Input id="topology-container-code" value={containerCode} disabled={isSubmitting || mode === "update"} maxLength={50} onChange={(event) => setContainerCode(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topology-capacity">Sức chứa</Label>
                <Input id="topology-capacity" type="number" min="0.000001" step="any" value={capacity} disabled={isSubmitting} onChange={(event) => setCapacity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topology-unit">Đơn vị</Label>
                <Input id="topology-unit" value={unit} maxLength={30} disabled={isSubmitting} onChange={(event) => setUnit(event.target.value)} />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-border p-3">
              <input type="checkbox" checked={profileEnabled} disabled={isSubmitting} className="mt-0.5 size-4 accent-primary" onChange={(event) => setProfileEnabled(event.target.checked)} />
              <span>
                <span className="block text-sm font-medium text-foreground">Khai báo quy đổi mức cảm biến</span>
                <span className="block text-xs leading-5 text-muted-foreground">Nếu bật, phải nhập đủ ba mức tăng dần: Sắp hết, Trung bình và Đầy.</span>
              </span>
            </label>

            {profileEnabled ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {profile.map((point) => (
                  <div key={point.level} className="space-y-2">
                    <Label htmlFor={`profile-${point.level}`}>{point.level === "Low" ? "Sắp hết" : point.level === "Medium" ? "Trung bình" : "Đầy"}</Label>
                    <Input id={`profile-${point.level}`} type="number" min="0" step="any" value={point.estimatedQuantity} disabled={isSubmitting} onChange={(event) => updateProfile(point.level, event.target.value)} />
                  </div>
                ))}
              </div>
            ) : null}

            {mode === "rebind" && target?.estimatedQuantity && target.estimatedQuantity > 0 ? (
              <div className="space-y-2">
                <Label>Xử lý lượng tồn ước tính hiện tại</Label>
                <Select value={estimateDisposition} onValueChange={(value) => { if (value) setEstimateDisposition(value as InventoryEstimateDisposition); }} disabled={isSubmitting}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {canTransferEstimate ? <SelectItem value="Transfer">Chuyển sang liên kết mới</SelectItem> : null}
                    <SelectItem value="Discard">Ghi nhận loại bỏ</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Hiện có {target.estimatedQuantity} {target.unit}. Chuyển tiếp chỉ hợp lệ khi nguyên liệu và đơn vị không đổi.</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
            {target?.isActive
              ? "Ngừng sử dụng sẽ chặn refill, điều chỉnh và consumption mới trên liên kết này."
              : "Kích hoạt lại chỉ thành công khi thiết bị, nguyên liệu và capability vẫn hợp lệ."}
          </div>
        )}

        {mode !== "create" ? (
          <div className="space-y-2">
            <Label htmlFor="topology-reason">Lý do</Label>
            <textarea id="topology-reason" value={reason} maxLength={500} disabled={isSubmitting} className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setReason(event.target.value)} />
          </div>
        ) : null}

        {mode === "rebind" || mode === "status" ? (
          <label className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <input type="checkbox" checked={acknowledged} disabled={isSubmitting} className="mt-0.5 size-4 accent-primary" onChange={(event) => setAcknowledged(event.target.checked)} />
            <span className="text-sm text-foreground">
              Tôi đã kiểm tra phạm vi kiosk và hiểu liên kết hiện tại sẽ thay đổi trạng thái.
            </span>
          </label>
        ) : null}

        {currentIngredient && mode === "rebind" ? (
          <p className="text-xs text-muted-foreground">Nguyên liệu đích: {currentIngredient.name} · {currentIngredient.code}</p>
        ) : null}

        {validationMessage || mutationErrorMessage ? (
          <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{validationMessage || mutationErrorMessage}</p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button isLoading={isSubmitting} onClick={() => void submit()}>
            {mode === "create" ? "Tạo bộ phân phối" : mode === "update" ? "Lưu cấu hình" : mode === "rebind" ? "Xác nhận thay thế" : target?.isActive ? "Ngừng sử dụng" : "Kích hoạt lại"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
