import type { Metadata } from "next";

import { DocsArticle } from "@/components/features/docs/docs-article";
import { getDocsPage } from "@/lib/docs/content";

export const metadata: Metadata = {
  title: "Tài liệu IceBot",
  description:
    "Hướng dẫn sử dụng Kiosk, Admin Web, Full Edge và FaiRobot Studio cùng tài liệu kỹ thuật IceBot.",
};

export default function DocsHomePage() {
  const page = getDocsPage("");

  if (!page) return null;

  return <DocsArticle page={page} />;
}
