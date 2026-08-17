import type { Metadata } from "next";
import { ContentPageEditorView } from "@/components/features/platform/content-pages/content-page-editor-view";
import {
  STATIC_CONTENT_PAGE_METADATA,
  type StaticContentPageKey,
} from "@/types/platform/content-pages";

interface PageProps {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { key } = await params;
  const staticMeta = STATIC_CONTENT_PAGE_METADATA[key as StaticContentPageKey];
  const title = staticMeta?.label || key;

  return {
    title: `Soạn thảo: ${title} | IceBot Platform`,
    description: staticMeta?.description || "Soạn thảo và xuất bản nội dung trang.",
  };
}

export default async function PlatformContentPageEditPage({ params }: PageProps) {
  const { key } = await params;
  return <ContentPageEditorView pageKey={key} />;
}
