# Checklist cải thiện từ KF02 và KF03

## 1. Mục đích và phạm vi

Checklist này tổng hợp các lỗi, điểm chưa nhất quán và cơ hội cải thiện được ghi nhận từ:

- `KF02_Partner_Registration_and_Access_Validation.docx`
- `KF03_Organization_Kiosk_Edge_Device_Management_Validation.docx`

Phạm vi triển khai có thể liên quan đến cả `IceBot-WebApp` và `IceBot-Backend`. Hai file DOCX chỉ là tài liệu đầu vào local, không thuộc source cần commit.

Quy ước ưu tiên:

- **P0**: lỗi dữ liệu hoặc hành vi hiển thị sai, cần sửa trước.
- **P1**: cải thiện quan trọng về UX, tính nhất quán hoặc khả năng vận hành.
- **P2**: cải thiện dài hạn, cần thêm quyết định sản phẩm hoặc kiến trúc.

## 2. Nguyên tắc không được phá vỡ

- [ ] Giữ nguyên RBAC và phạm vi quản lý của `SystemAdmin`, `OrgAdmin`, `Manager`, `Staff`, `Technician`.
- [ ] Không làm thay đổi public submit response nếu không có yêu cầu contract riêng.
- [ ] Không làm hỏng idempotency của `POST /api/v1/service-registrations`.
- [ ] Không gửi lại acknowledgement email khi replay cùng idempotency key.
- [ ] Lỗi gửi email không được làm đơn đăng ký đã lưu chuyển thành thất bại.
- [ ] Giữ riêng lifecycle của Store, Kiosk, Product, Product Version, Recipe, Menu, Menu Item, Robot Program và Configuration Deployment.
- [ ] Không đưa credential, SMTP secret, dữ liệu cá nhân hoặc file kiểm thử chứa dữ liệu cá nhân vào repository.

## 3. KF02 - Partner Registration and Access

### KF02.1 - Sửa trạng thái đồng ý chính sách hiển thị sai

**Ưu tiên:** P0

**Loại:** Bug contract/mapping

**Phạm vi:** Backend + Frontend

Hiện tại backend bắt buộc người đăng ký đồng ý chính sách và lưu `PrivacyPolicyAcceptedAt`, nhưng management result không trả trạng thái hoặc thời điểm đồng ý. Frontend đọc `privacyPolicyAccepted`; field bị thiếu có thể bị diễn giải thành `false` và hiển thị “Chưa đồng ý”.

- [ ] Chọn contract quản trị rõ ràng:
  - [ ] Trả `privacyPolicyAccepted` trong `ServiceRegistrationResult`; hoặc
  - [ ] Trả `privacyPolicyAcceptedAt` và suy ra trạng thái từ timestamp.
- [ ] Bổ sung field đã chọn vào backend result contract.
- [ ] Map field từ `ServiceRegistrationEntity` sang management result.
- [ ] Cập nhật frontend shared type theo đúng backend contract.
- [ ] Không coi field bị thiếu là “Chưa đồng ý”; dùng trạng thái “Không xác định” nếu response cũ hoặc lỗi contract.
- [ ] Hiển thị “Đã đồng ý” và thời điểm đồng ý nếu backend cung cấp timestamp.
- [ ] Thêm backend unit test cho result mapping.
- [ ] Thêm frontend component test cho ba trường hợp: đã đồng ý, chưa đồng ý hợp lệ, thiếu dữ liệu.
- [ ] Retest bằng một registration mới từ public form đến management detail.

**Tiêu chí nghiệm thu:** Đơn chỉ submit được khi consent hợp lệ và management detail luôn hiển thị đúng trạng thái đã lưu, không còn trường hợp field thiếu bị hiển thị thành “Chưa đồng ý”.

### KF02.2 - Chuẩn hóa cách gọi vai trò OrgAdmin

**Ưu tiên:** P1

**Loại:** UX/copywriting

**Phạm vi:** Frontend

