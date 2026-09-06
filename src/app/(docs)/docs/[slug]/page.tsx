import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocsArticle } from "@/components/features/docs/docs-article";
import { DOCS_PAGES, getDocsPage } from "@/lib/docs/content";

interface DocsPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DOCS_PAGES.filter((page) => page.slug).map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocsPage(slug);

  if (!page) {
    return { title: "Không tìm thấy tài liệu | IceBot" };
  }

  return {
    title: `${page.title} | Tài liệu IceBot`,
    description: page.description,
  };
}

export default async function DocsTopicPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const page = getDocsPage(slug);

  if (!page) notFound();

  return <DocsArticle page={page} />;
}
