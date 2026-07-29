import type {
  KioskConnectivityStatus,
  KioskLifecycleStatus,
  KioskOperationalState,
} from "@/types/kiosk-management";

const LIFECYCLE_LABELS: Record<KioskLifecycleStatus, string> = {
  Provisioning: "Đang cấu hình",
  Active: "Đã kích hoạt",
  Disabled: "Đã vô hiệu hóa",
  Retired: "Đã ngừng sử dụng",
};

const OPERATIONAL_LABELS: Record<KioskOperationalState, string> = {
  Operational: "Sẵn sàng nhận đơn",
  PausedByOperator: "Đã tạm dừng nhận đơn",
  Maintenance: "Tạm dừng để bảo trì",
  Cleaning: "Tạm dừng để vệ sinh",
  Restocking: "Tạm dừng để bổ sung hàng",
  EmergencyStopRequested: "Đang yêu cầu dừng khẩn cấp",
  OutOfService: "Ngừng phục vụ",
};

const CONNECTIVITY_LABELS: Record<KioskConnectivityStatus, string> = {
  Online: "Trực tuyến",
  Degraded: "Kết nối không ổn định",
  Unreachable: "Mất kết nối",
  Unknown: "Chưa xác định",
};

export function getKioskLifecycleLabel(status: string): string {
  return LIFECYCLE_LABELS[status as KioskLifecycleStatus] ?? status;
}

export function getKioskOperationalLabel(state: string): string {
  return OPERATIONAL_LABELS[state as KioskOperationalState] ?? state;
}

export function getKioskConnectivityLabel(status: string): string {
  return CONNECTIVITY_LABELS[status as KioskConnectivityStatus] ?? status;
}
