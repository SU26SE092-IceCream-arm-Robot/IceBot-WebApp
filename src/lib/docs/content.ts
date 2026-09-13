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

export interface DocsSection {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  steps?: readonly DocsStep[];
  codeExample?: DocsCodeExample;
  callout?: DocsCallout;
}

export interface DocsPageDefinition {
  slug: string;
  group: "Bắt đầu" | "Nền tảng" | "Tích hợp";
  navigationLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  readingTime: string;
  sections: readonly DocsSection[];
}

export const DOCS_PAGES: readonly DocsPageDefinition[] = [
  {
    slug: "",
    group: "Bắt đầu",
    navigationLabel: "Tổng quan",
    eyebrow: "Tài liệu IceBot",
    title: "Xây dựng và vận hành hệ sinh thái IceBot",
    description:
      "Tài liệu dành cho đội triển khai, tích hợp và vận hành hệ thống điểm bán robot — từ mô hình nền tảng đến các luồng API và realtime.",
    readingTime: "5 phút đọc",
    sections: [
      {
        id: "icebot-la-gi",
        title: "IceBot là gì?",
        paragraphs: [
          "IceBot kết nối workflow robot, kiosk bán hàng và trung tâm vận hành trong một nền tảng thống nhất. Mỗi lớp có trách nhiệm rõ ràng để đội kỹ thuật có thể triển khai, quan sát và xử lý sự cố mà không làm thay đổi logic nghiệp vụ ở lớp khác.",
          "Khu tài liệu này tập trung vào các contract cần giữ ổn định khi tích hợp: phạm vi tổ chức và cửa hàng, vòng đời kiosk, hành vi API và sự kiện realtime.",
        ],
      },
      {
        id: "lo-trinh-doc",
        title: "Lộ trình đọc đề xuất",
        steps: [
          {
            title: "Khởi động với mô hình hệ thống",
            description:
              "Nắm các thành phần chính và ranh giới trách nhiệm trước khi cấu hình môi trường.",
          },
          {
            title: "Chọn luồng vận hành cần tích hợp",
            description:
              "Xác định actor, phạm vi dữ liệu và kết quả có thể quan sát của từng workflow.",
          },
          {
            title: "Kết nối API và realtime",
            description:
              "Dùng contract hiện hữu, xử lý lỗi có cấu trúc và chỉ subscribe các sự kiện đúng scope.",
          },
        ],
      },
      {
        id: "nguyen-tac-cot-loi",
        title: "Nguyên tắc cốt lõi",
        bullets: [
          "Không suy đoán quyền truy cập ở giao diện; luôn dựa trên permission và scope backend trả về.",
          "Giữ request, response và trạng thái vòng đời ổn định giữa WebApp, kiosk và dịch vụ nền.",
          "Mọi hành động quan trọng phải có kết quả thành công hoặc lỗi có thể quan sát được.",
          "Realtime dùng để vô hiệu hóa dữ liệu cũ; API vẫn là nguồn dữ liệu xác nhận cuối cùng.",
        ],
        callout: {
          title: "Tài liệu đang phát triển",
          content:
            "Các ví dụ hiện mô tả contract tích hợp ở mức khởi đầu. Hãy đối chiếu schema đang triển khai trước khi đưa một client mới vào production.",
        },
      },
    ],
  },
  {
    slug: "getting-started",
    group: "Bắt đầu",
    navigationLabel: "Bắt đầu nhanh",
    eyebrow: "Bắt đầu",
    title: "Bắt đầu nhanh",
    description:
      "Thiết lập client, xác định môi trường và thực hiện request đầu tiên theo đúng boundary của IceBot.",
    readingTime: "7 phút đọc",
    sections: [
      {
        id: "yeu-cau-truoc-khi-bat-dau",
        title: "Yêu cầu trước khi bắt đầu",
        bullets: [
          "Một tài khoản được cấp role và scope phù hợp với môi trường tích hợp.",
          "Base URL của API theo từng môi trường; không hard-code URL production trong mã nguồn.",
          "Cơ chế lưu phiên an toàn và khả năng xoay access token bằng refresh token.",
        ],
      },
      {
        id: "cau-hinh-client",
        title: "Cấu hình client",
        paragraphs: [
          "Tách base URL khỏi transport để có thể đổi môi trường mà không sửa các service nghiệp vụ. Access token chỉ được gắn ở lớp client dùng chung.",
        ],
        codeExample: {
          label: "lib/api-client.ts",
          language: "TypeScript",
          code: `const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(\`${"${API_BASE_URL}"}\${path}\`, init);

  if (!response.ok) {
    throw new Error(\`IceBot API returned \${response.status}\`);
  }

  return response.json() as Promise<T>;
}`,
        },
      },
      {
        id: "request-dau-tien",
        title: "Request đầu tiên",
        paragraphs: [
          "Bắt đầu bằng một endpoint đọc trong đúng scope được cấp. Giữ AbortSignal xuyên suốt để request có thể dừng khi người dùng rời trang.",
        ],
        codeExample: {
          label: "Ví dụ tải danh sách kiosk",
          language: "TypeScript",
          code: `const result = await apiRequest<KioskPage>(
  "/api/v1/management/kiosks?page=1&pageSize=20",
  {
    headers: { Authorization: \`Bearer \${accessToken}\` },
    signal,
  },
);`,
        },
        callout: {
          title: "Không đưa secret vào trình duyệt",
          content:
            "Biến NEXT_PUBLIC_* được đóng gói vào client. Chỉ đặt base URL và cấu hình công khai trong nhóm biến này.",
          tone: "warning",
        },
      },
    ],
  },
  {
    slug: "architecture",
    group: "Nền tảng",
    navigationLabel: "Kiến trúc hệ thống",
    eyebrow: "Nền tảng",
    title: "Kiến trúc hệ thống",
    description:
      "Hiểu các lớp của IceBot và cách dữ liệu đi từ thao tác vận hành tới kiosk tại điểm bán.",
    readingTime: "8 phút đọc",
    sections: [
      {
        id: "cac-lop-he-thong",
        title: "Các lớp hệ thống",
        steps: [
          {
            title: "Trung tâm vận hành",
            description:
              "Quản trị tổ chức, cửa hàng, kiosk, catalog và các quyết định vận hành có phân quyền.",
          },
          {
            title: "Dịch vụ nền tảng",
            description:
              "Thực thi contract API, lifecycle, audit, đồng bộ cấu hình và phân phối sự kiện.",
          },
          {
            title: "Kiosk và robot runtime",
            description:
              "Nhận cấu hình đã phát hành, thực thi workflow bán hàng và báo cáo trạng thái thực tế.",
          },
        ],
      },
      {
        id: "bien-gioi-contract",
        title: "Biên giới contract",
        paragraphs: [
          "Frontend không tự tạo trạng thái nghiệp vụ mới. Một trạng thái chỉ có ý nghĩa khi được backend công bố và có transition hợp lệ.",
          "Các adapter phía client có thể chuẩn hóa dữ liệu thiếu thành null hoặc giá trị trình bày, nhưng không được thay đổi ý nghĩa của payload gốc.",
        ],
      },
      {
        id: "dong-du-lieu",
        title: "Dòng dữ liệu chuẩn",
        codeExample: {
          label: "Luồng đọc và cập nhật dữ liệu",
          language: "text",
          code: `User intent
  -> Route and permission guard
  -> Feature hook
  -> Typed service
  -> IceBot API
  -> Observable result or structured error
  -> Realtime invalidation
  -> Fresh API read`,
        },
      },
    ],
  },
  {
    slug: "operations",
    group: "Nền tảng",
    navigationLabel: "Luồng vận hành",
    eyebrow: "Nền tảng",
    title: "Luồng vận hành",
    description:
      "Thiết kế tích hợp theo công việc thực tế: tín hiệu, bằng chứng, quyết định, hành động và xác nhận.",
    readingTime: "6 phút đọc",
    sections: [
      {
        id: "chuoi-quyet-dinh",
        title: "Chuỗi quyết định",
        bullets: [
          "Health: hệ thống hiện có vận hành bình thường không?",
          "Exception: điều gì cần con người can thiệp?",
          "Evidence: dữ liệu nào chứng minh tình trạng đó?",
          "Action: thao tác nào được phép trong trạng thái hiện tại?",
          "Confirmation: kết quả nào xác nhận thao tác đã hoàn tất?",
          "Follow-up: dữ liệu hoặc công việc nào cần theo dõi tiếp?",
        ],
      },
      {
        id: "pham-vi-va-quyen",
        title: "Phạm vi và quyền",
        paragraphs: [
          "Role trả lời người dùng có thể làm gì; scope trả lời họ được làm điều đó trên tổ chức, cửa hàng hoặc kiosk nào. Luôn kiểm tra cả hai trước khi hiển thị hành động.",
        ],
        callout: {
          title: "Không dùng việc ẩn nút làm lớp bảo mật",
          content:
            "UI giúp tránh thao tác sai, nhưng backend vẫn phải kiểm tra permission, scope và optimistic revision cho mọi mutation.",
          tone: "warning",
        },
      },
      {
        id: "xu-ly-loi",
        title: "Xử lý lỗi có thể hành động",
        paragraphs: [
          "Thông báo lỗi nên cho biết việc gì chưa hoàn tất, dữ liệu người dùng có được giữ hay không và hành động tiếp theo là thử lại, sửa dữ liệu hay liên hệ người có quyền.",
        ],
      },
    ],
  },
  {
    slug: "api-integration",
    group: "Tích hợp",
    navigationLabel: "API và xác thực",
    eyebrow: "Tích hợp",
    title: "API và xác thực",
    description:
      "Tổ chức lớp transport, phiên đăng nhập và xử lý lỗi để giữ contract ổn định khi ứng dụng mở rộng.",
    readingTime: "9 phút đọc",
    sections: [
      {
        id: "vong-doi-phien",
        title: "Vòng đời phiên đăng nhập",
        steps: [
          {
            title: "Đăng nhập",
            description:
              "Nhận access token, refresh token và account scope từ authentication service.",
          },
          {
            title: "Gắn token",
            description:
              "Transport dùng chung thêm Bearer token cho các request được bảo vệ.",
          },
          {
            title: "Xoay phiên",
            description:
              "Khi access token hết hạn, chỉ cho phép một refresh request chạy và phát lại các request đang chờ.",
          },
          {
            title: "Kết thúc phiên",
            description:
              "Xóa thông tin phiên khi refresh không còn hợp lệ và đưa người dùng về màn hình đăng nhập.",
          },
        ],
      },
      {
        id: "response-co-cau-truc",
        title: "Response có cấu trúc",
        codeExample: {
          label: "Kiểu kết quả dùng chung",
          language: "TypeScript",
          code: `interface ApiResult<T> {
  data: T;
  message?: string;
  errors?: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
}`,
        },
      },
      {
        id: "quy-tac-tich-hop",
        title: "Quy tắc tích hợp",
        bullets: [
          "Không gọi API trực tiếp từ component trình bày; đặt request trong typed service.",
          "Feature hook sở hữu loading, retry, cancellation và cache invalidation.",
          "Mutation phải hiển thị kết quả và cập nhật lại nguồn dữ liệu liên quan.",
          "Không retry tự động các thao tác có thể tạo hiệu ứng lặp nếu chưa có idempotency contract.",
        ],
      },
    ],
  },
  {
    slug: "realtime",
    group: "Tích hợp",
    navigationLabel: "Realtime",
    eyebrow: "Tích hợp",
    title: "Realtime và đồng bộ trạng thái",
    description:
      "Nhận tín hiệu thay đổi theo scope mà vẫn giữ API làm nguồn dữ liệu xác nhận.",
    readingTime: "7 phút đọc",
    sections: [
      {
        id: "mo-hinh-invalidation",
        title: "Mô hình invalidation",
        paragraphs: [
          "Sự kiện realtime không cần mang toàn bộ view model. Client nhận tín hiệu, xác định vùng dữ liệu bị cũ và tải lại bằng API có phân quyền.",
        ],
        codeExample: {
          label: "Luồng cập nhật",
          language: "TypeScript",
          code: `connection.on("DashboardInvalidated", (event) => {
  if (event.organizationId !== activeOrganizationId) return;
  void refreshDashboard();
});`,
        },
      },
      {
        id: "vong-doi-ket-noi",
        title: "Vòng đời kết nối",
        bullets: [
          "Join đúng organization hoặc store group sau khi kết nối thành công.",
          "Hủy retry và không join group mới sau khi component đã dispose.",
          "Nếu unmount trong lúc start, chờ start settle rồi stop theo best effort.",
          "Lỗi realtime không được khóa các thao tác API cốt lõi.",
        ],
      },
      {
        id: "khi-nao-can-refetch",
        title: "Khi nào cần refetch",
        paragraphs: [
          "Refetch khi sự kiện có thể làm thay đổi quyết định đang hiển thị. Với các stream tần suất cao, gom invalidation trong một cửa sổ ngắn để tránh tạo request storm.",
        ],
      },
    ],
  },
];

export const DOCS_GROUPS = ["Bắt đầu", "Nền tảng", "Tích hợp"] as const;

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
