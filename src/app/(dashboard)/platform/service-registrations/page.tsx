import { ServiceRegistrationsView } from "@/components/features/platform/service-registrations/service-registrations-view";

export const metadata = {
  title: "Đơn đăng ký dịch vụ | Quản trị nền tảng",
  description: "Quản lý và phê duyệt đơn đăng ký dịch vụ từ đối tác",
};

export default function ServiceRegistrationsPage() {
  return <ServiceRegistrationsView />;
}
