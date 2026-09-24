import { USER_GUIDE_PAGES } from "@/lib/docs/user-guides";

export interface DocsCodeExample {
  label: string;
  language: string;
  code: string;
}

export interface DocsStep {
  title: string;
  description: string;
}

export interface DocsCallout {
  title: string;
  content: string;
  tone?: "info" | "warning";
}

export interface DocsFigure {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface DocsSection {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  steps?: readonly DocsStep[];
  codeExample?: DocsCodeExample;
  callout?: DocsCallout;
  figures?: readonly DocsFigure[];
}

export interface DocsPageDefinition {
  slug: string;
  group: "Bắt đầu" | "Hướng dẫn sử dụng" | "Vận hành";
  navigationLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  readingTime: string;
  audience?: readonly string[];
  sections: readonly DocsSection[];
}

const DOCS_OVERVIEW_PAGE: DocsPageDefinition = {
  slug: "",
  group: "Bắt đầu",
  navigationLabel: "Tổng quan",
  eyebrow: "Tài liệu IceBot",
  title: "Hướng dẫn sử dụng hệ sinh thái IceBot",
  description:
    "Tìm đúng hướng dẫn theo vai trò: vận hành Admin Web, sử dụng Kiosk, triển khai Full Edge hoặc tạo workflow trong FaiRobot Studio.",
  readingTime: "4 phút đọc",
  sections: [
    {
      id: "chon-huong-dan",
      title: "Chọn tài liệu theo công việc",
      steps: [
        {
          title: "Quản trị và vận hành",
          description:
            "Chọn Admin Web nếu bạn quản lý kiosk, menu, sản phẩm, giao dịch, tổ chức hoặc quyền truy cập.",
        },
        {
          title: "Sử dụng Kiosk",
          description:
            "Chọn Kiosk nếu bạn cần cài đặt ứng dụng hoặc hướng dẫn khách chọn món, thanh toán và theo dõi đơn.",
        },
        {
          title: "Triển khai thiết bị",
          description:
            "Chọn Full Edge nếu bạn là kỹ thuật viên cài đặt máy biên và kiểm tra kết nối với Backend, kiosk và robot.",
        },
        {
          title: "Tạo workflow robot",
          description:
            "Chọn FaiRobot Studio nếu bạn tạo scene, mô phỏng workflow và xuất bundle để bàn giao lên Admin Web.",
        },
      ],
    },
    {
      id: "nguyen-tac-an-toan",
      title: "Nguyên tắc chung",
      bullets: [
        "Chỉ thao tác trong phạm vi tổ chức, cửa hàng, kiosk và quyền được cấp.",
        "Không ghi hoặc chia sẻ mật khẩu, token, certificate, key, connection string hay thông tin kết nối nội bộ.",
        "Sau mỗi thao tác quan trọng, kiểm tra trạng thái xác nhận trên màn hình trước khi chuyển sang bước tiếp theo.",
        "Khi hướng dẫn trong Report 6 khác với giao diện hiện tại, ưu tiên tên nút và trạng thái đang hiển thị trên hệ thống.",
      ],
      callout: {
        title: "Tài liệu theo vai trò",
        content:
          "Bạn có thể xem các trang hướng dẫn khác nhau tùy quyền và công việc. Việc một nút không xuất hiện thường có nghĩa tài khoản chưa được cấp quyền tương ứng.",
      },
    },
  ],
};

export const DOCS_PAGES: readonly DocsPageDefinition[] = [DOCS_OVERVIEW_PAGE, ...USER_GUIDE_PAGES];

export const DOCS_GROUPS = ["Bắt đầu", "Hướng dẫn sử dụng", "Vận hành"] as const;

export function getDocsHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function getDocsPage(slug: string): DocsPageDefinition | undefined {
  return DOCS_PAGES.find((page) => page.slug === slug);
}

export function getAdjacentDocsPages(slug: string): {
  previous?: DocsPageDefinition;
  next?: DocsPageDefinition;
} {
  const currentIndex = DOCS_PAGES.findIndex((page) => page.slug === slug);

  if (currentIndex < 0) return {};

  return {
    previous: DOCS_PAGES[currentIndex - 1],
    next: DOCS_PAGES[currentIndex + 1],
  };
}
