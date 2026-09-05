export interface PermissionPresentation {
  group: string;
  label: string;
  description: string;
}

const PERMISSIONS: Record<string, PermissionPresentation> = {
  "dashboard.view": entry(
    "Tổng quan & báo cáo",
    "Xem tổng quan vận hành",
    "Theo dõi các chỉ số, trạng thái và điểm cần can thiệp trên Dashboard.",
  ),
  "reports.view": entry(
    "Tổng quan & báo cáo",
    "Xem báo cáo vận hành",
    "Xem doanh thu, trạng thái đơn hàng và các tín hiệu vận hành tổng hợp.",
  ),
  "platform.organization-sales.view": entry(
    "Tổng quan & báo cáo",
    "Xem doanh thu toàn nền tảng",
    "So sánh doanh thu giữa các tổ chức trên phạm vi nền tảng.",
  ),

  "organizations.view": entry(
    "Tổ chức & cửa hàng",
    "Xem tổ chức",
    "Xem danh sách và thông tin chi tiết tổ chức.",
  ),
  "organizations.manage": entry(
    "Tổ chức & cửa hàng",
    "Quản lý tổ chức",
    "Tạo và thực hiện các thao tác quản trị tổ chức.",
  ),
  "organizations.update": entry(
    "Tổ chức & cửa hàng",
    "Cập nhật tổ chức",
    "Chỉnh sửa thông tin và trạng thái của tổ chức.",
  ),
  "stores.view": entry(
    "Tổ chức & cửa hàng",
    "Xem cửa hàng",
    "Xem danh sách và hồ sơ cửa hàng.",
  ),
  "stores.manage": entry(
    "Tổ chức & cửa hàng",
    "Quản lý cửa hàng",
    "Tạo và thực hiện các thao tác quản trị cửa hàng.",
  ),
  "stores.update": entry(
    "Tổ chức & cửa hàng",
    "Cập nhật cửa hàng",
    "Chỉnh sửa thông tin và trạng thái cửa hàng.",
  ),
  "tenant-tree.view": entry(
    "Tổ chức & cửa hàng",
    "Xem cây phạm vi",
    "Xem cấu trúc tổ chức, cửa hàng và kiosk được phân công.",
  ),

  "kiosks.view": entry(
    "Kiosk & thiết bị",
    "Xem kiosk",
    "Xem đội máy và hồ sơ vận hành của từng kiosk.",
  ),
  "kiosks.manage": entry(
    "Kiosk & thiết bị",
    "Quản lý kiosk",
    "Tạo kiosk và thay đổi trạng thái vận hành của máy.",
  ),
  "kiosks.update": entry(
    "Kiosk & thiết bị",
    "Cập nhật kiosk",
    "Chỉnh sửa thông tin cấu hình quản lý của kiosk.",
  ),
  "devices.view": entry(
    "Kiosk & thiết bị",
    "Xem thiết bị",
    "Xem thiết bị, cảm biến và điểm thực thi gắn với kiosk.",
  ),
  "devices.manage": entry(
    "Kiosk & thiết bị",
    "Quản lý thiết bị",
    "Thêm, cập nhật và ngừng sử dụng thiết bị tại kiosk.",
  ),
  "device-catalog.read": entry(
    "Kiosk & thiết bị",
    "Xem danh mục thiết bị",
    "Tra cứu các loại thiết bị có thể cấu hình cho kiosk.",
  ),
  "device-catalog.manage": entry(
    "Kiosk & thiết bị",
    "Quản lý danh mục thiết bị",
    "Tạo và cập nhật loại thiết bị dùng trong hệ thống.",
  ),

  "inventory.view": entry(
    "Tồn kho & danh mục",
    "Xem tồn kho",
    "Theo dõi lượng nguyên liệu và lịch sử biến động tại kiosk.",
  ),
  "inventory.manage": entry(
    "Tồn kho & danh mục",
    "Điều chỉnh tồn kho",
    "Ghi nhận nạp thêm hoặc điều chỉnh lượng nguyên liệu ước tính.",
  ),
  "inventory.configure": entry(
    "Tồn kho & danh mục",
    "Cấu hình khay nguyên liệu",
    "Tạo, liên kết và thay đổi cấu hình bộ phân phối nguyên liệu.",
  ),
  "ingredients.read": entry(
    "Tồn kho & danh mục",
    "Xem danh mục nguyên liệu",
    "Tra cứu nguyên liệu dùng trong sản phẩm và tồn kho.",
  ),
  "ingredients.manage": entry(
    "Tồn kho & danh mục",
    "Quản lý nguyên liệu",
    "Tạo và cập nhật nguyên liệu trong danh mục.",
  ),
  "products.manage": entry(
    "Tồn kho & danh mục",
    "Quản lý sản phẩm",
    "Tạo, cập nhật và cấu hình sản phẩm bán hàng.",
  ),
  "product-categories.manage": entry(
    "Tồn kho & danh mục",
    "Quản lý nhóm sản phẩm",
    "Tổ chức sản phẩm theo các nhóm hiển thị và vận hành.",
  ),
  "product-templates.manage": entry(
    "Tồn kho & danh mục",
    "Quản lý mẫu sản phẩm",
    "Tạo và cập nhật mẫu dùng khi cấu hình sản phẩm.",
  ),
  "menus.manage": entry(
    "Tồn kho & danh mục",
    "Quản lý thực đơn",
    "Tạo thực đơn và sắp xếp các món được bán.",
  ),
  "menu-items.availability.manage": entry(
    "Tồn kho & danh mục",
    "Điều chỉnh trạng thái bán món",
    "Bật hoặc tạm ngừng bán món theo phạm vi kiosk.",
  ),

  "orders.view": entry(
    "Đơn hàng & thanh toán",
    "Xem đơn hàng",
    "Theo dõi đơn hàng, tiến trình thực hiện và giao dịch liên quan.",
  ),
  "orders.manage": entry(
    "Đơn hàng & thanh toán",
    "Xử lý đơn hàng",
    "Thực hiện các thao tác quản lý trên đơn hàng.",
  ),
  "payments.manage": entry(
    "Đơn hàng & thanh toán",
    "Xử lý thanh toán",
    "Kiểm tra và can thiệp các giao dịch thanh toán.",
  ),
  "refunds.manage": entry(
    "Đơn hàng & thanh toán",
    "Xử lý hoàn tiền",
    "Tạo, phê duyệt hoặc theo dõi yêu cầu hoàn tiền.",
  ),
  "payment-methods.manage": entry(
    "Đơn hàng & thanh toán",
    "Quản lý phương thức thanh toán",
    "Bật, tắt và cấu hình phương thức thanh toán của hệ thống.",
  ),

  "accounts.read": entry(
    "Tài khoản & nhân sự",
    "Xem tài khoản",
    "Xem danh sách, hồ sơ và vai trò của tài khoản.",
  ),
  "accounts.manage": entry(
    "Tài khoản & nhân sự",
    "Quản lý tài khoản",
    "Mời tài khoản, cấp vai trò, đặt lại mật khẩu hoặc vô hiệu hóa.",
  ),
  "workforce.staff.read": entry(
    "Tài khoản & nhân sự",
    "Xem nhân sự",
    "Xem danh sách nhân viên trong phạm vi được phân công.",
  ),
  "workforce.staff.manage": entry(
    "Tài khoản & nhân sự",
    "Quản lý nhân sự",
    "Tạo và cập nhật hồ sơ nhân viên vận hành.",
  ),
  "permission-matrix.view": entry(
    "Tài khoản & nhân sự",
    "Xem ma trận quyền",
    "Tra cứu quyền nào được cấp cho từng role hệ thống.",
  ),

  "maintenance.view": entry(
    "Bảo trì & cảnh báo",
    "Xem yêu cầu bảo trì",
    "Theo dõi yêu cầu bảo trì và tiến độ xử lý.",
  ),
  "maintenance.create": entry(
    "Bảo trì & cảnh báo",
    "Tạo yêu cầu bảo trì",
    "Ghi nhận sự cố cần đội kỹ thuật xử lý.",
  ),
  "maintenance.manage": entry(
    "Bảo trì & cảnh báo",
    "Điều phối bảo trì",
    "Phân công, cập nhật và hoàn tất yêu cầu bảo trì.",
  ),
  "alerts.view": entry(
    "Bảo trì & cảnh báo",
    "Xem cảnh báo",
    "Xem các cảnh báo phát sinh từ hệ thống và thiết bị.",
  ),
  "alerts.manage": entry(
    "Bảo trì & cảnh báo",
    "Xử lý cảnh báo",
    "Tiếp nhận, ghi chú và đánh dấu cảnh báo đã xử lý.",
  ),

  "artifact.read": entry(
    "Sản xuất & triển khai",
    "Xem tài nguyên robot",
    "Tra cứu các tài nguyên robot trong phạm vi tổ chức.",
  ),
  "artifact.upload": entry(
    "Sản xuất & triển khai",
    "Tải lên tài nguyên robot",
    "Nhập bundle chương trình và tài nguyên robot để kiểm tra.",
  ),
  "program.read": entry(
    "Sản xuất & triển khai",
    "Xem chương trình robot",
    "Xem chương trình robot, gói sản xuất và liên kết cấu hình.",
  ),
  "program.manage": entry(
    "Sản xuất & triển khai",
    "Quản lý chương trình robot",
    "Tạo, sắp xếp và phát hành tài nguyên chương trình robot.",
  ),
  "release.read": entry(
    "Sản xuất & triển khai",
    "Xem bản phát hành",
    "Xem các phiên bản cấu hình sản xuất.",
  ),
  "release.publish": entry(
    "Sản xuất & triển khai",
    "Phát hành cấu hình",
    "Tạo, chỉnh sửa và khóa bản phát hành cấu hình.",
  ),
  "release.deploy": entry(
    "Sản xuất & triển khai",
    "Triển khai cấu hình",
    "Đưa bản phát hành cấu hình tới kiosk đã chọn.",
  ),
  "release.rollback": entry(
    "Sản xuất & triển khai",
    "Hoàn tác triển khai",
    "Khôi phục kiosk về bản cấu hình trước đó.",
  ),
  "deployment.read": entry(
    "Sản xuất & triển khai",
    "Xem lịch sử triển khai",
    "Theo dõi trạng thái và bằng chứng của các lượt triển khai.",
  ),
  "package.read": entry(
    "Sản xuất & triển khai",
    "Xem gói sản xuất",
    "Tra cứu các gói cấu hình sản xuất khả dụng.",
  ),
  "package.manage": entry(
    "Sản xuất & triển khai",
    "Quản lý gói sản xuất",
    "Tạo và quản trị gói cấu hình sản xuất.",
  ),
  "package.install": entry(
    "Sản xuất & triển khai",
    "Cài đặt gói sản xuất",
    "Cài một gói cấu hình vào phạm vi tổ chức.",
  ),
  "package.fork": entry(
    "Sản xuất & triển khai",
    "Sao chép gói sản xuất",
    "Tạo bản tùy chỉnh từ một gói sản xuất hiện có.",
  ),

  "service-registrations.read": entry(
    "Quản trị nền tảng",
    "Xem đơn đăng ký dịch vụ",
    "Xem thông tin khách hàng gửi từ biểu mẫu đăng ký công khai.",
  ),
  "service-registrations.manage": entry(
    "Quản trị nền tảng",
    "Xử lý đơn đăng ký dịch vụ",
    "Phê duyệt, từ chối và theo dõi đơn đăng ký dịch vụ.",
  ),
  "content-pages.read": entry(
    "Quản trị nền tảng",
    "Xem trang nội dung",
    "Xem nội dung công khai và trạng thái xuất bản.",
  ),
  "content-pages.manage": entry(
    "Quản trị nền tảng",
    "Quản lý trang nội dung",
    "Soạn thảo, xuất bản và quản lý phiên bản trang nội dung.",
  ),
  "sync-dead-letters.manage": entry(
    "Quản trị nền tảng",
    "Xử lý sự cố đồng bộ",
    "Kiểm tra và xử lý các sự kiện không thể đồng bộ tự động.",
  ),
  "artifact-template.read": entry(
    "Quản trị nền tảng",
    "Xem mẫu Lua",
    "Tra cứu mẫu chương trình Lua dùng trên nền tảng.",
  ),
  "artifact-template.manage": entry(
    "Quản trị nền tảng",
    "Quản lý mẫu Lua",
    "Tạo, cập nhật và quản lý vòng đời mẫu Lua.",
  ),

  "operations.view": entry(
    "Thông báo & chẩn đoán",
    "Xem trạng thái vận hành",
    "Xem bằng chứng kỹ thuật và trạng thái hoạt động của hệ thống.",
  ),
  "operations.diagnostics": entry(
    "Thông báo & chẩn đoán",
    "Thực hiện chẩn đoán",
    "Truy cập thông tin chuyên sâu phục vụ điều tra sự cố.",
  ),
  "notifications.view": entry(
    "Thông báo & chẩn đoán",
    "Xem thông báo",
    "Xem lịch sử và trạng thái gửi thông báo.",
  ),
  "notifications.manage": entry(
    "Thông báo & chẩn đoán",
    "Quản lý thông báo",
    "Cấu hình hoặc thực hiện các thao tác quản lý thông báo.",
  ),
};

function entry(
  group: string,
  label: string,
  description: string,
): PermissionPresentation {
  return { group, label, description };
}

export function getPermissionPresentation(
  code: string,
  fallbackDescription?: string | null,
): PermissionPresentation {
  return (
    PERMISSIONS[code] ?? {
      group: "Quyền khác",
      label: code,
      description:
        fallbackDescription?.trim() ||
        "Quyền này chưa có mô tả trình bày. Mã kỹ thuật được giữ nguyên để đối chiếu.",
    }
  );
}
