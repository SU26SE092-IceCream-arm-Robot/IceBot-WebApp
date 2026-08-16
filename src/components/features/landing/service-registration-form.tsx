"use client";

import { useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getServiceRegistrationErrorMessage,
  submitServiceRegistration,
} from "@/lib/services/service-registrations";
import type {
  CreateServiceRegistrationRequest,
  ServiceRegistrationResult,
} from "@/types/service-registrations";

// Default published revision GUID (can be overridden by NEXT_PUBLIC_PRIVACY_POLICY_REVISION_ID)
const DEFAULT_PRIVACY_POLICY_REVISION_ID =
  process.env.NEXT_PUBLIC_PRIVACY_POLICY_REVISION_ID?.trim() ||
  "b8387063-e4d0-4d51-aefc-f1797cfae4f2";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

interface FormState {
  contactName: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  legalName: string;
  taxCode: string;
  address: string;
  expectedLocationCount: string;
  message: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyRevisionId: string;
}

const initialFormState: FormState = {
  contactName: "",
  email: "",
  phoneNumber: "",
  businessName: "",
  legalName: "",
  taxCode: "",
  address: "",
  expectedLocationCount: "1",
  message: "",
  privacyPolicyAccepted: false,
  privacyPolicyRevisionId: DEFAULT_PRIVACY_POLICY_REVISION_ID,
};

