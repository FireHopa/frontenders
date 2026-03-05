import React, { useMemo } from "react";
import { Lightbulb, AlertTriangle, CheckCircle, Star, MessageCircle, Quote } from "lucide-react";

type Props = {
  title?: string;
  text: string;
};

export default function ResultViewer({ title = "Resultado", text }: Props) {
  // Tenta converter o texto para JSON (Nova Arquitetura de Blocos)
  const parsedJson = useMemo(() => {
    try {
      const data = JSON.parse(text || "{}");
      if (data && Array.isArray(data.blocos)) {
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [text]);

  // Se não for JSON (resultados antigos), usa o parseador de Markdown legado
  const legacyBlocks = useMemo(() => {
    if (parsedJson) return [];
    return parseBlocks(text || "");
  }, [text, parsedJson]);

  // RENDERIZAÇÃO DA ARQUITETURA EM BLOCOS (ULTRA GLOW-UP)
  if (parsedJson) {
    return (
      <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="rounded-[2.5rem] border border-border bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
          
          {/* Cabeçalho Premium */}
          <div className="relative bg-gradient-to-b from-muted/50 to-transparent border-b border-border/50 p-8 sm:p-12">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-google-blue/40 to-transparent"></div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight max-w-4xl">
              {parsedJson.titulo_da_tela || title}
            </h2>
          </div>

          {/* Renderização dos Blocos Mágicos */}
          <div className="p-8 sm:p-12 space-y-12">
            {parsedJson.blocos.map((bloco: any, idx: number) => (
              <React.Fragment key={idx}>
                {renderJsonBlock(bloco, idx)}
              </React.Fragment>
            ))}
          </div>
          
        </div>
      </section>
    );
  }

  // RENDERIZAÇÃO LEGADA (MARKDOWN ANTIGO)
  return (
    <section className="w-full">
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="p-6 sm:p-8">
          {legacyBlocks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sem conteúdo.</div>
          ) : (
            <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
              {legacyBlocks.map((b, idx) => renderLegacyBlock(b, idx))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FUNÇÕES DE RENDERIZAÇÃO DOS BLOCOS JSON (A MÁGICA VISUAL PREMIUM)
// ============================================================================

function renderJsonBlock(bloco: any, key: number) {
  const { tipo, conteudo } = bloco;

  switch (tipo) {
    case "highlight": {
      // DESIGN CLARO, VIBRANTE E ULTRA LEGÍVEL
      let Icon = Lightbulb;
      let containerClass = "bg-amber-50 border-amber-200 dark:bg-[#2a2416] dark:border-amber-900/60";
      let iconWrapper = "bg-amber-200/50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400";
      let titleClass = "text-amber-900 dark:text-amber-300";
      let textClass = "text-amber-950/90 dark:text-amber-100/90";

      if (conteudo.icone === "alert") {
        Icon = AlertTriangle;
        containerClass = "bg-red-50 border-red-200 dark:bg-[#2a1616] dark:border-red-900/60";
        iconWrapper = "bg-red-200/50 dark:bg-red-500/20 text-red-600 dark:text-red-400";
        titleClass = "text-red-900 dark:text-red-300";
        textClass = "text-red-950/90 dark:text-red-100/90";
      } else if (conteudo.icone === "check") {
        Icon = CheckCircle;
        containerClass = "bg-emerald-50 border-emerald-200 dark:bg-[#162a20] dark:border-emerald-900/60";
        iconWrapper = "bg-emerald-200/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
        titleClass = "text-emerald-900 dark:text-emerald-300";
        textClass = "text-emerald-950/90 dark:text-emerald-100/90";
      } else if (conteudo.icone === "star") {
        Icon = Star;
        containerClass = "bg-blue-50 border-blue-200 dark:bg-[#16202a] dark:border-blue-900/60";
        iconWrapper = "bg-blue-200/50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400";
        titleClass = "text-blue-900 dark:text-blue-300";
        textClass = "text-blue-950/90 dark:text-blue-100/90";
      }

      return (
        <div className={`my-8 rounded-3xl border ${containerClass} p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start gap-5 transition-all`}>
           <div className={`shrink-0 p-3.5 rounded-full ${iconWrapper}`}>
             <Icon className="h-7 w-7" strokeWidth={2.5} />
           </div>
           <div className="pt-1">
             {conteudo.titulo && (
               <h4 className={`font-extrabold text-xl mb-2 tracking-tight ${titleClass}`}>
                 {conteudo.titulo}
               </h4>
             )}
             <p className={`text-base sm:text-lg leading-relaxed font-medium ${textClass}`}>
               {conteudo.texto}
             </p>
           </div>
        </div>
      );
    }

    case "timeline": {
      if (!conteudo.passos || !Array.isArray(conteudo.passos)) return null;
      return (
        <div className="my-10 pl-2 sm:pl-4">
          <div className="relative border-l-[3px] border-muted/60 space-y-8 py-2">
            {conteudo.passos.map((passo: string, i: number) => (
              <div key={i} className="relative pl-10 group">
                {/* Marcador Elegante */}
                <div className="absolute -left-[11px] top-4 flex h-5 w-5 items-center justify-center rounded-full bg-background border-[4px] border-google-blue ring-4 ring-background transition-all group-hover:scale-125 group-hover:border-google-blue shadow-sm"></div>
                {/* Card Flutuante */}
                <div 
                  className="bg-card hover:bg-muted/30 border border-border/60 hover:border-google-blue/30 rounded-2xl p-6 shadow-sm transition-all text-base leading-relaxed text-foreground/90" 
                  dangerouslySetInnerHTML={{ __html: inlineFormat(passo) }} 
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "quote": {
      return (
        <div className="relative my-10 bg-card border border-border/60 rounded-[2rem] p-8 sm:p-12 overflow-hidden shadow-sm group">
          {/* Ícone de Marca d'água gigante */}
          <Quote className="absolute -top-6 -left-6 h-40 w-40 text-muted/30 -rotate-12 transition-transform group-hover:rotate-0 duration-700 ease-out" />
          
          <div className="relative z-10 pl-4 sm:pl-8">
            <p className="font-serif text-2xl sm:text-3xl italic leading-relaxed text-foreground/90">
              "{conteudo.texto}"
            </p>
            {conteudo.autor && (
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-12 bg-google-blue/50"></div>
                <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                  {conteudo.autor}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    case "faq": {
      if (!conteudo.perguntas || !Array.isArray(conteudo.perguntas)) return null;
      return (
        <div className="my-10 space-y-8">
          {conteudo.perguntas.map((q: any, i: number) => (
            <div key={i} className="group relative pl-8">
              {/* Linha de recuo em Gradiente (Efeito cascata) */}
              <div className="absolute left-0 top-1 bottom-0 w-1 bg-gradient-to-b from-google-blue/40 to-transparent rounded-full opacity-40 group-hover:opacity-100 transition-opacity"></div>
              
              <h4 className="font-bold text-xl text-foreground tracking-tight flex items-start gap-3 mb-3">
                <span className="text-google-blue shrink-0 mt-0.5">Q.</span> 
                {q.pergunta}
              </h4>
              <p 
                className="text-lg text-muted-foreground leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: inlineFormat(q.resposta) }} 
              />
            </div>
          ))}
        </div>
      );
    }

    case "markdown":
    default: {
      // Formatação primorosa para texto normal
      const mBlocks = parseBlocks(conteudo.texto || "");
      return (
        <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none text-foreground/80 leading-relaxed font-normal marker:text-google-blue/70">
          {mBlocks.map((b, i) => renderLegacyBlock(b, i))}
        </div>
      );
    }
  }
}

// ============================================================================
// CÓDIGO LEGADO DO MARKDOWN (MANTIDO PARA RETROCOMPATIBILIDADE)
// ============================================================================

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

    if (line.trim().startsWith("```")) {
      if (!inCode) {
        flushParagraph();
        flushList();
        inCode = true;
      } else {
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

function renderLegacyBlock(b: Block, key: number) {
  if (b.kind === "h1") return <h3 key={key} className="mt-10 mb-5 text-2xl font-extrabold text-foreground tracking-tight">{b.text}</h3>;
  if (b.kind === "h2") return <h4 key={key} className="mt-8 mb-4 text-xl font-bold text-foreground/90 tracking-tight">{b.text}</h4>;
  if (b.kind === "h3") return <h5 key={key} className="mt-6 mb-3 text-lg font-semibold text-foreground/80">{b.text}</h5>;

  if (b.kind === "ul") {
    return (
      <ul key={key} className="my-6 space-y-3">
        {b.items.map((it, i) => (
          <li key={i} className="flex items-start gap-3 relative pl-6">
            <span className="absolute left-0 top-2.5 h-1.5 w-1.5 rounded-full bg-google-blue/60 shrink-0 shadow-sm"></span>
            <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} />
          </li>
        ))}
      </ul>
    );
  }

  if (b.kind === "code") {
    return (
      <pre
        key={key}
        className="my-6 overflow-x-auto rounded-2xl border border-border/50 bg-muted/30 p-5 text-sm leading-relaxed shadow-sm"
      >
        <code>{b.text}</code>
      </pre>
    );
  }

  return (
    <p key={key} className="my-5 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(b.text) }} />
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

function inlineFormat(s: string) {
  let x = escapeHtml(s);
  x = x.replace(/`([^`]+)`/g, (_m, g1) => `<code class="rounded-md bg-muted/60 px-1.5 py-0.5 text-[0.9em] font-mono text-google-blue font-medium">${g1}</code>`);
  x = x.replace(/\*\*([^*]+)\*\*/g, (_m, g1) => `<strong class="font-bold text-foreground">${g1}</strong>`);
  x = x.replace(/\n/g, "<br/>");
  return x;
}