- [ ] Thay câu “tài khoản OrgAdmin” bằng “tài khoản Quản trị viên tổ chức”.
- [ ] Chỉ giữ `(OrgAdmin)` ở lần giải thích đầu tiên hoặc tại khu vực dành cho người dùng kỹ thuật.
- [ ] Dùng thống nhất “Quản trị viên tổ chức” trong tiêu đề, mô tả, dialog duyệt và thông báo kết quả.
- [ ] Không đổi role code `OrgAdmin` trong API, token, RBAC hoặc source logic.
- [ ] Cập nhật test snapshot/text assertion có liên quan.

**Tiêu chí nghiệm thu:** Người dùng nghiệp vụ hiểu vai trò được cấp mà không cần biết role code kỹ thuật; quyền hạn thực tế không thay đổi.

### KF02.3 - Xác nhận vận hành acknowledgement email

**Ưu tiên:** P1

**Loại:** Vận hành

**Phạm vi:** Backend + môi trường triển khai

- [ ] Cấu hình SMTP thật qua secret manager, user-secrets hoặc environment variables.
- [ ] Không lưu SMTP password trong `appsettings.json`, source code, test hoặc tài liệu.
- [ ] Submit đúng một registration bằng email kiểm thử được phép sử dụng.
- [ ] Xác nhận email tới Inbox hoặc Spam/Junk.
- [ ] Xác nhận subject, người nhận và nội dung tiếng Việt đúng.
- [ ] Xác nhận email không chứa reference code, mã số thuế, credential hoặc dữ liệu nhạy cảm không cần thiết.
- [ ] Xác nhận replay cùng idempotency key không phát sinh email thứ hai.
- [ ] Xác nhận SMTP lỗi chỉ tạo log và không làm submit thất bại.

**Tiêu chí nghiệm thu:** Có bằng chứng một email thực tế được SMTP chấp nhận và nhận tại inbox, đồng thời các ràng buộc bảo mật/idempotency vẫn đúng.

### KF02.4 - Quyết định cơ chế retry và audit email

**Ưu tiên:** P2

**Loại:** Kiến trúc/vận hành

**Phạm vi:** Backend

- [ ] Xác định acknowledgement email có yêu cầu đảm bảo gửi hay chỉ best-effort.
- [ ] Nếu cần đảm bảo gửi, thiết kế outbox hoặc delivery job sau database commit.
- [ ] Lưu trạng thái tối thiểu: loại email, registration ID, trạng thái, số lần thử, lỗi gần nhất và thời điểm gửi.
- [ ] Bảo đảm retry không gửi trùng khi trạng thái delivery không rõ.
- [ ] Bổ sung metric/log để vận hành phát hiện email lỗi.
- [ ] Không expose delivery record hoặc dữ liệu đăng ký qua public reference code.

**Tiêu chí nghiệm thu:** Có quyết định kiến trúc được ghi nhận; nếu chọn durable delivery thì có retry, audit và idempotency rõ ràng.

### KF02.5 - Làm sạch tài liệu kiểm thử trước khi chia sẻ

**Ưu tiên:** P1

**Loại:** Bảo mật tài liệu

**Phạm vi:** Tài liệu

- [ ] Che email, số điện thoại, địa chỉ và dữ liệu nhận dạng cá nhân trong text.
- [ ] Che cùng dữ liệu trong toàn bộ screenshot/ảnh nhúng.
- [ ] Xóa hoặc thay temporary password bằng dữ liệu giả.
- [ ] Rotate credential nếu credential trong tài liệu từng có hiệu lực.
- [ ] Kiểm tra comments, tracked changes, document properties và metadata tác giả.
- [ ] Chỉ commit/chia sẻ bản đã redaction khi có yêu cầu chính thức.

**Tiêu chí nghiệm thu:** Bản tài liệu có thể chia sẻ mà không làm lộ PII hoặc credential; bản gốc vẫn được giữ local theo phạm vi truy cập phù hợp.

## 4. KF03 - Organization, Kiosk and Edge Device Management

KF03 không có Word comment báo bug chính thức. Các hạng mục dưới đây là cải thiện rút ra từ workflow, text và screenshot trong tài liệu; cần tránh coi chúng là lỗi contract nếu chưa có quyết định sản phẩm.

### KF03.1 - Chuẩn hóa timezone mặc định

**Ưu tiên:** P1

**Loại:** Nhất quán dữ liệu

**Phạm vi:** Backend + Frontend

