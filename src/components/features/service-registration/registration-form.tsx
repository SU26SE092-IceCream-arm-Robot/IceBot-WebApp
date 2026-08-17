"use client";

import React, { useState, type FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  "01a00de2-0a3b-7d80-93aa-2d1828e193df";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

export function RegistrationForm() {
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
      <div className="bg-card border border-border shadow-lg rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="size-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-10" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
          Đăng ký dịch vụ thành công!
        </h3>
        <p className="text-muted-foreground mb-8 text-base md:text-lg leading-relaxed">
          Cảm ơn bạn đã quan tâm đến giải pháp robot bán kem tự động IceBot. Chúng tôi đã tiếp nhận
          thông tin đăng ký của bạn.
        </p>

        <div className="rounded-xl border bg-muted/40 p-5 space-y-3 mb-8 text-left">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground">Mã tham chiếu (Reference Code):</span>
            <span className="font-mono text-base font-bold text-primary">
              {submittedResult.referenceCode || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-muted-foreground">Trạng thái tiếp nhận:</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
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

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button type="button" variant="outline" size="lg" onClick={handleReset} className="gap-2">
            <RotateCcw className="size-4" />
            Gửi yêu cầu đăng ký khác
          </Button>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Đi tới trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-card border border-border shadow-lg rounded-2xl p-6 md:p-10 max-w-3xl mx-auto space-y-8"
    >
      {/* Contact Information */}
      <div>
        <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-4 pb-2 border-b">
          <User className="size-5 text-primary" />
          Thông tin người liên hệ
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                maxLength={200}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Nhập họ và tên"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
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

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                maxLength={50}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="09xx xxx xxx"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div>
        <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-4 pb-2 border-b">
          <Building2 className="size-5 text-primary" />
          Thông tin doanh nghiệp & Cơ sở
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="businessName">
              Tên thương hiệu / Cơ sở <span className="text-destructive">*</span>
            </Label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              maxLength={200}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="VD: Kem Tự Động IceBot Center"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalName">Tên pháp lý (Công ty)</Label>
            <Input
              id="legalName"
              name="legalName"
              value={formData.legalName}
              maxLength={300}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              placeholder="Công ty TNHH..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxCode">Mã số thuế</Label>
            <Input
              id="taxCode"
              name="taxCode"
              value={formData.taxCode}
              maxLength={100}
              onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
              placeholder="0312345678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedLocationCount">Số lượng điểm bán dự kiến (1 - 10,000)</Label>
            <Input
              id="expectedLocationCount"
              name="expectedLocationCount"
              type="number"
              min={1}
              max={10000}
              value={formData.expectedLocationCount}
              onChange={(e) =>
                setFormData({ ...formData, expectedLocationCount: e.target.value })
              }
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ hoạt động / Khu vực dự kiến</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="address"
                name="address"
                value={formData.address}
                maxLength={500}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="VD: Quận 1, TP. Hồ Chí Minh"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Requirements / Message */}
      <div>
        <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-4 pb-2 border-b">
          <FileText className="size-5 text-primary" />
          Yêu cầu & Lời nhắn
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mô tả nhu cầu hoặc mô hình bạn muốn triển khai</Label>
          <Textarea
            id="message"
            name="message"
            rows={3}
            maxLength={2000}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Chia sẻ thêm về mục tiêu, mặt bằng dự kiến hoặc mô hình kinh doanh của bạn..."
          />
        </div>
      </div>

      {/* Consent & Policies */}
      <div className="space-y-4 rounded-xl border bg-muted/30 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="privacyPolicyAccepted"
            name="privacyPolicyAccepted"
            checked={formData.privacyPolicyAccepted}
            onChange={(e) =>
              setFormData({ ...formData, privacyPolicyAccepted: e.target.checked })
            }
            className="mt-1 size-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            required
          />
          <div className="space-y-1 leading-snug">
            <Label
              htmlFor="privacyPolicyAccepted"
              className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
            >
              Tôi đồng ý với <span className="font-semibold text-foreground">Điều khoản Dịch vụ</span>{" "}
              và <span className="font-semibold text-foreground">Chính sách Bảo mật</span> của IceBot.{" "}
              <span className="text-destructive">*</span>
            </Label>
          </div>
        </div>
      </div>

      {/* Error Message Display */}
      {validationError || apiError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
          {validationError || apiError}
        </div>
      ) : null}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full text-base font-semibold h-12 gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Đang xử lý đăng ký...
          </>
        ) : (
          <>
            <ShieldCheck className="size-5" />
            Gửi yêu cầu đăng ký
          </>
        )}
      </Button>
    </form>
  );
}
