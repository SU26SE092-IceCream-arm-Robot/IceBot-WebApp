"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plus, RefreshCw } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseCreateKioskResult } from "@/hooks/use-create-kiosk";
import type { CreateKioskRequest } from "@/types/kiosk-management";

const DEFAULT_KIOSK_TYPE = "RoboticVending";
const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";

interface KioskCreateDialogProps {
  createKiosk: UseCreateKioskResult;
}

interface FormState {
  organizationId: string;
  storeId: string;
  code: string;
  name: string;
  kioskType: string;
  serialNumber: string;
  timeZone: string;
  address: string;
  latitude: string;
  longitude: string;
  supportsOfflineMode: boolean;
}

const initialFormState: FormState = {
  organizationId: "",
  storeId: "",
  code: "",
  name: "",
  kioskType: DEFAULT_KIOSK_TYPE,
  serialNumber: "",
  timeZone: DEFAULT_TIME_ZONE,
  address: "",
  latitude: "",
  longitude: "",
  supportsOfflineMode: true,
};

function formatEntityOption(entity: {
  code?: string | null;
  name?: string | null;
}) {
  const name = entity.name?.trim();
  const code = entity.code?.trim();
  if (name && code) return `${name} — ${code}`;
  if (name) return name;
  if (code) return code;
  return "Không xác định";
}

function normalizeOptional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return Number(trimmed);
}

function getNumberError(
  label: string,
  value: string,
  minimum: number,
  maximum: number,
) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return `${label} phải là số hợp lệ.`;
  if (parsed < minimum || parsed > maximum) {
    return `${label} phải nằm trong khoảng ${minimum} đến ${maximum}.`;
  }
  return null;
}

function validateForm(form: FormState): string | null {
  const code = form.code.trim();
  const name = form.name.trim();
  const timeZone = form.timeZone.trim();

  if (!form.organizationId) return "Vui lòng chọn tổ chức.";
  if (!form.storeId) return "Vui lòng chọn cửa hàng.";
  if (code.length < 2 || code.length > 50) {
    return "Mã kiosk phải có từ 2 đến 50 ký tự.";
  }
  if (name.length === 0) return "Vui lòng nhập tên kiosk.";
  if (name.length > 200) return "Tên kiosk không được vượt quá 200 ký tự.";
  if (timeZone.length === 0) return "Vui lòng nhập múi giờ.";

  return (
    getNumberError("Vĩ độ", form.latitude, -90, 90) ??
    getNumberError("Kinh độ", form.longitude, -180, 180)
  );
}

function buildRequest(form: FormState): CreateKioskRequest {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    kioskType: form.kioskType.trim() || DEFAULT_KIOSK_TYPE,
    serialNumber: normalizeOptional(form.serialNumber),
    timeZone: form.timeZone.trim() || DEFAULT_TIME_ZONE,
    address: normalizeOptional(form.address),
    latitude: parseOptionalNumber(form.latitude),
    longitude: parseOptionalNumber(form.longitude),
    supportsOfflineMode: form.supportsOfflineMode,
  };
}