- [ ] Chọn timezone mặc định chính thức cho deployment tại Việt Nam, đề xuất `Asia/Ho_Chi_Minh`.
- [ ] Đổi default của form tạo Store từ `Asia/Bangkok` sang timezone đã chọn.
- [ ] Đổi default trong backend Store entity/request/handler.
- [ ] Đổi default backend Kiosk entity/request/handler nếu còn `Asia/Bangkok`.
- [ ] Giữ frontend Kiosk và quick setup đồng bộ với backend.
- [ ] Thay input timezone tự do bằng select/combobox từ danh sách IANA hợp lệ hoặc thêm validation rõ ràng.
- [ ] Quyết định cách xử lý dữ liệu cũ đang lưu `Asia/Bangkok`:
  - [ ] Giữ nguyên vì cùng UTC+7; hoặc
  - [ ] Chạy migration có kiểm soát sang `Asia/Ho_Chi_Minh`.
- [ ] Kiểm tra format ngày/giờ và sales admission sau thay đổi.

**Tiêu chí nghiệm thu:** Store, Kiosk và quick setup dùng cùng một default; không có record mới tự sinh `Asia/Bangkok` ngoài chủ ý của người dùng.

### KF03.2 - Làm rõ quan hệ giữa tạo Store trực tiếp và quick setup

**Ưu tiên:** P1

**Loại:** UX/workflow

**Phạm vi:** Frontend, có thể cần backend nếu bổ sung readiness summary

- [ ] Xác nhận product decision: tạo Store trực tiếp có phải bắt đầu quick setup hay là advanced flow độc lập.
- [ ] Nếu là flow độc lập, hiển thị rõ Store đã được tạo nhưng onboarding vận hành chưa hoàn tất.
- [ ] Sau khi tạo Store thành công, cung cấp CTA phù hợp:
  - [ ] “Tiếp tục thiết lập điểm bán”; hoặc
  - [ ] “Tạo Kiosk”; hoặc
  - [ ] “Xem checklist sẵn sàng vận hành”.
- [ ] Không tự động chuyển hướng nếu điều đó làm mất ngữ cảnh quản trị hiện tại.
- [ ] Giữ deep link để người dùng có thể quay lại đúng Store vừa tạo.
- [ ] Thêm test cho CTA và navigation sau create success.

**Tiêu chí nghiệm thu:** Người dùng biết bước tiếp theo sau khi tạo Store và không hiểu nhầm rằng toàn bộ Kiosk/menu/configuration đã hoàn tất.

### KF03.3 - Phân biệt trạng thái Active với sẵn sàng bán hàng

**Ưu tiên:** P1

**Loại:** UX/semantics

**Phạm vi:** Backend + Frontend

- [ ] Ghi rõ `Store.Status = Active` chỉ thể hiện lifecycle/khả năng quản trị, không mặc nhiên đồng nghĩa ready-to-sell.
- [ ] Hiển thị commercial/operational readiness riêng, không nhét thêm ý nghĩa vào status `Active`.
- [ ] Tối thiểu kiểm tra và trình bày các blocker:
  - [ ] Tổ chức/Store đang active.
  - [ ] Có Kiosk hợp lệ và trạng thái kết nối rõ ràng.
  - [ ] Có menu active và menu item bán được.
  - [ ] Recipe/version/program binding hợp lệ.
  - [ ] Có production configuration/deployment hợp lệ.
  - [ ] Payment provider và inventory đáp ứng điều kiện vận hành.
- [ ] Dùng CTA cụ thể cho từng blocker thay vì chỉ hiển thị badge cảnh báo.
- [ ] Không tự động đổi Store sang inactive chỉ vì thiếu một cấu hình con nếu chưa có quyết định nghiệp vụ.

**Tiêu chí nghiệm thu:** Màn hình không dùng “Đang hoạt động” như bằng chứng duy nhất rằng điểm bán đã sẵn sàng nhận đơn.

### KF03.4 - Làm rõ semantics của lịch mở cửa

**Ưu tiên:** P1

**Loại:** UX/copywriting

**Phạm vi:** Frontend + regression backend

