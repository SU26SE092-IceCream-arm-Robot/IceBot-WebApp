import type { Metadata } from "next";

import { DocsArticle } from "@/components/features/docs/docs-article";
import { getDocsPage } from "@/lib/docs/content";

export const metadata: Metadata = {
  title: "Tài liệu IceBot",
  description:
    "Tài liệu kỹ thuật về nền tảng, vận hành, API và realtime của IceBot.",
};

export default function DocsHomePage() {
  const page = getDocsPage("");

  if (!page) return null;

  return <DocsArticle page={page} />;
}
