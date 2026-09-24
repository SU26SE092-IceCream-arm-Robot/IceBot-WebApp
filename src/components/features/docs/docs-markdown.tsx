import type { ReactNode } from "react";

interface DocsMarkdownProps {
  content: string;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={`${token}-${index}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          key={`${token}-${index}`}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${token}-${index}`}>{token}</span>;
  });
}

function normalizeMarkdownLines(content: string): string[] {
  return content
    .replace(/\r\n?/g, "\n")
    .replace(/:\s+(-\s+)/g, ":\n$1")
    .split("\n");
}

export function DocsMarkdown({ content }: DocsMarkdownProps) {
  return (
    <div className="space-y-1.5 break-words leading-6">
      {normalizeMarkdownLines(content).map((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return <div key={`empty-${index}`} className="h-1" aria-hidden="true" />;
        }

        const headingMatch = trimmedLine.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p key={`heading-${index}`} className="pt-1 font-semibold text-foreground">
              {renderInlineMarkdown(headingMatch[1])}
            </p>
          );
        }

        const orderedItemMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (orderedItemMatch) {
          return (
            <div key={`ordered-${index}`} className="flex items-start gap-2">
              <span className="shrink-0 font-semibold text-primary" aria-hidden="true">
                {orderedItemMatch[1]}.
              </span>
              <span>{renderInlineMarkdown(orderedItemMatch[2])}</span>
            </div>
          );
        }

        const unorderedItemMatch = trimmedLine.match(/^[-*]\s+(.+)$/);
        if (unorderedItemMatch) {
          return (
            <div key={`unordered-${index}`} className="flex items-start gap-2 pl-1">
              <span className="shrink-0 text-primary" aria-hidden="true">
                •
              </span>
              <span>{renderInlineMarkdown(unorderedItemMatch[1])}</span>
            </div>
          );
        }

        return <p key={`paragraph-${index}`}>{renderInlineMarkdown(trimmedLine)}</p>;
      })}
    </div>
  );
}