- [ ] Đổi toggle “Áp dụng lịch” thành lựa chọn khó hiểu nhầm, ví dụ “Giới hạn bán hàng theo lịch mở cửa”.
- [ ] Nói rõ tắt lịch nghĩa là bán không giới hạn theo ngày, không phải “chưa cấu hình”.
- [ ] Cảnh báo khi người dùng chọn áp dụng lịch nhưng đóng toàn bộ các ngày.
- [ ] Kiểm tra ca qua đêm khi giờ đóng nhỏ hơn giờ mở.
- [ ] Kiểm tra timezone được dùng khi đánh giá opening hours.
- [ ] Thêm test cho không có lịch, lịch bình thường, đóng cả ngày và ca qua đêm.

**Tiêu chí nghiệm thu:** Người dùng phân biệt được “không giới hạn giờ bán”, “đang ngoài giờ” và “đóng cả ngày”.

### KF03.5 - Bảo vệ ranh giới lifecycle đã được tài liệu xác nhận

**Ưu tiên:** P1

**Loại:** Regression/contract

**Phạm vi:** Backend + Frontend

- [ ] Product status không bị đồng nhất với Product Version status.
- [ ] Recipe `Published`/`Active` không bị đồng nhất với Product hoặc Menu Item availability.
- [ ] Menu status và Menu Item status vẫn được quản lý độc lập.
- [ ] Robot Program import/draft/publish được tách khỏi recipe-program binding.
- [ ] Configuration Release publication được tách khỏi deployment và observed active state trên edge device.
- [ ] Kiosk lifecycle được tách khỏi connectivity/last-seen health.
- [ ] Disable/archive một thành phần phải trả blocker rõ ràng nếu đang được thành phần khác sử dụng.
- [ ] Bổ sung regression test cho các transition và dependency blocker quan trọng.

**Tiêu chí nghiệm thu:** Không có thay đổi UI hoặc API làm gộp các trạng thái khác bản chất thành một badge hoặc một thao tác duy nhất.

### KF03.6 - Nâng chất lượng hướng dẫn và phản hồi sau thao tác

**Ưu tiên:** P2

**Loại:** UX

**Phạm vi:** Frontend

- [ ] Sau create/update/publish/deploy, hiển thị đối tượng đã thay đổi và trạng thái mới.
- [ ] Giữ người dùng ở đúng ngữ cảnh Organization/Store/Kiosk hiện tại.
- [ ] Với thao tác bất đồng bộ, hiển thị pending, failure reason và cách retry.
- [ ] Với publish/deploy, phân biệt “đã yêu cầu”, “đã phát hành”, “đã triển khai” và “edge đã xác nhận active”.
- [ ] Dùng wording tiếng Việt cho người vận hành; role code, enum và revision chỉ là thông tin kỹ thuật phụ.

**Tiêu chí nghiệm thu:** Sau mỗi thao tác, người dùng biết việc gì đã xảy ra, trạng thái nào đã thay đổi và bước tiếp theo là gì.

## 5. Những hạng mục đã xử lý, không đưa lại vào backlog

- [x] Ẩn reference code `SR-...` khỏi success state của public registration.
- [x] Hiển thị thông báo đơn đã được tiếp nhận và hướng dẫn kiểm tra email/Spam/Junk.
- [x] Bỏ mã số thuế khỏi public registration form và payload của form này.
- [x] Giữ mã số thuế optional trong shared/backend contract để cập nhật sau.
- [x] Gửi acknowledgement email sau khi registration mới được lưu.
- [x] Không gửi acknowledgement lần hai khi idempotency replay.
- [x] Không làm submit thất bại khi email sender lỗi.
- [x] Không thay đổi public response, database schema hoặc luồng duyệt/provisioning trong thay đổi acknowledgement.

## 6. Kế hoạch triển khai đề xuất

### Đợt 1 - Sửa lỗi dữ liệu KF02

- [ ] Hoàn thành KF02.1.
- [ ] Chạy backend mapping/unit tests.
- [ ] Chạy frontend component tests.
- [ ] Retest submit mới đến management detail.

### Đợt 2 - Cải thiện copy và vận hành KF02

- [ ] Hoàn thành KF02.2.
- [ ] Hoàn thành KF02.3 khi có SMTP hợp lệ.
- [ ] Ra quyết định cho KF02.4.
- [ ] Tạo bản tài liệu đã redaction theo KF02.5 nếu cần chia sẻ.

