"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

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
import type {
  CreateDeviceModelRequest,
  CreateDeviceTypeRequest,
  DeviceModelResult,
  DeviceTypeResult,
  UpdateDeviceModelRequest,
  UpdateDeviceTypeRequest,
} from "@/types/device-catalog";

interface DeviceTypeFormState {
  code: string;
  name: string;
  description: string;
  category: string;
  requiresKioskAssignment: boolean;
  displayOrder: string;
}

function initialTypeForm(type: DeviceTypeResult | null): DeviceTypeFormState {
  return type
    ? {
        code: type.code,
        name: type.name,
        description: type.description ?? "",
        category: type.category,
        requiresKioskAssignment: type.requiresKioskAssignment,
        displayOrder: String(type.displayOrder),
      }
    : {
        code: "",
        name: "",
        description: "",
        category: "Peripheral",
        requiresKioskAssignment: true,
        displayOrder: "0",
      };
}

export function DeviceTypeFormDialog({
  open,
  deviceType,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  deviceType: DeviceTypeResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateDeviceTypeRequest) => Promise<boolean>;
  onUpdate: (
    deviceTypeId: number,
    request: UpdateDeviceTypeRequest,
  ) => Promise<boolean>;
}) {
  const [form, setForm] = useState<DeviceTypeFormState>(() =>
    initialTypeForm(deviceType),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const setField = <K extends keyof DeviceTypeFormState>(
    field: K,
    value: DeviceTypeFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationMessage(null);
  };

  const submit = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const category = form.category.trim();
    const displayOrder = Number(form.displayOrder);

    if (!deviceType && (code.length < 2 || code.length > 50)) {
      setValidationMessage("Mã loại thiết bị phải có từ 2 đến 50 ký tự.");
      return;
    }
    if (!name || name.length > 200) {
      setValidationMessage("Tên loại thiết bị là bắt buộc và tối đa 200 ký tự.");
      return;
    }
    if (!category || category.length > 50) {
      setValidationMessage("Nhóm thiết bị là bắt buộc và tối đa 50 ký tự.");
      return;
    }
    if (form.description.trim().length > 1000) {
      setValidationMessage("Mô tả không được vượt quá 1000 ký tự.");
      return;
    }
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setValidationMessage("Thứ tự hiển thị phải là số nguyên không âm.");
      return;
    }

    const request = {
      name,
      description: form.description.trim() || null,
      category,
      requiresKioskAssignment: form.requiresKioskAssignment,
      displayOrder,
    };
    const succeeded = deviceType
      ? await onUpdate(deviceType.id, request)
      : await onCreate({ code, ...request });
    if (succeeded) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {deviceType ? "Chỉnh sửa loại thiết bị" : "Tạo loại thiết bị"}
          </DialogTitle>
          <DialogDescription>
            Loại thiết bị là catalog toàn cục, không tạo thiết bị vật lý.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="device-type-code" className="text-sm font-medium">Mã loại</label>
            <Input id="device-type-code" value={form.code} maxLength={50} disabled={Boolean(deviceType) || isSubmitting} onChange={(event) => setField("code", event.target.value)} placeholder="ROBOT_CONTROLLER" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="device-type-name" className="text-sm font-medium">Tên loại</label>
            <Input id="device-type-name" value={form.name} maxLength={200} disabled={isSubmitting} onChange={(event) => setField("name", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="device-type-category" className="text-sm font-medium">Nhóm thiết bị</label>
            <Input id="device-type-category" value={form.category} maxLength={50} disabled={isSubmitting} onChange={(event) => setField("category", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="device-type-order" className="text-sm font-medium">Thứ tự hiển thị</label>
            <Input id="device-type-order" type="number" min={0} step={1} value={form.displayOrder} disabled={isSubmitting} onChange={(event) => setField("displayOrder", event.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="device-type-description" className="text-sm font-medium">Mô tả</label>
            <textarea id="device-type-description" value={form.description} maxLength={1000} rows={3} disabled={isSubmitting} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" onChange={(event) => setField("description", event.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.requiresKioskAssignment} disabled={isSubmitting} onChange={(event) => setField("requiresKioskAssignment", event.target.checked)} className="size-4 accent-primary" />
            Bắt buộc gán thiết bị vào kiosk
          </label>
        </div>
        {validationMessage || errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage ?? errorMessage}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" isLoading={isSubmitting} onClick={() => void submit()}>{deviceType ? "Lưu thay đổi" : "Tạo loại thiết bị"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeviceModelFormState {
  code: string;
  name: string;
  manufacturer: string;
  modelNumber: string;
  firmwareFamily: string;
  capabilities: string;
}

function initialModelForm(model: DeviceModelResult | null): DeviceModelFormState {
  return model
    ? {
        code: model.code,
        name: model.name,
        manufacturer: model.manufacturer ?? "",
        modelNumber: model.modelNumber ?? "",
        firmwareFamily: model.firmwareFamily ?? "",
        capabilities: model.capabilities.join("\n"),
      }
    : {
        code: "",
        name: "",
        manufacturer: "",
        modelNumber: "",
        firmwareFamily: "",
        capabilities: "",
      };
}

export function DeviceModelFormDialog({
  open,
  deviceType,
  model,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  deviceType: DeviceTypeResult;
  model: DeviceModelResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    deviceTypeId: number,
    request: CreateDeviceModelRequest,
  ) => Promise<boolean>;
  onUpdate: (
    deviceModelId: string,
    request: UpdateDeviceModelRequest,
  ) => Promise<boolean>;
}) {
  const [form, setForm] = useState<DeviceModelFormState>(() =>
    initialModelForm(model),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const setField = (field: keyof DeviceModelFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationMessage(null);
  };

  const submit = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const capabilities = form.capabilities
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);
    const normalizedCapabilities = new Set(
      capabilities.map((value) => value.toLowerCase()),
    );

    if (!model && (code.length < 2 || code.length > 50)) {
      setValidationMessage("Mã model phải có từ 2 đến 50 ký tự.");
      return;
    }
    if (!name || name.length > 200) {
      setValidationMessage("Tên model là bắt buộc và tối đa 200 ký tự.");
      return;
    }
    if (form.manufacturer.trim().length > 200 || form.modelNumber.trim().length > 100 || form.firmwareFamily.trim().length > 100) {
      setValidationMessage("Hãng tối đa 200 ký tự; model và firmware tối đa 100 ký tự.");
      return;
    }
    if (capabilities.length > 100 || capabilities.some((value) => value.length > 100)) {
      setValidationMessage("Tối đa 100 capability và mỗi giá trị tối đa 100 ký tự.");
      return;
    }
    if (normalizedCapabilities.size !== capabilities.length) {
      setValidationMessage("Danh sách capability không được trùng lặp.");
      return;
    }

    const request = {
      name,
      manufacturer: form.manufacturer.trim() || null,
      modelNumber: form.modelNumber.trim() || null,
      firmwareFamily: form.firmwareFamily.trim() || null,
      capabilities,
    };
    const succeeded = model
      ? await onUpdate(model.id, request)
      : await onCreate(deviceType.id, { code, ...request });
    if (succeeded) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{model ? "Chỉnh sửa model thiết bị" : "Tạo model thiết bị"}</DialogTitle>
          <DialogDescription>Thuộc loại {deviceType.name}. Thao tác này chỉ quản lý catalog phần cứng.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><label htmlFor="device-model-code" className="text-sm font-medium">Mã model</label><Input id="device-model-code" value={form.code} maxLength={50} disabled={Boolean(model) || isSubmitting} onChange={(event) => setField("code", event.target.value)} /></div>
          <div className="space-y-1.5"><label htmlFor="device-model-name" className="text-sm font-medium">Tên model</label><Input id="device-model-name" value={form.name} maxLength={200} disabled={isSubmitting} onChange={(event) => setField("name", event.target.value)} /></div>
          <div className="space-y-1.5"><label htmlFor="device-model-manufacturer" className="text-sm font-medium">Hãng sản xuất</label><Input id="device-model-manufacturer" value={form.manufacturer} maxLength={200} disabled={isSubmitting} onChange={(event) => setField("manufacturer", event.target.value)} /></div>
          <div className="space-y-1.5"><label htmlFor="device-model-number" className="text-sm font-medium">Mã phần cứng</label><Input id="device-model-number" value={form.modelNumber} maxLength={100} disabled={isSubmitting} onChange={(event) => setField("modelNumber", event.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><label htmlFor="device-model-firmware" className="text-sm font-medium">Họ firmware</label><Input id="device-model-firmware" value={form.firmwareFamily} maxLength={100} disabled={isSubmitting} onChange={(event) => setField("firmwareFamily", event.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><label htmlFor="device-model-capabilities" className="text-sm font-medium">Capabilities</label><textarea id="device-model-capabilities" value={form.capabilities} rows={5} disabled={isSubmitting} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" onChange={(event) => setField("capabilities", event.target.value)} placeholder="DISPENSE\nTEMPERATURE_SENSOR" /><p className="text-xs text-muted-foreground">Mỗi dòng hoặc dấu phẩy là một capability.</p></div>
        </div>
        {validationMessage || errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage ?? errorMessage}</p> : null}
        <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="button" isLoading={isSubmitting} onClick={() => void submit()}>{model ? "Lưu thay đổi" : "Tạo model"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RetireDeviceModelDialog({
  model,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: {
  model: DeviceModelResult | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (model: DeviceModelResult) => Promise<boolean>;
}) {
  return (
    <Dialog open={model !== null} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Ngừng sử dụng model thiết bị?</DialogTitle><DialogDescription>Model sẽ bị retire theo lifecycle backend. Thiết bị đã tồn tại không bị xóa khỏi lịch sử.</DialogDescription></DialogHeader>
        {errorMessage ? <p className="text-sm text-destructive" role="alert">{errorMessage}</p> : null}
        <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="button" variant="destructive" isLoading={isSubmitting} onClick={async () => { if (!model) return; const succeeded = await onConfirm(model); if (succeeded) onOpenChange(false); }}><Trash2 className="size-4" />Ngừng sử dụng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
