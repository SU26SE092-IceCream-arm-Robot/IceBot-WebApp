export interface PaymentMethodResult {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface PaymentMethodStatusUpdateRequest {
  isActive: boolean;
}