### Đợt 3 - Nhất quán Store/Kiosk KF03

- [ ] Hoàn thành KF03.1.
- [ ] Hoàn thành KF03.2.
- [ ] Hoàn thành KF03.3.
- [ ] Hoàn thành KF03.4.

### Đợt 4 - Regression toàn bộ lifecycle KF03

- [ ] Hoàn thành KF03.5.
- [ ] Hoàn thành KF03.6.
- [ ] Chạy role-based browser validation cho SystemAdmin và OrgAdmin.
- [ ] Chạy regression các API/GraphQL mutation liên quan.
- [ ] Xác nhận deep link, realtime refresh và current scope không bị mất sau thao tác.

## 7. Completion gate

- [ ] Tất cả mục P0 đã hoàn thành và có test chống tái diễn.
- [ ] Mỗi mục P1 được hoàn thành hoặc có quyết định hoãn kèm lý do.
- [ ] Backend build và test liên quan đều pass.
- [ ] Frontend TypeScript, ESLint và focused tests đều pass.
- [ ] Browser validation đã kiểm tra các flow thay đổi với role phù hợp.
- [ ] Không có thay đổi ngoài phạm vi được stage/commit.
- [ ] Hai file DOCX vẫn local nếu chưa có yêu cầu phát hành bản đã redaction.
- [ ] Handoff ghi rõ mục hoàn thành, mục hoãn, rủi ro còn lại và commit tương ứng.

## 8. Cập nhật trạng thái hiện tại - 12/09/2026

> Phần này là bản tổng hợp trạng thái mới nhất sau đợt cải thiện frontend. Các checklist chi tiết phía trên vẫn được giữ để làm tiêu chí nghiệm thu đầy đủ. Thay đổi hiện tại chưa commit/push.

### 8.1. Đã hoàn thành ở frontend

- [x] KF02.1: Không còn diễn giải field consent bị thiếu thành “Chưa đồng ý”. Client dùng `privacyPolicyAccepted` khi có và dùng `privacyPolicyRevisionId` bắt buộc làm bằng chứng tương thích; dữ liệu thiếu hoàn toàn được hiển thị “Không xác định”.
- [x] KF02.1: Có component test cho ba trường hợp đã đồng ý, chưa đồng ý và không xác định.
- [x] KF02.2: Dialog duyệt dùng thuật ngữ nghiệp vụ “Quản trị viên tổ chức”, không thay đổi role code `OrgAdmin`, RBAC hoặc payload API.
- [x] KF02: Mã hồ sơ được giải thích là thông tin tra cứu/đối chiếu nội bộ; `Revision` được đổi thành “Phiên bản dữ liệu”.
- [x] KF02: Danh sách trạng thái và field hiển thị hồ sơ đã được đối chiếu lại với contract backend hiện tại (`createdAt`, `reviewReason`, provisioning fields và invitation ID).
- [x] KF03.1: Form Store, Kiosk và quick setup dùng cùng default `Asia/Ho_Chi_Minh` ở client.
- [x] KF03.1: Input timezone có gợi ý IANA và chặn giá trị timezone không hợp lệ trước khi gọi API.
- [x] KF03.2: UI nói rõ tạo Store trực tiếp không tự khởi động “Thiết lập nhanh điểm bán”; màn hình quick setup cũng phân biệt record được tạo trực tiếp.
- [x] KF03.4: Đổi wording thành “Giới hạn thời gian bán” và giải thích rõ khi tắt lịch thì không giới hạn bán theo ngày.
- [x] KF03.4: Có test xác nhận lịch mở cửa đã cấu hình được đưa vào payload tạo Store, không bị client làm rơi dữ liệu.
- [x] Kiểm tra frontend: 106 test file / 379 test pass, TypeScript pass, source lint pass, architecture check 0 lỗi và production build pass.

### 8.2. Hạng mục còn lại

