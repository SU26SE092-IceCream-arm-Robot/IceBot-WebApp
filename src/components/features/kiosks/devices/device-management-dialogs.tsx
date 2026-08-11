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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeviceCatalog } from "@/hooks/kiosks/use-device-catalog";
import type {
  CreateDeviceRequest,
  DeviceResult,
  DeviceStatus,
  UpdateDeviceRequest,
} from "@/types/kiosks/devices";
import type {
  CreateExecutionEndpointRequest,
  ExecutionEndpointResult,
  ExecutionProfile,
} from "@/types/kiosks/execution-endpoints";

const NO_MODEL = "__none__";

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function nullable(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

interface DeviceFormDialogProps {
  open: boolean;
  device?: DeviceResult | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateDeviceRequest) => Promise<unknown>;
  onUpdate: (deviceId: string, request: UpdateDeviceRequest) => Promise<unknown>;
}

export function DeviceFormDialog({
  open,
  device,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: DeviceFormDialogProps) {
  const catalog = useDeviceCatalog(open, device?.deviceTypeId);
  const [code, setCode] = useState(device?.code ?? "");
  const [name, setName] = useState(device?.name ?? "");
  const [deviceTypeId, setDeviceTypeId] = useState<number | null>(device?.deviceTypeId ?? null);
  const [deviceModelId, setDeviceModelId] = useState(device?.deviceModelId ?? NO_MODEL);
  const [serialNumber, setSerialNumber] = useState(device?.serialNumber ?? "");
  const [positionLabel, setPositionLabel] = useState(device?.positionLabel ?? "");
  const [firmwareVersion, setFirmwareVersion] = useState(device?.firmwareVersion ?? "");
  const [installedAt, setInstalledAt] = useState(toLocalDateTime(device?.installedAt));
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const effectiveDeviceTypeId = deviceTypeId ?? catalog.selectedTypeId;
  const selectedType = catalog.types.find((item) => item.id === effectiveDeviceTypeId);
  const selectedModel = catalog.models.find((item) => item.id === deviceModelId);
  const modelLabel =
    deviceModelId === NO_MODEL
      ? "Không chọn model"
      : selectedModel
        ? `${selectedModel.name} — ${selectedModel.code}`
        : device?.deviceModelId === deviceModelId
          ? device.deviceModelCode || "Model hiện tại"
          : "Chọn model";

  const submit = async () => {
    if (effectiveDeviceTypeId === null || name.trim().length === 0) {
      setValidationMessage("Loại thiết bị và tên thiết bị là bắt buộc.");
      return;
    }
    if (!device && (code.trim().length < 1 || code.trim().length > 100)) {
      setValidationMessage("Mã thiết bị phải có từ 1 đến 100 ký tự.");
      return;
    }
    if (name.trim().length > 200) {
      setValidationMessage("Tên thiết bị không được vượt quá 200 ký tự.");
      return;
    }

    const common: UpdateDeviceRequest = {
      deviceTypeId: effectiveDeviceTypeId,
      deviceModelId: deviceModelId === NO_MODEL ? null : deviceModelId,
      name: name.trim(),
      serialNumber: nullable(serialNumber),
      positionLabel: nullable(positionLabel),
      firmwareVersion: nullable(firmwareVersion),
      installedAt: installedAt ? new Date(installedAt).toISOString() : null,
    };
    const result = device
      ? await onUpdate(device.id, common)
      : await onCreate({ ...common, code: code.trim() });
    if (result) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{device ? "Chỉnh sửa thiết bị" : "Tạo thiết bị"}</DialogTitle>
          <DialogDescription>
            Thiết bị mới bắt đầu ở trạng thái chờ cấu hình. Màn hình này không cấp credential hoặc gửi lệnh tới thiết bị.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {!device ? (
            <div className="space-y-1.5">
              <Label htmlFor="device-code">Mã thiết bị</Label>
              <Input id="device-code" maxLength={100} value={code} onChange={(event) => setCode(event.target.value)} disabled={isSubmitting} />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="device-name">Tên thiết bị</Label>
            <Input id="device-name" maxLength={200} value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-1.5">
            <Label>Loại thiết bị</Label>
            <Select
              value={effectiveDeviceTypeId?.toString() ?? null}
              disabled={isSubmitting || catalog.typesLoading}
              onValueChange={(value) => {
                const next = Number(value);
                setDeviceTypeId(next);
                setDeviceModelId(NO_MODEL);
                catalog.selectType(next);
              }}
            >
              <SelectTrigger className="w-full"><SelectValue>{selectedType ? `${selectedType.name} — ${selectedType.code}` : "Chọn loại thiết bị"}</SelectValue></SelectTrigger>
              <SelectContent>{catalog.types.map((item) => <SelectItem key={item.id} value={item.id.toString()}>{item.name} — {item.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Model thiết bị</Label>
            <Select value={deviceModelId} disabled={isSubmitting || catalog.modelsLoading || effectiveDeviceTypeId === null} onValueChange={(value) => setDeviceModelId(value ?? NO_MODEL)}>
              <SelectTrigger className="w-full"><SelectValue>{modelLabel}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MODEL}>Không chọn model</SelectItem>
                {device?.deviceModelId && !catalog.models.some((item) => item.id === device.deviceModelId) ? <SelectItem value={device.deviceModelId}>{device.deviceModelCode || "Model hiện tại"}</SelectItem> : null}
                {catalog.models.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} — {item.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="device-serial">Số serial</Label><Input id="device-serial" maxLength={150} value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} disabled={isSubmitting} /></div>
          <div className="space-y-1.5"><Label htmlFor="device-position">Vị trí lắp đặt</Label><Input id="device-position" maxLength={100} value={positionLabel} onChange={(event) => setPositionLabel(event.target.value)} disabled={isSubmitting} /></div>
          <div className="space-y-1.5"><Label htmlFor="device-firmware">Phiên bản firmware</Label><Input id="device-firmware" maxLength={100} value={firmwareVersion} onChange={(event) => setFirmwareVersion(event.target.value)} disabled={isSubmitting} /></div>
          <div className="space-y-1.5"><Label htmlFor="device-installed">Thời điểm lắp đặt</Label><Input id="device-installed" type="datetime-local" value={installedAt} onChange={(event) => setInstalledAt(event.target.value)} disabled={isSubmitting} /></div>
        </div>

        {catalog.typesError || catalog.modelsError ? <p className="text-sm text-warning">{catalog.typesError || catalog.modelsError}</p> : null}
        {validationMessage || errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || errorMessage}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button>
          <Button type="button" onClick={() => void submit()} disabled={isSubmitting}>{isSubmitting ? "Đang lưu..." : device ? "Lưu thay đổi" : "Tạo thiết bị"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeviceStatusDialog({
  device,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  device: DeviceResult;
  open: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (status: Exclude<DeviceStatus, "Retired">) => Promise<unknown>;
}) {
  const options = useMemo<Exclude<DeviceStatus, "Retired">[]>(() => {
    const transitions: Record<DeviceStatus, Exclude<DeviceStatus, "Retired">[]> = {
      Provisioning: ["Online", "Offline", "Maintenance", "Error", "Disabled"],
      Online: ["Offline", "Maintenance", "Error", "Disabled"],
      Offline: ["Online", "Maintenance", "Error", "Disabled"],
      Maintenance: ["Online", "Offline", "Error", "Disabled"],
      Error: ["Online", "Offline", "Maintenance", "Disabled"],
      Disabled: ["Provisioning"],
      Retired: [],
    };
    return transitions[device.status];
  }, [device.status]);
  const [status, setStatus] = useState<Exclude<DeviceStatus, "Retired"> | null>(options[0] ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Đổi trạng thái thiết bị</DialogTitle><DialogDescription>{device.name}. Trạng thái này là vòng đời quản trị, không thay thế bằng chứng kết nối.</DialogDescription></DialogHeader>
        <Select value={status} disabled={isSubmitting || options.length === 0} onValueChange={(value) => setStatus(value as Exclude<DeviceStatus, "Retired">)}>
          <SelectTrigger className="w-full"><SelectValue>{status ? getDeviceStatusLabel(status) : "Không có trạng thái hợp lệ"}</SelectValue></SelectTrigger>
          <SelectContent>{options.map((item) => <SelectItem key={item} value={item}>{getDeviceStatusLabel(item)}</SelectItem>)}</SelectContent>
        </Select>
        {errorMessage ? <p className="text-sm text-destructive" role="alert">{errorMessage}</p> : null}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button><Button onClick={async () => { if (status && await onSubmit(status)) onOpenChange(false); }} disabled={isSubmitting || !status}>Xác nhận</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RetireDeviceDialog({
  device,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  device: DeviceResult;
  open: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ngừng sử dụng thiết bị</DialogTitle><DialogDescription>Thao tác sẽ retire {device.name} và topology dispenser đang hoạt động liên quan. Không thể thực hiện khi kiosk có execution đang chạy.</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="retire-device-reason">Lý do</Label><Input id="retire-device-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={isSubmitting} /></div>
        {errorMessage ? <p className="text-sm text-destructive" role="alert">{errorMessage}</p> : null}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button><Button variant="destructive" onClick={async () => { if (await onSubmit(reason)) onOpenChange(false); }} disabled={isSubmitting}>Ngừng sử dụng</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReplaceDeviceDialog({
  device,
  candidates,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  device: DeviceResult;
  candidates: DeviceResult[];
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (replacementDeviceId: string, reason: string) => Promise<unknown>;
}) {
  const [replacementDeviceId, setReplacementDeviceId] = useState("");
  const [reason, setReason] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const replacement = candidates.find((item) => item.id === replacementDeviceId);

  const submit = async () => {
    const normalizedReason = reason.trim();
    if (!replacementDeviceId) {
      setValidationMessage("Chọn thiết bị thay thế.");
      return;
    }
    if (normalizedReason.length < 3 || normalizedReason.length > 500) {
      setValidationMessage("Lý do thay thế phải có từ 3 đến 500 ký tự.");
      return;
    }
    if (await onSubmit(replacementDeviceId, normalizedReason)) onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thay thiết bị {device.name}</DialogTitle>
          <DialogDescription>
            Thiết bị cũ sẽ được retire. Backend chuyển topology dispenser và số lượng ước tính sang thiết bị thay thế trong một transaction; thao tác bị chặn khi kiosk đang sản xuất.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Thiết bị thay thế</Label>
          <Select value={replacementDeviceId || null} disabled={isSubmitting || candidates.length === 0} onValueChange={(value) => setReplacementDeviceId(value ?? "")}>
            <SelectTrigger className="w-full"><SelectValue>{replacement ? `${replacement.name} — ${replacement.code}` : "Chọn thiết bị đã có trong kiosk"}</SelectValue></SelectTrigger>
            <SelectContent>{candidates.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} — {item.code} ({item.deviceTypeCode})</SelectItem>)}</SelectContent>
          </Select>
          {candidates.length === 0 ? <p className="text-xs text-warning">Hãy tạo thiết bị thay thế trước khi thực hiện chuyển đổi.</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="replace-device-reason">Lý do</Label>
          <Input id="replace-device-reason" maxLength={500} value={reason} disabled={isSubmitting} onChange={(event) => setReason(event.target.value)} />
        </div>
        {validationMessage || errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || errorMessage}</p> : null}
        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button isLoading={isSubmitting} disabled={candidates.length === 0} onClick={() => void submit()}>Xác nhận thay thiết bị</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExecutionEndpointCreateDialog({
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: CreateExecutionEndpointRequest) => Promise<unknown>;
}) {
  const [endpointCode, setEndpointCode] = useState("");
  const [executionProfile, setExecutionProfile] = useState<ExecutionProfile>("FullEdge");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const submit = async () => {
    const normalized = endpointCode.trim();
    if (normalized.length < 1 || normalized.length > 100) {
      setValidationMessage("Mã điểm thực thi phải có từ 1 đến 100 ký tự.");
      return;
    }
    if (await onSubmit({ endpointCode: normalized, executionProfile })) onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tạo điểm thực thi</DialogTitle><DialogDescription>Điểm thực thi được tạo ở trạng thái chờ cấu hình. Việc cấp thông tin kết nối thuộc quy trình kỹ thuật riêng.</DialogDescription></DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="endpoint-code">Mã điểm thực thi</Label><Input id="endpoint-code" maxLength={100} value={endpointCode} onChange={(event) => setEndpointCode(event.target.value)} disabled={isSubmitting} /></div>
        <div className="space-y-1.5"><Label>Hồ sơ thực thi</Label><Select value={executionProfile} disabled={isSubmitting} onValueChange={(value) => setExecutionProfile(value as ExecutionProfile)}><SelectTrigger className="w-full"><SelectValue>{executionProfile === "FullEdge" ? "Full Edge" : "Bộ điều khiển chi phí thấp"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="FullEdge">Full Edge</SelectItem><SelectItem value="LowCostController">Bộ điều khiển chi phí thấp</SelectItem></SelectContent></Select></div>
        {validationMessage || errorMessage ? <p className="text-sm text-destructive" role="alert">{validationMessage || errorMessage}</p> : null}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button><Button onClick={() => void submit()} disabled={isSubmitting}>{isSubmitting ? "Đang tạo..." : "Tạo điểm thực thi"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EndpointLifecycleDialog({
  endpoint,
  action,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onSubmit,
}: {
  endpoint: ExecutionEndpointResult;
  action: "disable" | "reactivate" | "retire";
  isSubmitting: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<unknown>;
}) {
  const labels = action === "disable" ? ["Vô hiệu hóa điểm thực thi", "Vô hiệu hóa"] : action === "reactivate" ? ["Kích hoạt lại điểm thực thi", "Kích hoạt lại"] : ["Ngừng sử dụng điểm thực thi", "Ngừng sử dụng"];
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{labels[0]}</DialogTitle><DialogDescription>{endpoint.endpointCode}. Thao tác chỉ thay đổi trạng thái quản lý trên hệ thống; không gửi lệnh trực tiếp tới thiết bị hoặc robot.</DialogDescription></DialogHeader>
        {action === "retire" ? <p className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">Điểm thực thi đang hoạt động phải được vô hiệu hóa trước. Hệ thống cũng sẽ chặn thao tác nếu thông tin kết nối chưa được thu hồi theo quy trình kỹ thuật.</p> : null}
        {errorMessage ? <p className="text-sm text-destructive" role="alert">{errorMessage}</p> : null}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Hủy</Button><Button variant={action === "retire" ? "destructive" : "default"} onClick={async () => { if (await onSubmit()) onOpenChange(false); }} disabled={isSubmitting}>{labels[1]}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function getDeviceStatusLabel(status: DeviceStatus) {
  const labels: Record<DeviceStatus, string> = {
    Provisioning: "Đang cấu hình",
    Online: "Trực tuyến",
    Offline: "Ngoại tuyến",
    Maintenance: "Bảo trì",
    Error: "Có lỗi",
    Disabled: "Đã vô hiệu hóa",
    Retired: "Đã ngừng sử dụng",
  };
  return labels[status];
}
