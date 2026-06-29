"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Building2, MapPinned, Power, PowerOff } from "lucide-react";

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
import type { StoreResult } from "@/types/kiosk-management";
import type {
  CreateOrganizationRequest,
  CreateStoreRequest,
  OrganizationResult,
  UpdateOrganizationRequest,
  UpdateStoreRequest,
} from "@/types/tenant-management";

function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  ) : null;
}

function optional(value: string): string | null {
  return value.trim() || null;
}

function isValidJson(value: string): boolean {
  if (!value.trim()) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface OrganizationFormDialogProps {
  organization: OrganizationResult | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateOrganizationRequest) => Promise<boolean>;
  onUpdate: (request: UpdateOrganizationRequest) => Promise<boolean>;
}

export function OrganizationFormDialog({
  organization,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: OrganizationFormDialogProps) {
  const isCreate = !organization;
  const [code, setCode] = useState(organization?.code ?? "");
  const [name, setName] = useState(organization?.name ?? "");
  const [legalName, setLegalName] = useState(organization?.legalName ?? "");
  const [taxCode, setTaxCode] = useState(organization?.taxCode ?? "");
  const [email, setEmail] = useState(organization?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(organization?.phoneNumber ?? "");
  const [address, setAddress] = useState(organization?.address ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (isCreate && (code.trim().length < 2 || code.trim().length > 50)) {
      setValidationMessage("Mã tổ chức phải có từ 2 đến 50 ký tự.");
      return;
    }
    if (!name.trim() || name.trim().length > 200) {
      setValidationMessage("Tên tổ chức là bắt buộc và không vượt quá 200 ký tự.");
      return;
    }
    if (!isValidEmail(email)) {
      setValidationMessage("Email không đúng định dạng.");
      return;
    }
    setValidationMessage(null);
    const profile = {
      name: name.trim(),
      legalName: optional(legalName),
      taxCode: optional(taxCode),
      email: optional(email),
      phoneNumber: optional(phoneNumber),
      address: optional(address),
    };
    if (isCreate) {
      await onCreate({ code: code.trim().toUpperCase(), ...profile });
    } else {
      await onUpdate(profile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div className="space-y-1">
              <DialogTitle>{isCreate ? "Tạo tổ chức" : "Chỉnh sửa tổ chức"}</DialogTitle>
              <DialogDescription>
                {isCreate ? "Tạo phạm vi quản trị mới cho hệ thống." : organization.code}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {isCreate ? (
              <div className="space-y-1.5">
                <label htmlFor="organization-code" className="text-sm font-medium">Mã tổ chức <span className="text-destructive">*</span></label>
                <Input id="organization-code" value={code} maxLength={50} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} />
              </div>
            ) : null}
            <div className={`space-y-1.5 ${isCreate ? "" : "sm:col-span-2"}`}>
              <label htmlFor="organization-name" className="text-sm font-medium">Tên tổ chức <span className="text-destructive">*</span></label>
              <Input id="organization-name" value={name} maxLength={200} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="organization-legal-name" className="text-sm font-medium">Tên pháp lý</label>
              <Input id="organization-legal-name" value={legalName} disabled={isSubmitting} className="h-10" onChange={(event) => setLegalName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="organization-tax" className="text-sm font-medium">Mã số thuế</label>
              <Input id="organization-tax" value={taxCode} disabled={isSubmitting} className="h-10" onChange={(event) => setTaxCode(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="organization-phone" className="text-sm font-medium">Số điện thoại</label>
              <Input id="organization-phone" type="tel" value={phoneNumber} disabled={isSubmitting} className="h-10" onChange={(event) => setPhoneNumber(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="organization-email" className="text-sm font-medium">Email</label>
              <Input id="organization-email" type="email" value={email} disabled={isSubmitting} className="h-10" onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="organization-address" className="text-sm font-medium">Địa chỉ</label>
              <Input id="organization-address" value={address} disabled={isSubmitting} className="h-10" onChange={(event) => setAddress(event.target.value)} />
            </div>
          </div>
          <ErrorMessage message={validationMessage || errorMessage} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting}>{isCreate ? "Tạo tổ chức" : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface StoreFormDialogProps {
  organizationName: string;
  store: StoreResult | null;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (request: CreateStoreRequest) => Promise<boolean>;
  onUpdate: (request: UpdateStoreRequest) => Promise<boolean>;
}

export function StoreFormDialog({
  organizationName,
  store,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onCreate,
  onUpdate,
}: StoreFormDialogProps) {
  const isCreate = !store;
  const [code, setCode] = useState(store?.code ?? "");
  const [name, setName] = useState(store?.name ?? "");
  const [storeType, setStoreType] = useState(store?.storeType ?? "Retail");
  const [address, setAddress] = useState(store?.address ?? "");
  const [city, setCity] = useState(store?.city ?? "");
  const [province, setProvince] = useState(store?.province ?? "");
  const [country, setCountry] = useState(store?.country ?? "Việt Nam");
  const [timeZone, setTimeZone] = useState(store?.timeZone ?? "Asia/Bangkok");
  const [latitude, setLatitude] = useState(store?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(store?.longitude?.toString() ?? "");
  const [phoneNumber, setPhoneNumber] = useState(store?.phoneNumber ?? "");
  const [email, setEmail] = useState(store?.email ?? "");
  const [openingHoursJson, setOpeningHoursJson] = useState(store?.openingHoursJson ?? "");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (isCreate && (code.trim().length < 2 || code.trim().length > 50)) {
      setValidationMessage("Mã cửa hàng phải có từ 2 đến 50 ký tự.");
      return;
    }
    if (!name.trim() || name.trim().length > 200) {
      setValidationMessage("Tên cửa hàng là bắt buộc và không vượt quá 200 ký tự.");
      return;
    }
    if (!timeZone.trim()) {
      setValidationMessage("Múi giờ là bắt buộc.");
      return;
    }
    if (!isValidEmail(email)) {
      setValidationMessage("Email không đúng định dạng.");
      return;
    }
    if (!isValidJson(openingHoursJson)) {
      setValidationMessage("Giờ mở cửa phải là JSON hợp lệ.");
      return;
    }

    const parsedLatitude = latitude.trim() ? Number(latitude) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude) : null;
    if (parsedLatitude !== null && (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
      setValidationMessage("Vĩ độ phải nằm trong khoảng -90 đến 90.");
      return;
    }
    if (parsedLongitude !== null && (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
      setValidationMessage("Kinh độ phải nằm trong khoảng -180 đến 180.");
      return;
    }

    setValidationMessage(null);
    const profile: UpdateStoreRequest = {
      name: name.trim(),
      storeType: storeType.trim() || "Retail",
      address: optional(address),
      city: optional(city),
      province: optional(province),
      country: optional(country),
      timeZone: timeZone.trim(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      phoneNumber: optional(phoneNumber),
      email: optional(email),
      openingHoursSchemaVersion: store?.openingHoursSchemaVersion ?? 1,
      openingHoursJson: optional(openingHoursJson),
    };
    if (isCreate) {
      await onCreate({ code: code.trim().toUpperCase(), ...profile });
    } else {
      await onUpdate(profile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><MapPinned className="size-5" /></span>
            <div className="space-y-1"><DialogTitle>{isCreate ? "Tạo cửa hàng" : "Chỉnh sửa cửa hàng"}</DialogTitle><DialogDescription>{organizationName}</DialogDescription></div>
          </div>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {isCreate ? <div className="space-y-1.5"><label htmlFor="store-code" className="text-sm font-medium">Mã cửa hàng <span className="text-destructive">*</span></label><Input id="store-code" value={code} maxLength={50} disabled={isSubmitting} className="h-10 font-mono uppercase" onChange={(event) => setCode(event.target.value)} /></div> : null}
            <div className="space-y-1.5"><label htmlFor="store-name" className="text-sm font-medium">Tên cửa hàng <span className="text-destructive">*</span></label><Input id="store-name" value={name} maxLength={200} disabled={isSubmitting} className="h-10" onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-type" className="text-sm font-medium">Loại cửa hàng</label><Input id="store-type" value={storeType} disabled={isSubmitting} className="h-10" onChange={(event) => setStoreType(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-timezone" className="text-sm font-medium">Múi giờ <span className="text-destructive">*</span></label><Input id="store-timezone" value={timeZone} disabled={isSubmitting} className="h-10 font-mono" onChange={(event) => setTimeZone(event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="store-address" className="text-sm font-medium">Địa chỉ</label><Input id="store-address" value={address} disabled={isSubmitting} className="h-10" onChange={(event) => setAddress(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-city" className="text-sm font-medium">Thành phố</label><Input id="store-city" value={city} disabled={isSubmitting} className="h-10" onChange={(event) => setCity(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-province" className="text-sm font-medium">Tỉnh/Thành</label><Input id="store-province" value={province} disabled={isSubmitting} className="h-10" onChange={(event) => setProvince(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-country" className="text-sm font-medium">Quốc gia</label><Input id="store-country" value={country} disabled={isSubmitting} className="h-10" onChange={(event) => setCountry(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-phone" className="text-sm font-medium">Số điện thoại</label><Input id="store-phone" type="tel" value={phoneNumber} disabled={isSubmitting} className="h-10" onChange={(event) => setPhoneNumber(event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="store-email" className="text-sm font-medium">Email</label><Input id="store-email" type="email" value={email} disabled={isSubmitting} className="h-10" onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-latitude" className="text-sm font-medium">Vĩ độ</label><Input id="store-latitude" type="number" step="any" value={latitude} disabled={isSubmitting} className="h-10" onChange={(event) => setLatitude(event.target.value)} /></div>
            <div className="space-y-1.5"><label htmlFor="store-longitude" className="text-sm font-medium">Kinh độ</label><Input id="store-longitude" type="number" step="any" value={longitude} disabled={isSubmitting} className="h-10" onChange={(event) => setLongitude(event.target.value)} /></div>
            <div className="space-y-1.5 sm:col-span-2"><label htmlFor="store-hours" className="text-sm font-medium">Giờ mở cửa JSON</label><textarea id="store-hours" value={openingHoursJson} rows={3} disabled={isSubmitting} className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50" onChange={(event) => setOpeningHoursJson(event.target.value)} /></div>
          </div>
          <ErrorMessage message={validationMessage || errorMessage} />
          <DialogFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" isLoading={isSubmitting}>{isCreate ? "Tạo cửa hàng" : "Lưu thay đổi"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface LifecycleConfirmDialogProps {
  entityLabel: string;
  entityName: string;
  activate: boolean;
  open: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}

export function LifecycleConfirmDialog({
  entityLabel,
  entityName,
  activate,
  open,
  isSubmitting,
  errorMessage,
  onOpenChange,
  onConfirm,
}: LifecycleConfirmDialogProps) {
  const Icon = activate ? Power : PowerOff;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <DialogHeader><div className="flex items-start gap-3 pr-8"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${activate ? "border-success/20 bg-success/10 text-success" : "border-destructive/20 bg-destructive/10 text-destructive"}`}><Icon className="size-5" /></span><div className="space-y-1"><DialogTitle>{activate ? `Kích hoạt ${entityLabel}` : `Vô hiệu hóa ${entityLabel}`}</DialogTitle><DialogDescription>Xác nhận thao tác với {entityName}.</DialogDescription></div></div></DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">{activate ? `${entityLabel} sẽ có thể tiếp tục tham gia các luồng vận hành được backend cho phép.` : `${entityLabel} sẽ chuyển sang trạng thái không hoạt động. Dữ liệu hiện có không bị xóa.`}</p>
        <ErrorMessage message={errorMessage} />
        <DialogFooter><Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Quay lại</Button><Button variant={activate ? "default" : "destructive"} isLoading={isSubmitting} onClick={() => void onConfirm()}><Icon className="size-4" />Xác nhận</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
