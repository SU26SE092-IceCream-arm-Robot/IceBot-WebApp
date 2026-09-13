import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleAlert, Info } from "lucide-react";

import { DocsCodeBlock } from "@/components/features/docs/docs-code-block";
import { cn } from "@/lib/utils";
import {
  getAdjacentDocsPages,
  getDocsHref,
  type DocsPageDefinition,
} from "@/lib/docs/content";

export function DocsArticle({ page }: { page: DocsPageDefinition }) {
  const adjacent = getAdjacentDocsPages(page.slug);

  return (
    <article className="min-w-0 pb-20">
      <header className="border-b border-border pb-8">
        <p className="text-sm font-semibold text-primary">{page.eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {page.description}
        </p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {page.readingTime}
        </p>
      </header>

      <div className="pt-4">
        {page.sections.map((section) => (
          <section key={section.id} id={section.id} className="border-b border-border py-8 last:border-b-0">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
              {section.title}
            </h2>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-4 max-w-3xl text-[15px] leading-7 text-muted-foreground sm:text-base">
                {paragraph}
              </p>
            ))}

            {section.bullets ? (
              <ul className="mt-5 max-w-3xl space-y-3">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-[15px] leading-7 text-muted-foreground sm:text-base">
                    <span className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.steps ? (
              <ol className="mt-6 max-w-3xl space-y-5">
                {section.steps.map((step, index) => (
                  <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full border border-primary/25 bg-primary/8 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1 text-[15px] leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}

            {section.codeExample ? <DocsCodeBlock {...section.codeExample} /> : null}

            {section.callout ? (
              <aside
                className={cn(
                  "mt-6 flex max-w-3xl gap-3 rounded-xl border px-4 py-4",
                  section.callout.tone === "warning"
                    ? "border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100"
                    : "border-primary/20 bg-primary/5 text-foreground",
                )}
              >
                {section.callout.tone === "warning" ? (
                  <CircleAlert className="mt-0.5 size-5 shrink-0" />
                ) : (
                  <Info className="mt-0.5 size-5 shrink-0 text-primary" />
                )}
                <div>
                  <h3 className="text-sm font-semibold">{section.callout.title}</h3>
                  <p className="mt-1 text-sm leading-6 opacity-80">{section.callout.content}</p>
                </div>
              </aside>
            ) : null}
          </section>
        ))}
      </div>

      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Điều hướng bài viết">
        {adjacent.previous ? (
          <Link
            href={getDocsHref(adjacent.previous.slug)}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-accent"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Trang trước
            </span>
            <span className="mt-2 block font-semibold text-foreground">{adjacent.previous.navigationLabel}</span>
          </Link>
        ) : <span />}
        {adjacent.next ? (
          <Link
            href={getDocsHref(adjacent.next.slug)}
            className="group rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/35 hover:bg-accent"
          >
            <span className="flex items-center justify-end gap-2 text-xs font-medium text-muted-foreground">
              Trang tiếp
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="mt-2 block font-semibold text-foreground">{adjacent.next.navigationLabel}</span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
