/**
 * Frontend provisional model — replace/map only after Backend API contract is finalized.
 */

export interface ServiceRegistrationDraft {
  // Contact Information
  fullName: string;
  email: string;
  phoneNumber: string;

  // Business Information
  businessName: string;
  city: string;
  website?: string;

  // Deployment Demand
  locationsCount: '1 địa điểm' | '2–5 địa điểm' | '6–10 địa điểm' | 'Trên 10 địa điểm' | 'Chưa xác định' | '';
  kiosksCount: '1' | '2–5' | '6–10' | 'Trên 10' | 'Chưa xác định' | '';
  timeline: 'Trong 1 tháng' | '1–3 tháng' | '3–6 tháng' | 'Trên 6 tháng' | 'Đang tìm hiểu' | '';

  // Additional Note
  additionalNote?: string;

  // Consent
  consent: boolean;
}