export function ServiceRegistrationForm() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<ServiceRegistrationResult | null>(null);

  function validate(data: FormState): string | null {
    // 1. contactName: required, max 200 chars
    const trimmedContactName = data.contactName.trim();
    if (!trimmedContactName) {
      return "Vui lòng nhập họ và tên người liên hệ.";
    }
    if (trimmedContactName.length > 200) {
      return "Họ và tên người liên hệ không được vượt quá 200 ký tự.";
    }

    // 2. email: required, max 320 chars, must include '@'
    const trimmedEmail = data.email.trim();
    if (!trimmedEmail) {
      return "Vui lòng nhập địa chỉ email.";
    }
    if (trimmedEmail.length > 320) {
      return "Email không được vượt quá 320 ký tự.";
    }
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return "Địa chỉ email không hợp lệ (cần chứa ký tự @ và tên miền).";
    }

    // 3. businessName: required, max 200 chars
    const trimmedBusinessName = data.businessName.trim();
    if (!trimmedBusinessName) {
      return "Vui lòng nhập tên cơ sở kinh doanh / thương hiệu.";
    }
    if (trimmedBusinessName.length > 200) {
      return "Tên cơ sở kinh doanh không được vượt quá 200 ký tự.";
    }

    // 4. privacyPolicyAccepted: required true
    if (!data.privacyPolicyAccepted) {
      return "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.";
    }

    // 5. privacyPolicyRevisionId: required, valid non-empty GUID
    const revisionId = data.privacyPolicyRevisionId.trim();
    if (!revisionId || revisionId === EMPTY_GUID || !GUID_REGEX.test(revisionId)) {
      return "Mã phiên bản chính sách bảo mật (privacyPolicyRevisionId) không hợp lệ.";
    }

    // 6. Optional: phoneNumber (max 50 chars)
    if (data.phoneNumber.trim().length > 50) {
      return "Số điện thoại không được vượt quá 50 ký tự.";
    }

    // 7. Optional: legalName (max 300 chars)
    if (data.legalName.trim().length > 300) {
      return "Tên pháp lý không được vượt quá 300 ký tự.";
    }

    // 8. Optional: taxCode (max 100 chars)
    if (data.taxCode.trim().length > 100) {
      return "Mã số thuế không được vượt quá 100 ký tự.";
    }

    // 9. Optional: address (max 500 chars)
    if (data.address.trim().length > 500) {
      return "Địa chỉ không được vượt quá 500 ký tự.";
    }

    // 10. Optional: expectedLocationCount (nullable, if present 1..10000)
    if (data.expectedLocationCount.trim()) {
      const count = Number(data.expectedLocationCount);
      if (!Number.isInteger(count) || count < 1 || count > 10000) {
        return "Số lượng điểm bán dự kiến phải là số nguyên từ 1 đến 10,000.";
      }
    }

    // 11. Optional: message (max 2000 chars)
    if (data.message.trim().length > 2000) {
      return "Nội dung lời nhắn không được vượt quá 2000 ký tự.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setApiError(null);

    const error = validate(formData);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSubmitting(true);

    const payload: CreateServiceRegistrationRequest = {
      contactName: formData.contactName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim() || null,
      businessName: formData.businessName.trim(),
      legalName: formData.legalName.trim() || null,
      taxCode: formData.taxCode.trim() || null,
      address: formData.address.trim() || null,
      expectedLocationCount: formData.expectedLocationCount.trim()
        ? Number(formData.expectedLocationCount)
        : null,
      message: formData.message.trim() || null,
      privacyPolicyAccepted: formData.privacyPolicyAccepted,
      privacyPolicyRevisionId: formData.privacyPolicyRevisionId.trim(),
    };

    try {
      const result = await submitServiceRegistration(payload);
      setSubmittedResult(result);
      toast.success("Gửi yêu cầu đăng ký dịch vụ thành công!");
    } catch (err) {
      const msg = getServiceRegistrationErrorMessage(err);
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setFormData(initialFormState);
    setValidationError(null);
    setApiError(null);
    setSubmittedResult(null);
  }

  if (submittedResult) {
    return (
      <Card className="w-full max-w-2xl border-emerald-200/60 bg-emerald-50/20 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Đăng ký dịch vụ thành công!
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Cảm ơn bạn đã quan tâm đến giải pháp robot bán kem tự động IceBot. Chúng tôi đã ghi nhận
            thông tin và sẽ liên hệ trong thời gian sớm nhất.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Mã tham chiếu (Reference Code):</span>
              <span className="font-mono text-base font-bold text-primary">
                {submittedResult.referenceCode || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-muted-foreground">Trạng thái:</span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                {submittedResult.status || "Submitted"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Thời gian ghi nhận:</span>
              <span className="text-sm font-medium text-foreground">
                {submittedResult.submittedAt
                  ? new Date(submittedResult.submittedAt).toLocaleString("vi-VN")
                  : new Date().toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 gap-2"
            >
              <RotateCcw className="size-4" />
              Gửi yêu cầu đăng ký khác
            </Button>
            <Link
              href="/login"
              className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Đi tới trang Đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-md border-border bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Store className="size-3.5" />
            Đăng ký hợp tác & Điểm bán
          </div>
          <Link
            href="/login"
            className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Đăng nhập quản trị
          </Link>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground pt-2">
          Đăng ký Dịch vụ IceBot
        </CardTitle>
        <CardDescription>
          Vui lòng điền thông tin để đăng ký triển khai mô hình kiosk kem robot tự động.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Section 1: Thông tin người liên hệ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-1">
              <User className="size-4 text-primary" />
              Thông tin người liên hệ
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="contactName" className="text-sm font-medium text-foreground">
                  Họ và tên <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    maxLength={200}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    maxLength={320}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phoneNumber" className="text-sm font-medium text-foreground">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  maxLength={50}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0901234567"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin doanh nghiệp */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-1">
              <Building2 className="size-4 text-primary" />
              Thông tin cơ sở & Doanh nghiệp
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="businessName" className="text-sm font-medium text-foreground">
                  Tên thương hiệu / Cơ sở <span className="text-destructive">*</span>
                </label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  maxLength={200}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="VD: Kem IceBot Center"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="legalName" className="text-sm font-medium text-foreground">
                  Tên pháp lý (Công ty)
                </label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  maxLength={300}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="Công ty TNHH ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="taxCode" className="text-sm font-medium text-foreground">
                  Mã số thuế
                </label>
                <Input
                  id="taxCode"
                  value={formData.taxCode}
                  maxLength={100}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  placeholder="0312345678"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="expectedLocationCount" className="text-sm font-medium text-foreground">
                  Số lượng điểm bán dự kiến (1 - 10,000)
                </label>
                <Input
                  id="expectedLocationCount"
                  type="number"
                  min={1}
                  max={10000}
                  value={formData.expectedLocationCount}
                  onChange={(e) => setFormData({ ...formData, expectedLocationCount: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-sm font-medium text-foreground">
                Địa chỉ hoạt động / Khu vực dự kiến
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.address}
                  maxLength={500}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ghi chú */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-1">
              <FileText className="size-4 text-primary" />
              Yêu cầu & Lời nhắn
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Lời nhắn chi tiết
              </label>
              <Textarea
                id="message"
                rows={3}
                maxLength={2000}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Mô tả kế hoạch triển khai, mặt bằng dự kiến hoặc câu hỏi của bạn..."
              />
            </div>
          </div>

          {/* Section 4: Chính sách bảo mật & Điều khoản */}
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <input
                id="privacyPolicyAccepted"
                type="checkbox"
                checked={formData.privacyPolicyAccepted}
                onChange={(e) =>
                  setFormData({ ...formData, privacyPolicyAccepted: e.target.checked })
                }
                className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                required
              />
              <label
                htmlFor="privacyPolicyAccepted"
                className="text-sm text-muted-foreground leading-snug cursor-pointer select-none"
              >
                Tôi đồng ý với{" "}
                <span className="font-semibold text-foreground">Điều khoản Dịch vụ</span> và{" "}
                <span className="font-semibold text-foreground">Chính sách Bảo mật</span> của IceBot.{" "}
                <span className="text-destructive">*</span>
              </label>
            </div>
          </div>

          {/* Error display */}
          {validationError || apiError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
              {validationError || apiError}
            </div>
          ) : null}

          {/* Submit button */}
          <Button
            type="submit"
            className="h-11 w-full text-base font-semibold"
            isLoading={isSubmitting}
          >
            <ShieldCheck className="mr-2 size-5" />
            Gửi Đăng ký Dịch vụ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