| ID | Ưu tiên | Hạng mục còn lại | Phạm vi/điều kiện |
| --- | --- | --- | --- |
| KF02.1 | P1 | Nếu cần contract consent đầy đủ, backend phải trả trực tiếp `privacyPolicyAccepted` hoặc `privacyPolicyAcceptedAt`, map từ entity và có backend unit test. Sau đó retest public submit đến management detail. | Backend + E2E. Frontend hiện đã có fallback an toàn nên đây không còn là lỗi hiển thị P0. |
| KF02.3 | P1 | Kiểm thử acknowledgement email bằng SMTP và hộp thư thật: Inbox/Spam, subject/body, replay idempotency và trường hợp SMTP lỗi. | Cần SMTP secret và email kiểm thử hợp lệ; không lưu credential vào repo. |
| KF02.4 | P2 | Quyết định email chỉ best-effort hay cần durable delivery. Nếu cần đảm bảo gửi thì triển khai outbox/job, retry, audit và metric. | Quyết định kiến trúc/nghiệp vụ trước khi sửa backend. |
| KF02.5 | P1 | Redact PII, temporary credential, ảnh nhúng, comment và metadata trong hai DOCX trước khi chia sẻ hoặc commit. | Tài liệu; bản gốc tiếp tục giữ local. |
| KF03.1 | P1 | Backend vẫn dùng default `Asia/Bangkok` cho Store/Kiosk. Cần quyết định đổi default backend và giữ hay migrate dữ liệu cũ. | Backend + migration/regression; chưa sửa do phạm vi đợt này ưu tiên client. |
| KF03.2 | P1 | Chọn CTA sau khi tạo Store trực tiếp: tiếp tục thiết lập, tạo Kiosk hay mở readiness checklist; bổ sung navigation/deep-link test. | Cần quyết định sản phẩm, vì mỗi lựa chọn dẫn người dùng sang workflow khác nhau. |
| KF03.3 | P1 | Hiển thị operational/commercial readiness riêng với lifecycle `Active`, kèm blocker và CTA cụ thể cho Kiosk, menu, recipe/program, deployment, payment và inventory. | Thay đổi nghiệp vụ lớn, cần chốt nguồn dữ liệu và vị trí UI trước khi làm. |
| KF03.4 | P1 | Cảnh báo khi bật lịch nhưng đóng toàn bộ ngày; bổ sung regression cho không giới hạn lịch, đóng cả ngày, ca qua đêm và timezone thực tế. | Frontend test + backend regression/E2E. |
| KF03.5 | P1 | Regression đầy đủ ranh giới lifecycle và dependency blocker giữa Product, Version, Recipe, Menu, Program, Configuration Release, Deployment và Kiosk connectivity. | Frontend + backend; phạm vi rộng, không phải một lỗi đơn lẻ từ KF03. |
| KF03.6 | P2 | Chuẩn hóa phản hồi sau create/update/publish/deploy; phân biệt requested, published, deployed và edge-confirmed; bổ sung retry/failure guidance. | Cần audit từng workflow và role. |
| KF03/E2E | P1 | Chạy browser validation với SystemAdmin/OrgAdmin, kiểm tra deep link, realtime refresh và triển khai tới edge device thật. | Cần tài khoản/môi trường và thiết bị hoặc simulator phù hợp. |

### 8.3. Không còn nằm trong backlog của đợt này

- [x] Public success không hiển thị mã tham chiếu khó hiểu.
- [x] Public success thông báo đã tiếp nhận hồ sơ và hướng dẫn kiểm tra email/Spam/Junk mà không cam kết email chắc chắn đã giao.
- [x] Mã số thuế đã được bỏ khỏi public form; backend/shared contract vẫn optional để người dùng cập nhật sau.
- [x] Acknowledgement email chạy sau lần lưu registration đầu tiên, không gửi lại khi replay và lỗi gửi không làm submit thất bại.
- [x] File backend test gửi mail thật và hai file DOCX không thuộc danh sách cần commit.

### 8.4. Thứ tự đề xuất cho đợt tiếp theo

1. Chốt có cần durable email delivery hay tiếp tục best-effort; sau đó mới xử lý KF02.3/KF02.4.
2. Chốt chính sách timezone backend và dữ liệu `Asia/Bangkok` cũ; sau đó hoàn tất KF03.1.
3. Chọn CTA sau tạo Store trực tiếp; sau đó hoàn tất KF03.2.
4. Thiết kế readiness model trước khi triển khai KF03.3, KF03.5 và KF03.6.
5. Chạy browser/E2E và thiết bị thật sau khi các quyết định trên đã ổn định.
