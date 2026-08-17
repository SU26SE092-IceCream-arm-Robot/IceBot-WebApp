import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicContentPageView } from "@/components/features/content-pages/public-content-page-view";
import {
  STATIC_CONTENT_PAGE_KEYS,
  STATIC_CONTENT_PAGE_METADATA,
  type StaticContentPageKey,
} from "@/types/platform/content-pages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const staticMeta = STATIC_CONTENT_PAGE_METADATA[slug as StaticContentPageKey];

  if (!staticMeta) {
    return {
      title: "Trang không tồn tại | IceBot",
    };
  }

  return {
    title: `${staticMeta.label} | IceBot - Nền tảng bán kem tự động thông minh`,
    description: staticMeta.description,
  };
}

export default async function PublicContentPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate allowed static page slugs
  const isAllowedSlug = STATIC_CONTENT_PAGE_KEYS.includes(
    slug as StaticContentPageKey,
  );

  if (!isAllowedSlug) {
    notFound();
  }

  return <PublicContentPageView slug={slug} />;
}
