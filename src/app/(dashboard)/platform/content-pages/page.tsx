import type { Metadata } from "next";
import { ContentPagesListView } from "@/components/features/platform/content-pages/content-pages-list-view";

export const metadata: Metadata = {
  title: "Quản lý trang nội dung tĩnh | IceBot Platform",
  description: "Quản lý nội dung các trang thông tin tĩnh, điều khoản và chính sách hệ thống.",
};

export default function PlatformContentPagesPage() {
  return <ContentPagesListView />;
}
