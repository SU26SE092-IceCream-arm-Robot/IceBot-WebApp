"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Building2, CheckCircle, Shield, User } from "lucide-react";

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
  ApproveServiceRegistrationRequest,
  ManagementServiceRegistrationDetail,
} from "@/types/service-registrations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ManagementServiceRegistrationDetail | null;
  loading: boolean;
  onApprove: (id: string, request: ApproveServiceRegistrationRequest) => Promise<void>;
}

function generateOrgCode(name?: string): string {
  if (!name) return "ORG";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .slice(0, 30) || "ORG";
}

function generateAdminUsername(email?: string, name?: string): string {
  if (email && email.includes("@")) {
    const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
    return `admin.${prefix}`.slice(0, 50);
  }
  if (name) {
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    return `owner.${slug}`.slice(0, 50);
  }
  return "org.admin";
}

export function ServiceRegistrationApproveDialog({
  open,
  onOpenChange,
  item,
  loading,
  onApprove,
}: Props) {
  const [organizationCode, setOrganizationCode] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [adminUserName, setAdminUserName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setOrganizationCode(generateOrgCode(item.businessName));
      setOrganizationName(item.businessName || "");
      setAdminUserName(generateAdminUsername(item.email, item.contactName));
      setAdminEmail(item.email || "");
      setGoogleLoginEnabled(true);
      setError(null);
    }
  }, [item]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!item) return;

    if (!organizationCode.trim()) {
      setError("Vui lòng nhập mã tổ chức (Organization Code).");
      return;
    }
    if (!organizationName.trim()) {
      setError("Vui lòng nhập tên tổ chức (Organization Name).");
      return;
    }
    if (!adminUserName.trim()) {
      setError("Vui lòng nhập tên đăng nhập quản trị viên (Admin Username).");
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      setError("Vui lòng nhập email hợp lệ cho quản trị viên.");
      return;
    }

    try {
      await onApprove(item.id, {
        organizationCode: organizationCode.trim(),
        organizationName: organizationName.trim(),
        adminUserName: adminUserName.trim(),
        adminEmail: adminEmail.trim(),
        // Temporary demo flow: Backend generates a password and emails credentials.
        localLoginEnabled: true,
        googleLoginEnabled,
        expectedRevision: item.revision,
      });
    } catch {
      // Error handled by parent toast, error remains visible
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <CheckCircle className="size-5 text-emerald-600" />
              Phê duyệt Đơn đăng ký & Cấp phát
            </DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tự động tạo Tổ chức mới (Organization), tài khoản OrgAdmin và gửi
              thông tin đăng nhập tới email đối tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Reference info */}
            <div className="rounded-lg border bg-muted/40 p-3 text-xs flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">Mã đơn: </span>
                <span className="font-mono font-bold text-foreground">{item.referenceCode}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Revision: </span>
                <span className="font-semibold text-primary">v{item.revision}</span>
              </div>
            </div>

            {/* Organization Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-1">
                <Building2 className="size-4 text-primary" />
                Thông tin Tổ chức (Organization)
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="orgCode" className="text-xs font-medium text-foreground">
                    Mã tổ chức <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="orgCode"
                    value={organizationCode}
                    maxLength={50}
                    onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
                    placeholder="VD: KEM-A"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="orgName" className="text-xs font-medium text-foreground">
                    Tên tổ chức <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="orgName"
                    value={organizationName}
                    maxLength={200}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="VD: Kem A"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Admin User Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-1">
                <User className="size-4 text-primary" />
                Tài khoản Quản trị viên (OrgAdmin)
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="adminUser" className="text-xs font-medium text-foreground">
                    Tên đăng nhập <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="adminUser"
                    value={adminUserName}
                    maxLength={100}
                    onChange={(e) => setAdminUserName(e.target.value)}
                    placeholder="VD: owner.kema"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="adminMail" className="text-xs font-medium text-foreground">
                    Email quản trị <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="adminMail"
                    type="email"
                    value={adminEmail}
                    maxLength={320}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="owner@example.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Login options */}
            <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Shield className="size-3.5 text-primary" />
                Phương thức đăng nhập cho phép
              </div>
              <div className="flex flex-wrap gap-5 text-sm">
                <span className="text-muted-foreground">Mật khẩu nội bộ luôn bật; mật khẩu tạm được gửi qua email.</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={googleLoginEnabled}
                    onChange={(e) => setGoogleLoginEnabled(e.target.checked)}
                    className="size-4 rounded border-gray-300 text-primary"
                  />
                  <span>Đăng nhập Google (SSO)</span>
                </label>
              </div>
            </div>

            {error ? (
              <p className="rounded border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" isLoading={loading} className="bg-emerald-600 hover:bg-emerald-700">
              Xác nhận Duyệt & Cấp phát
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
