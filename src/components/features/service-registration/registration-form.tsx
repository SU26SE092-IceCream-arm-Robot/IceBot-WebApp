'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { submitServiceRegistration } from '@/lib/service-registration/service-registration-service';
import { ServiceRegistrationDraft } from '@/types/service-registration';

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  businessName?: string;
  city?: string;
  consent?: string;
}

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState<ServiceRegistrationDraft>({
    fullName: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    city: '',
    website: '',
    locationsCount: '',
    kiosksCount: '',
    timeline: '',
    additionalNote: '',
    consent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (data: ServiceRegistrationDraft): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!data.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên.';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim() || !emailRegex.test(data.email.trim())) {
      newErrors.email = 'Vui lòng nhập email hợp lệ.';
      isValid = false;
    }

    // Basic Vietnamese phone validation (10 digits starting with 0)
    const phoneClean = data.phoneNumber.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 9 || phoneClean.length > 11 || !phoneClean.startsWith('0')) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại hợp lệ.';
      isValid = false;
    }

    if (!data.businessName.trim()) {
      newErrors.businessName = 'Vui lòng nhập tên doanh nghiệp / tổ chức.';
      isValid = false;
    }

    if (!data.city.trim()) {
      newErrors.city = 'Vui lòng nhập tỉnh / thành phố.';
      isValid = false;
    }

    if (!data.consent) {
      newErrors.consent = 'Bạn cần đồng ý để IceBot liên hệ.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: keyof ServiceRegistrationDraft, value: string | null) => {
    if (value !== null) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Sanitize and trim data
    const sanitizedData = {
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.replace(/\s+/g, ''),
      businessName: formData.businessName.trim(),
      city: formData.city.trim(),
      website: formData.website?.trim() || '',
      additionalNote: formData.additionalNote?.trim() || '',
    };
    
    setFormData(sanitizedData); // Update state with sanitized data before validation

    if (!validate(sanitizedData)) return;

    setIsSubmitting(true);
    
    try {
      const result = await submitServiceRegistration(sanitizedData);
      if (result.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Submission failed', error);
      // Fallback in case of mock failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      businessName: '',
      city: '',
      website: '',
      locationsCount: '',
      kiosksCount: '',
      timeline: '',
      additionalNote: '',
      consent: false,
    });
    setErrors({});
  };

  if (isSuccess) {
    return (
      <div className="bg-card border border-border shadow-sm rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Thông tin đăng ký đã sẵn sàng</h3>
        <p className="text-muted-foreground mb-8 text-lg">
          Kết nối tiếp nhận đăng ký sẽ được tích hợp sau khi Backend contract được hoàn thiện.
        </p>
        <Button size="lg" onClick={handleReset}>Quay lại trang</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8 max-w-3xl mx-auto">
      {/* Contact Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Thông tin liên hệ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên <span className="text-destructive">*</span></Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@company.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phoneNumber">Số điện thoại <span className="text-destructive">*</span></Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="09xx xxx xxx"
              className={errors.phoneNumber ? 'border-destructive' : ''}
            />
            {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Thông tin doanh nghiệp</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="businessName">Tên doanh nghiệp / tổ chức <span className="text-destructive">*</span></Label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Công ty Cổ phần..."
              className={errors.businessName ? 'border-destructive' : ''}
            />
            {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Tỉnh / Thành phố <span className="text-destructive">*</span></Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="VD: Hà Nội, TP.HCM"
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website (Không bắt buộc)</Label>
            <Input
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      {/* Deployment Demand */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Nhu cầu triển khai</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Số địa điểm dự kiến</Label>
            <Select 
              value={formData.locationsCount} 
              onValueChange={(val) => handleSelectChange('locationsCount', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn số lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1 địa điểm">1 địa điểm</SelectItem>
                <SelectItem value="2–5 địa điểm">2–5 địa điểm</SelectItem>
                <SelectItem value="6–10 địa điểm">6–10 địa điểm</SelectItem>
                <SelectItem value="Trên 10 địa điểm">Trên 10 địa điểm</SelectItem>
                <SelectItem value="Chưa xác định">Chưa xác định</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Số Kiosk dự kiến</Label>
            <Select 
              value={formData.kiosksCount} 
              onValueChange={(val) => handleSelectChange('kiosksCount', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn số lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2–5">2–5</SelectItem>
                <SelectItem value="6–10">6–10</SelectItem>
                <SelectItem value="Trên 10">Trên 10</SelectItem>
                <SelectItem value="Chưa xác định">Chưa xác định</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Thời gian dự kiến triển khai</Label>
            <Select 
              value={formData.timeline} 
              onValueChange={(val) => handleSelectChange('timeline', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Trong 1 tháng">Trong 1 tháng</SelectItem>
                <SelectItem value="1–3 tháng">1–3 tháng</SelectItem>
                <SelectItem value="3–6 tháng">3–6 tháng</SelectItem>
                <SelectItem value="Trên 6 tháng">Trên 6 tháng</SelectItem>
                <SelectItem value="Đang tìm hiểu">Đang tìm hiểu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2 mt-2">
            <Label htmlFor="additionalNote">Mô tả nhu cầu hoặc mô hình bạn muốn triển khai</Label>
            <textarea
              id="additionalNote"
              name="additionalNote"
              value={formData.additionalNote}
              onChange={handleChange}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Chia sẻ thêm về mục tiêu hoặc mô hình kinh doanh của bạn..."
            />
          </div>
        </div>
      </div>

      {/* Consent & Submit */}
      <div className="space-y-6">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="consent"
            name="consent"
            checked={formData.consent}
            onChange={handleChange}
            className="mt-1 h-4 w-4 shrink-0 rounded-sm border border-primary text-primary focus:ring-primary"
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="consent" className="font-normal text-muted-foreground cursor-pointer">
              Tôi đồng ý để IceBot liên hệ lại dựa trên thông tin đã cung cấp.
            </Label>
            {errors.consent && <p className="text-sm text-destructive">{errors.consent}</p>}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full font-semibold" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            'Gửi yêu cầu đăng ký'
          )}
        </Button>
      </div>
    </form>
  );
}
