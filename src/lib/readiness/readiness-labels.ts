import type {
  ReadinessAction,
  ReadinessCheckGroup,
  ReadinessCheckId,
  ReadinessOverallStatus,
  ReadinessStatus,
} from "@/types/setup-readiness";

export const READINESS_GROUP_LABELS: Record<ReadinessCheckGroup, string> = {
  scope: "Phạm vi tổ chức",
  kiosk: "Kiosk",
  catalog: "Sản phẩm và thực đơn",
  payment: "Thanh toán",
};

export const READINESS_STATUS_LABELS: Record<ReadinessStatus, string> = {
  complete: "Hoàn tất",
  warning: "Cần hoàn thiện",
  missing: "Còn thiếu",
  unknown: "Không thể kiểm tra",
};

export const READINESS_OVERALL_LABELS: Record<ReadinessOverallStatus, string> = {
  complete: "Đã hoàn tất thiết lập cơ bản",
  needs_attention: "Cần hoàn thiện",
  missing_configuration: "Chưa hoàn tất thiết lập",
  unknown: "Không thể xác định",
};

export const READINESS_CHECK_DEFINITIONS: Record<
  ReadinessCheckId,
  {
    group: ReadinessCheckGroup;
    title: string;
    description: string;
    isCritical: boolean;
    action: ReadinessAction;
  }
> = {
  ORG_ACTIVE: {
    group: "scope",
    title: "Tổ chức đang hoạt động",
    description: "Tổ chức phải đang hoạt động.",
    isCritical: true,
    action: { label: "Mở tổ chức", href: "/organizations" },
  },
  STORE_ACTIVE: {
    group: "scope",
    title: "Cửa hàng đang hoạt động",
    description: "Cửa hàng phải thuộc tổ chức đã chọn và đang hoạt động.",
    isCritical: true,
    action: { label: "Mở cửa hàng", href: "/organizations" },
  },
  KIOSK_EXISTS: {
    group: "kiosk",
    title: "Có ít nhất một kiosk",
    description: "Cửa hàng cần có kiosk được khai báo trong Admin Web.",
    isCritical: true,
    action: { label: "Quản lý kiosk", href: "/kiosks" },
  },
  PRODUCT_EXISTS: {
    group: "catalog",
    title: "Có sản phẩm",
    description: "Cửa hàng cần có ít nhất một sản phẩm liên quan.",
    isCritical: true,
    action: { label: "Mở thực đơn", href: "/menu" },
  },
  VARIANT_EXISTS: {
    group: "catalog",
    title: "Có phiên bản sản phẩm",
    description: "Sản phẩm cần có ít nhất một phiên bản để đưa vào thực đơn.",
    isCritical: true,
    action: { label: "Mở sản phẩm", href: "/menu" },
  },
  MENU_EXISTS: {
    group: "catalog",
    title: "Có thực đơn",
    description: "Cửa hàng cần có ít nhất một thực đơn.",
    isCritical: true,
    action: { label: "Mở thực đơn", href: "/menu" },
  },
  MENU_ITEM_EXISTS: {
    group: "catalog",
    title: "Có món trong thực đơn",
    description: "Thực đơn cần có ít nhất một món đang hiển thị.",
    isCritical: true,
    action: { label: "Mở món trong thực đơn", href: "/menu" },
  },
  PAYMENT_ACTIVE: {
    group: "payment",
    title: "Có phương thức thanh toán hoạt động",
    description: "Hệ thống cần ít nhất một phương thức thanh toán đang bật.",
    isCritical: true,
    action: { label: "Cấu hình thanh toán", href: "/settings/payment-methods" },
  },
};

export function getReadinessUnknownDetail(statusCode?: number) {
  if (statusCode === 403) {
    return "Không đủ quyền kiểm tra nguồn dữ liệu này.";
  }
  if (statusCode === 404) {
    return "Không tìm thấy dữ liệu cần kiểm tra.";
  }
  if (statusCode && statusCode >= 500) {
    return "Không thể kiểm tra nguồn dữ liệu này.";
  }
  return "Nguồn dữ liệu này chưa thể kiểm tra.";
}
