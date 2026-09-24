import type { DocsPageDefinition } from "@/lib/docs/content";

const screenshot = (src: string, alt: string, caption: string) => ({
  src,
  alt,
  caption,
  width: 1920,
  height: 1080,
});

export const USER_GUIDE_PAGES: readonly DocsPageDefinition[] = [
  {
    slug: "getting-started",
    group: "Bắt đầu",
    navigationLabel: "Bắt đầu sử dụng",
    eyebrow: "Bắt đầu sử dụng",
    title: "Bắt đầu với IceBot",
    description:
      "Xác định vai trò, chọn đúng ứng dụng và chuẩn bị các thông tin cần thiết trước khi bắt đầu thao tác.",
    readingTime: "5 phút đọc",
    audience: ["Quản trị viên", "Nhân viên vận hành", "Kỹ thuật viên", "Khách hàng"],
    sections: [
      {
        id: "xac-dinh-vai-tro",
        title: "Xác định vai trò của bạn",
        bullets: [
          "SystemAdmin hoặc OrgAdmin: quản lý tổ chức, cửa hàng, tài khoản, quyền và các workspace nền tảng.",
          "Manager hoặc Staff: thực hiện các công việc vận hành trong phạm vi cửa hàng/kiosk được cấp.",
          "Kỹ thuật viên: cài đặt Full Edge và kiểm tra thiết bị tại điểm bán.",
          "Production/Robot Author: tạo workflow và bàn giao bundle chương trình robot.",
          "Khách hàng: chọn món, thanh toán và theo dõi đơn trên Kiosk.",
        ],
      },
      {
        id: "chuan-bi-truy-cap",
        title: "Chuẩn bị trước khi bắt đầu",
        steps: [
          {
            title: "Dùng đúng đường dẫn và tài khoản",
            description:
              "Mở địa chỉ hệ thống được tổ chức cung cấp và đăng nhập bằng tài khoản hoặc thiết bị được phê duyệt.",
          },
          {
            title: "Kiểm tra phạm vi",
            description:
              "Xác nhận tổ chức, cửa hàng, kiosk hoặc môi trường đang thao tác trước khi tạo thay đổi.",
          },
          {
            title: "Đọc kết quả sau thao tác",
            description:
              "Không đóng màn hình hoặc thao tác lặp nếu hệ thống vẫn đang xử lý. Chờ trạng thái thành công, lỗi hoặc cần can thiệp hiển thị rõ ràng.",
          },
        ],
      },
    ],
  },
  {
    slug: "admin-web",
    group: "Hướng dẫn sử dụng",
    navigationLabel: "Admin Web",
    eyebrow: "Hướng dẫn sử dụng · Admin Web",
    title: "Sử dụng Admin Web",
    description:
      "Các thao tác dành cho quản trị viên và đội vận hành: theo dõi kiosk, quản lý danh mục, xử lý giao dịch và làm việc trong phạm vi quyền được cấp.",
    readingTime: "12 phút đọc",
    audience: ["SystemAdmin", "OrgAdmin", "Manager", "Staff"],
    sections: [
      {
        id: "dang-nhap-va-tong-quan",
        title: "Đăng nhập và xem tổng quan",
        steps: [
          {
            title: "Mở Admin Web và đăng nhập",
            description:
              "Sử dụng tài khoản và phương thức đăng nhập được tổ chức cấp. Không chia sẻ mật khẩu hoặc sử dụng tài khoản của người khác.",
          },
          {
            title: "Kiểm tra phạm vi làm việc",
            description:
              "Sau khi đăng nhập, xem tổ chức, cửa hàng và các mục trong thanh điều hướng. Đây là phạm vi dữ liệu và thao tác tài khoản của bạn.",
          },
          {
            title: "Đăng xuất trên máy dùng chung",
            description:
              "Đăng xuất sau khi hoàn tất công việc, đặc biệt khi sử dụng máy tại cửa hàng hoặc máy vận hành chung.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/admin-login.png",
            "Màn hình đăng nhập Admin Web IceBot",
            "Đăng nhập bằng tài khoản được cấp trước khi truy cập các workspace vận hành.",
          ),
          screenshot(
            "/docs/report6/admin-dashboard.png",
            "Dashboard tổng quan Admin Web IceBot",
            "Dashboard hiển thị phạm vi tổ chức, cửa hàng, kiosk và các tín hiệu vận hành.",
          ),
        ],
        callout: {
          title: "Quyền quyết định nội dung hiển thị",
          content:
            "Một số màn hình hoặc nút thao tác có thể không xuất hiện nếu tài khoản không có permission hoặc scope phù hợp. Không cố thay thế bằng thao tác ngoài giao diện.",
        },
      },
      {
        id: "kiosk-va-van-hanh",
        title: "Theo dõi kiosk và tình trạng bán món",
        steps: [
          {
            title: "Mở Quản lý Kiosk",
            description:
              "Chọn kiosk trong tổ chức hoặc cửa hàng được cấp quyền, sau đó xem trạng thái kết nối, hoạt động và các bằng chứng vận hành.",
          },
          {
            title: "Kiểm tra tình trạng bán món",
            description:
              "Mở Trạng thái bán món để tạm dừng hoặc mở bán một món trên từng kiosk. Thao tác này chỉ là điều chỉnh theo kiosk, không thay đổi menu dùng chung.",
          },
          {
            title: "Kiểm tra cảnh báo và readiness",
            description:
              "Khi kiosk có vấn đề, xem Cảnh báo, Bảo trì và Kiểm tra thiết lập trước khi thực hiện thao tác tiếp theo.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/admin-menu-availability.png",
            "Màn hình tình trạng bán món theo kiosk",
            "Tạm dừng hoặc mở bán món trên một kiosk mà không sửa menu dùng chung.",
          ),
        ],
      },
      {
        id: "giao-dich-va-bao-cao",
        title: "Đơn hàng, hoàn tiền và báo cáo",
        steps: [
          {
            title: "Tìm đơn hàng",
            description:
              "Mở Đơn hàng và giao dịch, tìm theo thông tin đơn hoặc bộ lọc trạng thái trong phạm vi tổ chức/cửa hàng.",
          },
          {
            title: "Xem chi tiết trước khi hành động",
            description:
              "Kiểm tra vòng đời đơn, bằng chứng giao dịch và trạng thái thanh toán trước khi hoàn tiền hoặc xử lý hỗ trợ.",
          },
          {
            title: "Kiểm tra kết quả",
            description:
              "Sau thao tác, xác nhận trạng thái mới trên chi tiết giao dịch. Không tự đánh dấu đơn đã thanh toán nếu hệ thống chưa ghi nhận bằng chứng tương ứng.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/admin-transactions.png",
            "Màn hình giao dịch Admin Web",
            "Tra cứu đơn hàng và giao dịch theo phạm vi được cấp.",
          ),
        ],
      },
      {
        id: "san-pham-va-thuc-don",
        title: "Sản phẩm và thực đơn",
        steps: [
          {
            title: "Quản lý sản phẩm",
            description:
              "Tạo hoặc cập nhật sản phẩm, biến thể, tùy chọn và thông tin liên quan trong phạm vi tổ chức.",
          },
          {
            title: "Kiểm tra điều kiện bán",
            description:
              "Xác nhận biến thể có công thức, nguyên liệu và điều kiện sản xuất phù hợp trước khi đưa vào menu.",
          },
          {
            title: "Cập nhật thực đơn",
            description:
              "Tạo hoặc cập nhật món, giá và menu dùng chung. Khi cần tạm dừng riêng một kiosk, sử dụng Trạng thái bán món thay vì sửa menu.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/admin-products.png",
            "Màn hình quản lý sản phẩm Admin Web",
            "Theo dõi sản phẩm, phiên bản bán và các cảnh báo cấu hình.",
          ),
          screenshot(
            "/docs/report6/admin-menu.png",
            "Màn hình quản lý thực đơn Admin Web",
            "Quản lý menu và các món được dùng trong hoạt động bán hàng.",
          ),
        ],
      },
      {
        id: "to-chuc-va-quyen",
        title: "Tổ chức, tài khoản và quyền",
        steps: [
          {
            title: "Quản lý cấu trúc tổ chức",
            description:
              "Xem hoặc quản lý tổ chức, cửa hàng và giờ hoạt động theo quyền. Với giờ mở cửa qua ngày, kiểm tra lại thời điểm đóng trước khi lưu.",
          },
          {
            title: "Quản lý người dùng",
            description:
              "Tài khoản và Nhân viên là các khu vực khác nhau: tài khoản dùng để truy cập hệ thống, còn nhân viên dùng cho quản lý lực lượng làm việc.",
          },
          {
            title: "Đọc ma trận quyền",
            description:
              "Mở Vai trò & quyền để hiểu hành động nào được phép trong từng phạm vi. Nếu thiếu quyền, liên hệ người quản trị thay vì tìm cách bypass giao diện.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/admin-roles.png",
            "Màn hình vai trò và quyền Admin Web",
            "Ma trận quyền giúp giải thích các màn hình và hành động được phép của từng vai trò.",
          ),
        ],
      },
      {
        id: "production-tren-admin-web",
        title: "Production và chương trình robot",
        steps: [
          {
            title: "Upload bundle chương trình",
            description:
              "Trong Chương trình robot, upload bundle do người phụ trách robot xuất ra. Admin Web sẽ kiểm tra cấu trúc trước khi cho phép xử lý tiếp.",
          },
          {
            title: "Kiểm tra import",
            description:
              "Xem workspace import, xử lý cảnh báo và dùng Resume khi có một lần import bị gián đoạn nhưng vẫn có thể khôi phục.",
          },
          {
            title: "Publish hoặc triển khai",
            description:
              "Chỉ publish, liên kết cấu hình, cài gói hoặc rollback khi tài khoản có quyền và đã kiểm tra đúng kiosk/cửa hàng đích.",
          },
        ],
        callout: {
          title: "Đối chiếu UI trước khi thao tác",
          content:
            "Một số bước production trong Report 6 có thể phụ thuộc phiên bản giao diện. Chỉ thực hiện các nút đang hiển thị trong workspace hiện tại và theo đúng scope được cấp.",
          tone: "warning",
        },
      },
    ],
  },
  {
    slug: "kiosk",
    group: "Hướng dẫn sử dụng",
    navigationLabel: "Kiosk",
    eyebrow: "Hướng dẫn sử dụng · Kiosk",
    title: "Cài đặt và sử dụng IceBot Kiosk",
    description:
      "Hướng dẫn cho người cài đặt kiosk và khách hàng thao tác chọn món, tạo đơn, thanh toán và theo dõi trạng thái.",
    readingTime: "8 phút đọc",
    audience: ["Người cài đặt kiosk", "Nhân viên cửa hàng", "Khách hàng"],
    sections: [
      {
        id: "cai-dat-kiosk",
        title: "Cài đặt ứng dụng Kiosk",
        steps: [
          {
            title: "Mở bộ cài đặt được cung cấp",
            description:
              "Chỉ sử dụng bộ cài đặt từ nguồn triển khai được phê duyệt. Không tải hoặc thay thế file cài đặt từ nguồn không xác định.",
          },
          {
            title: "Chọn thư mục cài đặt",
            description:
              "Giữ thư mục mặc định nếu không có yêu cầu triển khai khác, sau đó tiếp tục qua trình cài đặt.",
          },
          {
            title: "Đọc điều khoản và cài đặt",
            description:
              "Đọc End-User License Agreement, chấp nhận điều khoản nếu phù hợp và bấm Install để hoàn tất.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/kiosk-install-destination.png",
            "Trình cài đặt IceBot Kiosk tại bước chọn thư mục",
            "Chọn thư mục đích trước khi tiếp tục cài đặt Kiosk.",
          ),
          screenshot(
            "/docs/report6/kiosk-license.png",
            "Trình cài đặt IceBot Kiosk tại bước chấp nhận license",
            "Đọc và chấp nhận điều khoản sử dụng trước khi cài đặt.",
          ),
          screenshot(
            "/docs/report6/kiosk-ready-to-install.png",
            "Trình cài đặt IceBot Kiosk sẵn sàng cài đặt",
            "Kiểm tra lại lựa chọn rồi bắt đầu quá trình cài đặt.",
          ),
        ],
      },
      {
        id: "chon-mon-va-gio-hang",
        title: "Chọn món và quản lý giỏ hàng",
        steps: [
          {
            title: "Chọn món",
            description:
              "Chọn món đang được kiosk cung cấp để xem giá, thời gian dự kiến và thông tin món.",
          },
          {
            title: "Điều chỉnh số lượng",
            description:
              "Trong chi tiết món hoặc giỏ hàng, dùng nút cộng/trừ để điều chỉnh số lượng trước khi tiếp tục.",
          },
          {
            title: "Kiểm tra giỏ hàng",
            description:
              "Kiểm tra món, số lượng và tổng tiền. Xóa món hoặc quay lại menu nếu cần thay đổi.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/kiosk-menu.png",
            "Màn hình chọn món trên IceBot Kiosk",
            "Chọn một món từ menu đang được kiosk cung cấp.",
          ),
          screenshot(
            "/docs/report6/kiosk-item-detail.png",
            "Màn hình chi tiết món trên IceBot Kiosk",
            "Kiểm tra giá, thời gian và số lượng trước khi thêm vào giỏ hàng.",
          ),
          screenshot(
            "/docs/report6/kiosk-cart.png",
            "Màn hình giỏ hàng trên IceBot Kiosk",
            "Kiểm tra các món và tổng tiền trước khi chuyển sang thanh toán.",
          ),
        ],
      },
      {
        id: "thanh-toan-va-theo-doi",
        title: "Thanh toán và theo dõi đơn hàng",
        steps: [
          {
            title: "Xác nhận đơn hàng",
            description:
              "Kiểm tra lại món và số lượng, sau đó tạo mã QR thanh toán theo hướng dẫn trên màn hình.",
          },
          {
            title: "Hoàn tất thanh toán",
            description:
              "Dùng ứng dụng ngân hàng hoặc ví điện tử để quét mã. Không đóng màn hình khi kiosk đang chờ xác nhận.",
          },
          {
            title: "Theo dõi trạng thái",
            description:
              "Sau khi thanh toán, theo dõi trạng thái đơn trên kiosk và làm theo hướng dẫn nhận sản phẩm.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/kiosk-order-review.png",
            "Màn hình xác nhận đơn hàng trên IceBot Kiosk",
            "Kiểm tra đơn hàng trước khi tạo mã QR thanh toán.",
          ),
          screenshot(
            "/docs/report6/kiosk-payment.png",
            "Màn hình thanh toán QR trên IceBot Kiosk",
            "Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để thanh toán.",
          ),
        ],
        callout: {
          title: "Không tự xác nhận thanh toán",
          content:
            "Nếu giao dịch chưa hiển thị kết quả, hãy giữ lại thông tin đơn và liên hệ nhân viên cửa hàng. Không tạo thêm đơn liên tiếp khi chưa biết trạng thái đơn trước.",
          tone: "warning",
        },
      },
    ],
  },
  {
    slug: "full-edge",
    group: "Hướng dẫn sử dụng",
    navigationLabel: "Full Edge",
    eyebrow: "Hướng dẫn triển khai · Full Edge",
    title: "Cài đặt và kiểm tra máy biên Full Edge",
    description:
      "Quy trình dành cho kỹ thuật viên triển khai máy biên kết nối kiosk, robot và Backend. Các giá trị kết nối phải lấy từ gói triển khai được cấp.",
    readingTime: "10 phút đọc",
    audience: ["Kỹ thuật viên triển khai", "Nhân viên hỗ trợ hệ thống"],
    sections: [
      {
        id: "chuan-bi-may-bien",
        title: "Chuẩn bị trước khi cài đặt",
        bullets: [
          "Máy Windows và các thiết bị robot/kiosk đã được bàn giao đúng cấu hình.",
          "Bộ cài đặt Full Edge và thông tin triển khai được cấp cho đúng môi trường.",
          "Kết nối mạng tới Backend và quyền quản trị máy cần thiết.",
          "Kiosk Code, Execution Endpoint và thông tin thiết bị phải khớp với hồ sơ triển khai.",
        ],
        callout: {
          title: "Không đưa thông tin bí mật vào Docs",
          content:
            "Không ghi lại NetBird key, certificate password, private key, token, connection string hoặc giá trị cấu hình thật trong tài liệu hay ảnh chụp màn hình.",
          tone: "warning",
        },
      },
      {
        id: "init-icebot",
        title: "Chạy Init IceBot",
        steps: [
          {
            title: "Mở công cụ khởi tạo",
            description:
              "Chạy Init IceBot trên máy biên bằng quyền được cấp và kiểm tra cấu hình hiện tại trước khi thay đổi.",
          },
          {
            title: "Cấu hình robot và cổng thiết bị",
            description:
              "Nhập robot IP, model/runtime target và COM port theo biên bản triển khai. Giữ nguyên giá trị đã đúng nếu công cụ hiển thị sẵn.",
          },
          {
            title: "Liên kết kiosk với Backend",
            description:
              "Xác nhận Kiosk Code, KioskId và Execution Endpoint được cấp cho đúng kiosk; sau đó thực hiện bước provisioning theo hướng dẫn của môi trường.",
          },
        ],
      },
      {
        id: "kiem-tra-hoat-dong",
        title: "Kiểm tra sau khi cài đặt",
        steps: [
          {
            title: "Kiểm tra trạng thái kiosk",
            description:
              "Kiosk phải chuyển sang trạng thái Active/Operational theo màn hình xác nhận của công cụ triển khai.",
          },
          {
            title: "Kiểm tra heartbeat",
            description:
              "Xác nhận Backend nhận được heartbeat mTLS và snapshot thiết bị từ máy biên.",
          },
          {
            title: "Đối chiếu trên Admin Web",
            description:
              "Mở Quản lý Kiosk hoặc Kiểm tra thiết lập trên Admin Web để xác nhận trạng thái và nguyên nhân nếu kết nối chưa sẵn sàng.",
          },
        ],
      },
      {
        id: "xu-ly-loi-may-bien",
        title: "Xử lý lỗi thường gặp",
        bullets: [
          "Không có heartbeat: kiểm tra mạng, service Full Edge và thông tin chứng thực theo quy trình triển khai.",
          "Kiosk không được nhận diện: đối chiếu Kiosk Code, KioskId và Execution Endpoint.",
          "Robot hoặc COM không phản hồi: kiểm tra dây nối, IP/COM port và trạng thái thiết bị trước khi thử lại.",
          "Không tự thay certificate hoặc key; chuyển thông tin lỗi cho người phụ trách môi trường.",
        ],
      },
    ],
  },
  {
    slug: "fairobot-studio",
    group: "Hướng dẫn sử dụng",
    navigationLabel: "FaiRobot Studio",
    eyebrow: "Hướng dẫn sử dụng · FaiRobot Studio",
    title: "Tạo và xuất workflow robot",
    description:
      "Hướng dẫn thao tác giao diện cho người tạo workflow robot. Phần này tập trung vào scene, mô phỏng và export; không mô tả code hoặc SDK.",
    readingTime: "9 phút đọc",
    audience: ["Production Author", "Robot Author"],
    sections: [
      {
        id: "tao-scene",
        title: "Tạo scene và chọn robot",
        steps: [
          {
            title: "Mở hoặc tạo project",
            description:
              "Mở project phù hợp với robot và bố trí scene theo thiết bị, môi trường và tool thực tế.",
          },
          {
            title: "Chọn chế độ điều khiển",
            description:
              "Chọn Joint (FK) hoặc Cartesian (IK) theo cách bạn cần xác định vị trí và chuyển động của robot.",
          },
          {
            title: "Kiểm tra tool và đơn vị",
            description:
              "Xác nhận tool, TCP và đơn vị đo trước khi tạo các điểm chuyển động.",
          },
        ],
        figures: [
          screenshot(
            "/docs/report6/fairobot-resources.png",
            "Khu vực tài nguyên và robot control trong FaiRobot Studio",
            "Kiểm tra danh sách thiết bị, robot control và đơn vị đo trước khi tạo workflow.",
          ),
        ],
      },
      {
        id: "tao-va-mo-phong-workflow",
        title: "Tạo và mô phỏng workflow",
        steps: [
          {
            title: "Thêm lệnh vào workflow",
            description:
              "Thêm các khối thao tác cần thiết như Move, Loop, Delay, Set DO hoặc Kích thiết bị.",
          },
          {
            title: "Sắp xếp trình tự",
            description:
              "Kiểm tra thứ tự các bước, điểm A/B và điều kiện thiết bị trước khi chạy mô phỏng.",
          },
          {
            title: "Chạy mô phỏng",
            description:
              "Dùng chế độ chạy/dừng của Studio để kiểm tra workflow trong scene trước khi xuất bản.",
          },
        ],
      },
      {
        id: "export-va-ban-giao",
        title: "Export và bàn giao lên Admin Web",
        steps: [
          {
            title: "Kiểm tra project",
            description:
              "Xác nhận robot model, tool, thiết bị sử dụng và workflow không còn cảnh báo trước khi export.",
          },
          {
            title: "Export bundle",
            description:
              "Dùng chức năng export của Studio để tạo bundle theo quy trình triển khai được phê duyệt.",
          },
          {
            title: "Upload trên Admin Web",
            description:
              "Bàn giao bundle cho người có quyền upload vào Chương trình robot trên Admin Web để kiểm tra, import và publish.",
          },
        ],
        callout: {
          title: "Tài liệu này không thay thế quy trình an toàn robot",
          content:
            "Chỉ chạy mô phỏng hoặc thao tác trên thiết bị thật khi đã có quy trình an toàn, vùng làm việc và người giám sát phù hợp.",
          tone: "warning",
        },
      },
    ],
  },
  {
    slug: "operations",
    group: "Vận hành",
    navigationLabel: "Xử lý sự cố",
    eyebrow: "Hướng dẫn vận hành",
    title: "Xử lý sự cố và kiểm tra trạng thái",
    description:
      "Quy trình chung để đọc tín hiệu, kiểm tra bằng chứng, thực hiện hành động được phép và xác nhận kết quả trên IceBot.",
    readingTime: "6 phút đọc",
    audience: ["Nhân viên vận hành", "Quản trị viên", "Kỹ thuật viên"],
    sections: [
      {
        id: "trinh-tu-xu-ly",
        title: "Trình tự xử lý",
        steps: [
          {
            title: "Xác định trạng thái",
            description:
              "Kiểm tra dashboard, trạng thái kiosk, cảnh báo và readiness để biết hệ thống đang hoạt động bình thường hay cần can thiệp.",
          },
          {
            title: "Đọc bằng chứng",
            description:
              "Mở chi tiết cảnh báo, kiosk, giao dịch hoặc lần triển khai để xác định nguyên nhân trước khi thực hiện hành động.",
          },
          {
            title: "Thực hiện hành động được phép",
            description:
              "Chọn retry, sửa cấu hình, bảo trì, hoàn tiền hoặc liên hệ người có quyền tùy theo trạng thái hiển thị.",
          },
          {
            title: "Xác nhận kết quả",
            description:
              "Kiểm tra trạng thái mới và ghi nhận thông tin cần bàn giao nếu sự cố chưa được giải quyết.",
          },
        ],
      },
      {
        id: "quyen-va-pham-vi",
        title: "Quyền và phạm vi",
        paragraphs: [
          "Role xác định người dùng có thể làm gì; scope xác định họ được làm trên tổ chức, cửa hàng hoặc kiosk nào. Giao diện chỉ hiển thị các thao tác phù hợp với hai điều kiện này.",
        ],
        callout: {
          title: "Không bỏ qua kiểm tra quyền",
          content:
            "Nếu không thấy màn hình hoặc nút cần dùng, hãy liên hệ người quản trị. Không sử dụng tài khoản khác hoặc thao tác ngoài quy trình để vượt qua giới hạn.",
          tone: "warning",
        },
      },
      {
        id: "bao-mat-thong-tin",
        title: "Bảo vệ thông tin vận hành",
        bullets: [
          "Không chụp hoặc chia sẻ mật khẩu, key, certificate, token và connection string.",
          "Không tự đánh dấu đơn đã thanh toán khi chưa có bằng chứng giao dịch.",
          "Không thử lại nhiều lần các thao tác có thể tạo đơn, hoàn tiền hoặc triển khai lặp nếu chưa xác định trạng thái lần trước.",
          "Khi lỗi liên quan thiết bị thật hoặc robot, dừng thao tác nguy hiểm và chuyển cho người phụ trách kỹ thuật.",
        ],
      },
    ],
  },
] as const;
