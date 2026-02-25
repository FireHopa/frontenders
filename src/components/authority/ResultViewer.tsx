import React, { useMemo } from "react";

type Props = {
  title?: string;
  text: string;
};

/**
 * Render "model output" in a readable way WITHOUT adding new dependencies.
 * - Supports headings (#, ##, ###)
 * - Bullet lists (-, •)
 * - Simple inline formatting: **bold**, `code`
 * - Escapes HTML to avoid injection
 */
export default function ResultViewer({ title = "Resultado", text }: Props) {
  const blocks = useMemo(() => parseBlocks(text || ""), [text]);

  return (
    <section className="w-full">
      {title ? (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-4 sm:p-6">
          {blocks.length === 0 ? (
            <div className="text-sm text-tertiary">Sem conteúdo.</div>
          ) : (
            <div className="prose prose-invert max-w-none">
              {blocks.map((b, idx) => renderBlock(b, idx))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type Block =
  | { kind: "h1" | "h2" | "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "p"; text: string }
  | { kind: "code"; text: string };

function parseBlocks(input: string): Block[] {
  const s = (input || "").replace(/\r\n/g, "\n").trim();
  if (!s) return [];

  const lines = s.split("\n");
  const out: Block[] = [];

  let paragraph: string[] = [];
  let listItems: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flushParagraph = () => {
    const t = paragraph.join(" ").trim();
    if (t) out.push({ kind: "p", text: t });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) out.push({ kind: "ul", items: listItems });
    listItems = [];
  };

  const flushCode = () => {
    const t = codeLines.join("\n").replace(/^\n+|\n+$/g, "");
    if (t) out.push({ kind: "code", text: t });
    codeLines = [];
  };

  for (const raw of lines) {
    const line = raw ?? "";

    // fenced code block
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        flushParagraph();
        flushList();
        inCode = true;
      } else {
        // closing
        flushCode();
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const h = parseHeading(line);
    if (h) {
      flushParagraph();
      flushList();
      out.push(h);
      continue;
    }

    const li = parseListItem(line);
    if (li) {
      flushParagraph();
      listItems.push(li);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    // normal text
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushCode();

  return out;
}

function parseHeading(line: string): Block | null {
  const t = line.trim();
  if (!t) return null;
  if (t.startsWith("### ")) return { kind: "h3", text: t.slice(4).trim() };
  if (t.startsWith("## ")) return { kind: "h2", text: t.slice(3).trim() };
  if (t.startsWith("# ")) return { kind: "h1", text: t.slice(2).trim() };
  return null;
}

function parseListItem(line: string): string | null {
  const t = line.trim();
  if (!t) return null;
  const m = t.match(/^[-•]\s+(.*)$/);
  if (!m) return null;
  return m[1].trim();
}

function renderBlock(b: Block, key: number) {
  if (b.kind === "h1") return <h3 key={key} className="mt-0 text-lg font-semibold">{b.text}</h3>;
  if (b.kind === "h2") return <h4 key={key} className="mt-6 text-base font-semibold">{b.text}</h4>;
  if (b.kind === "h3") return <h5 key={key} className="mt-4 text-sm font-semibold">{b.text}</h5>;

  if (b.kind === "ul") {
    return (
      <ul key={key} className="my-3 list-disc pl-6">
        {b.items.map((it, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
        ))}
      </ul>
    );
  }

  if (b.kind === "code") {
    return (
      <pre
        key={key}
        className="my-4 overflow-x-auto rounded-xl border border-border bg-[rgba(0,200,232,0.08)] p-4 text-xs leading-relaxed"
      >
        <code>{b.text}</code>
      </pre>
    );
  }

  // paragraph
  return (
    <p key={key} className="my-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }} />
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Minimal inline formatting on escaped HTML:
 * - **bold**
 * - `code`
 */
function inlineFormat(s: string) {
  let x = escapeHtml(s);

  // `code`
  x = x.replace(/`([^`]+)`/g, (_m, g1) => `<code class="rounded bg-[rgba(0,200,232,0.12)] px-1 py-0.5 text-[0.85em]">${g1}</code>`);

  // **bold**
  x = x.replace(/\*\*([^*]+)\*\*/g, (_m, g1) => `<strong>${g1}</strong>`);

  // line breaks: if someone used \n inside a paragraph block
  x = x.replace(/\n/g, "<br/>");

  return x;
}