export function KioskCreateDialog({ createKiosk }: KioskCreateDialogProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [clientError, setClientError] = useState<string | null>(null);

  const selectedOrganization = useMemo(
    () =>
      createKiosk.organizations.find(
        (organization) => organization.id === form.organizationId,
      ) ?? null,
    [createKiosk.organizations, form.organizationId],
  );

  const filteredStores = useMemo(
    () =>
      createKiosk.stores.filter(
        (store) => store.organizationId === form.organizationId,
      ),
    [createKiosk.stores, form.organizationId],
  );

  const selectedStore = useMemo(
    () => filteredStores.find((store) => store.id === form.storeId) ?? null,
    [filteredStores, form.storeId],
  );

  const setField = <TField extends keyof FormState>(
    field: TField,
    value: FormState[TField],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setClientError(null);
  };

  const handleOrganizationChange = (organizationId: string | null) => {
    if (!organizationId) return;

    setForm((current) => ({
      ...current,
      organizationId,
      storeId: "",
      timeZone: DEFAULT_TIME_ZONE,
    }));
    setClientError(null);
  };

  const handleStoreChange = (storeId: string | null) => {
    if (!storeId) return;

    const store = createKiosk.stores.find((item) => item.id === storeId) ?? null;
    setForm((current) => ({
      ...current,
      storeId,
      timeZone: store?.timeZone?.trim() || DEFAULT_TIME_ZONE,
      address: current.address || store?.address || "",
    }));
    setClientError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setClientError(validationError);
      return;
    }

    const didCreate = await createKiosk.submit(form.storeId, buildRequest(form));
    if (didCreate) {
      setForm(initialFormState);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm(initialFormState);
      setClientError(null);
    }
    createKiosk.setOpen(open);
  };

  const shownError = clientError ?? createKiosk.errorMessage;

  return (
    <Dialog open={createKiosk.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden p-0 sm:max-w-3xl">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex max-h-[calc(100vh-2rem)] flex-col">
          <div className="space-y-1 border-b border-border px-5 pt-5 pb-4 pr-12">
            <DialogHeader>
              <DialogTitle>Tạo kiosk</DialogTitle>
              <DialogDescription>
                Tạo hồ sơ quản lý kiosk trong cửa hàng đã chọn. Kiosk mới sẽ bắt đầu ở trạng thái đang thiết lập.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {shownError ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{shownError}</span>
              </div>
            ) : null}

            {createKiosk.isLoadingOptions ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang tải tổ chức và cửa hàng...
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Tổ chức</span>
                <Select
                  value={form.organizationId}
                  onValueChange={handleOrganizationChange}
                  disabled={createKiosk.isSubmitting || createKiosk.isLoadingOptions}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue>
                      {selectedOrganization
                        ? formatEntityOption(selectedOrganization)
                        : "Chọn tổ chức"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {createKiosk.organizations.length === 0 ? (
                      <SelectItem value="__no_organizations__" disabled>
                        Chưa có tổ chức đang hoạt động
                      </SelectItem>
                    ) : (
                      createKiosk.organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>
                          {formatEntityOption(organization)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Cửa hàng</span>
                <Select
                  value={form.storeId}
                  onValueChange={handleStoreChange}
                  disabled={
                    createKiosk.isSubmitting ||
                    createKiosk.isLoadingOptions ||
                    !form.organizationId
                  }
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue>
                      {selectedStore ? formatEntityOption(selectedStore) : "Chọn cửa hàng"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {!form.organizationId ? (
                      <SelectItem value="__select_organization__" disabled>
                        Chọn tổ chức trước
                      </SelectItem>
                    ) : filteredStores.length === 0 ? (
                      <SelectItem value="__no_stores__" disabled>
                        Chưa có cửa hàng đang hoạt động
                      </SelectItem>
                    ) : (
                      filteredStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {formatEntityOption(store)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </label>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Mã kiosk</span>
                <Input
                  value={form.code}
                  onChange={(event) => setField("code", event.target.value)}
                  placeholder="KIOSK_DEMO_02"
                  maxLength={50}
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
                <span className="text-xs text-muted-foreground">Từ 2 đến 50 ký tự.</span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Tên kiosk</span>
                <Input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="IceBot Demo 02"
                  maxLength={200}
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Loại kiosk</span>
                <Select
                  value={form.kioskType}
                  onValueChange={(value) =>
                    setField("kioskType", value ?? DEFAULT_KIOSK_TYPE)
                  }
                  disabled={createKiosk.isSubmitting}
                >
                  <SelectTrigger className="bg-card">
                    <SelectValue>
                      {form.kioskType === DEFAULT_KIOSK_TYPE
                        ? "Kiosk robot bán kem"
                        : form.kioskType}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_KIOSK_TYPE}>
                      Kiosk robot bán kem
                    </SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Số serial</span>
                <Input
                  value={form.serialNumber}
                  onChange={(event) => setField("serialNumber", event.target.value)}
                  placeholder="Không bắt buộc"
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Múi giờ</span>
                <Input
                  value={form.timeZone}
                  onChange={(event) => setField("timeZone", event.target.value)}
                  placeholder={DEFAULT_TIME_ZONE}
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Địa chỉ</span>
                <Input
                  value={form.address}
                  onChange={(event) => setField("address", event.target.value)}
                  placeholder="Không bắt buộc"
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Vĩ độ</span>
                <Input
                  value={form.latitude}
                  onChange={(event) => setField("latitude", event.target.value)}
                  inputMode="decimal"
                  placeholder="Ví dụ: 10.7769"
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Kinh độ</span>
                <Input
                  value={form.longitude}
                  onChange={(event) => setField("longitude", event.target.value)}
                  inputMode="decimal"
                  placeholder="Ví dụ: 106.7009"
                  disabled={createKiosk.isSubmitting}
                  className="bg-card"
                />
              </label>
            </section>

            <label className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3">
              <input
                type="checkbox"
                checked={form.supportsOfflineMode}
                onChange={(event) =>
                  setField("supportsOfflineMode", event.target.checked)
                }
                disabled={createKiosk.isSubmitting}
                className="mt-1 size-4 rounded border-border accent-primary"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">
                  Hỗ trợ chế độ ngoại tuyến
                </span>
                <span className="block text-xs leading-5 text-muted-foreground">
                  Chỉ lưu cấu hình quản lý kiosk; không kích hoạt provisioning, IoT hoặc robot.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter className="mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => createKiosk.setOpen(false)}
              disabled={createKiosk.isSubmitting}
            >
              Hủy
            </Button>
            {createKiosk.errorMessage && !clientError ? (
              <Button
                type="button"
                variant="secondary"
                onClick={createKiosk.retryOptions}
                disabled={createKiosk.isLoadingOptions || createKiosk.isSubmitting}
              >
                <RefreshCw className="size-4" />
                Tải lại dữ liệu chọn
              </Button>
            ) : null}
            <Button type="submit" disabled={createKiosk.isSubmitting}>
              {createKiosk.isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Tạo kiosk
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
