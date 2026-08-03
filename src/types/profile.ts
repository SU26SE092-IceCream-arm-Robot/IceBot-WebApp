import type { CurrentAccountResult } from "@/types";

export interface UpdateCurrentAccountProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
}

export interface ChangeCurrentAccountPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type CurrentAccountProfile = CurrentAccountResult;

export interface CurrentAccountNotificationDevice {
  installationId: string;
  platform: string;
  deviceName?: string | null;
  appVersion?: string | null;
  lastSeenAt?: string | null;
  isActive: boolean;
}

export interface CurrentAccountSession {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RevokeCurrentAccountSessionsResult {
  revoked: number;
}
