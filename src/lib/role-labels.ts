import type { BackendRoleCode } from "@/types";

const ROLE_LABELS: Record<BackendRoleCode, string> = {
  SystemAdmin: "Quản trị hệ thống",
  OrgAdmin: "Quản trị tổ chức",
  Manager: "Quản lý vận hành",
  Staff: "Nhân viên",
  Technician: "Kỹ thuật viên",
};

export function isBackendRoleCode(role: string): role is BackendRoleCode {
  return Object.hasOwn(ROLE_LABELS, role);
}

export function getRoleLabel(role: BackendRoleCode): string {
  return ROLE_LABELS[role];
}
