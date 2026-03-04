import * as React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BusinessCore3D } from "@/components/authority/BusinessCore3D";
import ResultViewer from "@/components/authority/ResultViewer";
import { api, getClientId } from "@/services/robots";
import { authorityAgentByKey } from "@/constants/authorityAgents";
import { tasksByAgentKey } from "@/constants/authorityTasks";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Sparkles, RotateCcw, Printer, ChevronDown, FileText } from "lucide-react";

const STORAGE_KEY = "ori_authority_nucleus_v1";

function loadStoredNucleus(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const ICEBREAKERS_GENERIC = [
  "Gere um plano rápido em tópicos",
  "Crie um checklist de execução",
  "Liste 10 ideias práticas",
  "Monte um roteiro passo a passo",
  "Escreva exemplos prontos para copiar",
  "Aponte melhorias e ajustes finos",
  "Crie variações e alternativas",
  "Identifique riscos e correções",
];

type ViewMode = "mindmap" | "result";

// ============================================================================
// MOTOR DE EXPORTAÇÃO INTELIGENTE (HTML, WhatsApp, TXT, MD)
// ============================================================================
export function exportFormat(raw: string, format: "md" | "whatsapp" | "txt" | "html"): string {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.blocos)) throw new Error("Not JSON");

    let out = "";

    if (format === "html") {
      out += `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">`;
      if (data.titulo_da_tela) {
        out += `<h1 style="color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px;">${data.titulo_da_tela}</h1>`;
      }
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          let html = b.conteudo.texto
            .replace(/^### (.*$)/gim, '<h4 style="color: #444; margin-top: 16px;">$1</h4>')
            .replace(/^## (.*$)/gim, '<h3 style="color: #333; margin-top: 20px;">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 style="color: #222; margin-top: 24px;">$1</h2>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\n\n/gim, '</p><p style="margin-bottom: 12px;">')
            .replace(/\n/gim, '<br>');
          out += `<p style="margin-bottom: 12px;">${html}</p>`;
        } else if (b.tipo === "highlight") {
          out += `<div style="background-color: #f8f9fa; border-left: 4px solid #00c8e8; padding: 15px; margin: 20px 0; border-radius: 4px;">`;
          if (b.conteudo.titulo) out += `<strong style="display: block; font-size: 16px; margin-bottom: 8px; color: #009eb8;">💡 ${b.conteudo.titulo}</strong>`;
          out += `<span style="color: #333;">${b.conteudo.texto}</span></div>`;
        } else if (b.tipo === "timeline") {
          if (b.conteudo.passos) {
            out += `<ul style="list-style-type: none; padding-left: 0; margin: 20px 0;">`;
            b.conteudo.passos.forEach((p: string) => {
              let html = p.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
              out += `<li style="margin-bottom: 10px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; top: 0; color: #00c8e8;">•</span>${html}</li>`;
            });
            out += `</ul>`;
          }
        } else if (b.tipo === "quote") {
          out += `<blockquote style="font-style: italic; border-left: 4px solid #ccc; padding: 10px 20px; margin: 20px 0; color: #555; background: #f9f9f9;">`;
          out += `"${b.conteudo.texto}"`;
          if (b.conteudo.autor) out += `<br><strong style="display: block; margin-top: 10px; font-style: normal; color: #333;">— ${b.conteudo.autor}</strong>`;
          out += `</blockquote>`;
        } else if (b.tipo === "faq") {
          if (b.conteudo.perguntas) {
            out += `<div style="margin: 20px 0;">`;
            b.conteudo.perguntas.forEach((q: any) => {
              let htmlResp = q.resposta.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
              out += `<div style="margin-bottom: 15px;">`;
              out += `<strong style="display: block; font-size: 15px; margin-bottom: 5px; color: #222;">❓ ${q.pergunta}</strong>`;
              out += `<p style="margin: 0; padding-left: 24px; color: #444;">${htmlResp}</p>`;
              out += `</div>`;
            });
            out += `</div>`;
          }
        }
      });
      out += `</div>`;
      return out;
    }

    if (format === "whatsapp") {
      if (data.titulo_da_tela) out += `*${data.titulo_da_tela.toUpperCase()}*\n\n`;
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          let text = b.conteudo.texto
            .replace(/^### (.*$)/gim, '*$1*')
            .replace(/^## (.*$)/gim, '*$1*')
            .replace(/^# (.*$)/gim, '*$1*')
            .replace(/\*\*/g, '*');
          out += `${text}\n\n`;
        } else if (b.tipo === "highlight") {
          out += `💡 *${(b.conteudo.titulo || 'Atenção').toUpperCase()}*\n_${b.conteudo.texto}_\n\n`;
        } else if (b.tipo === "timeline") {
          if (b.conteudo.passos) {
            b.conteudo.passos.forEach((p: string) => {
              let text = p.replace(/\*\*/g, '*');
              out += `🔹 ${text}\n`;
            });
            out += "\n";
          }
        } else if (b.tipo === "quote") {
          out += `"${b.conteudo.texto}"\n`;
          if (b.conteudo.autor) out += `— _${b.conteudo.autor}_\n`;
          out += "\n";
        } else if (b.tipo === "faq") {
          if (b.conteudo.perguntas) {
            b.conteudo.perguntas.forEach((q: any) => {
              let text = q.resposta.replace(/\*\*/g, '*');
              out += `❓ *${q.pergunta}*\n${text}\n\n`;
            });
          }
        }
      });
      return out.trim();
    }

    if (format === "txt") {
      if (data.titulo_da_tela) out += `${data.titulo_da_tela.toUpperCase()}\n`;
      if (data.titulo_da_tela) out += `${"=".repeat(data.titulo_da_tela.length)}\n\n`;
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          let text = b.conteudo.texto
            .replace(/^### (.*$)/gim, '$1')
            .replace(/^## (.*$)/gim, '$1')
            .replace(/^# (.*$)/gim, '$1')
            .replace(/\*\*/g, '');
          out += `${text}\n\n`;
        } else if (b.tipo === "highlight") {
          out += `>> DICA: ${b.conteudo.titulo ? b.conteudo.titulo.toUpperCase() : 'ATENÇÃO'}\n${b.conteudo.texto}\n\n`;
        } else if (b.tipo === "timeline") {
          if (b.conteudo.passos) {
            b.conteudo.passos.forEach((p: string) => {
              let text = p.replace(/\*\*/g, '');
              out += `- ${text}\n`;
            });
            out += "\n";
          }
        } else if (b.tipo === "quote") {
          out += `"${b.conteudo.texto}"\n`;
          if (b.conteudo.autor) out += `— ${b.conteudo.autor}\n`;
          out += "\n";
        } else if (b.tipo === "faq") {
          if (b.conteudo.perguntas) {
            b.conteudo.perguntas.forEach((q: any) => {
              let text = q.resposta.replace(/\*\*/g, '');
              out += `P: ${q.pergunta}\nR: ${text}\n\n`;
            });
          }
        }
      });
      return out.trim();
    }

    if (data.titulo_da_tela) out += `# ${data.titulo_da_tela}\n\n`;
    data.blocos.forEach((b: any) => {
      if (b.tipo === "markdown") {
        out += `${b.conteudo.texto}\n\n`;
      } else if (b.tipo === "highlight") {
        out += `💡 **${b.conteudo.titulo || 'Atenção'}**\n${b.conteudo.texto}\n\n`;
      } else if (b.tipo === "timeline") {
        if (b.conteudo.passos) {
          b.conteudo.passos.forEach((p: string) => out += `• ${p}\n`);
          out += "\n";
        }
      } else if (b.tipo === "quote") {
        out += `> "${b.conteudo.texto}"\n`;
        if (b.conteudo.autor) out += `> — ${b.conteudo.autor}\n`;
        out += "\n";
      } else if (b.tipo === "faq") {
        if (b.conteudo.perguntas) {
          b.conteudo.perguntas.forEach((q: any) => {
            out += `**P: ${q.pergunta}**\nR: ${q.resposta}\n\n`;
          });
        }
      }
    });
    return out.trim();

  } catch (e) {
    if (format === "html") return `<pre style="white-space: pre-wrap; font-family: sans-serif;">${raw}</pre>`;
    if (format === "txt") return raw.replace(/\*\*/g, '').replace(/^#+ /gm, '');
    if (format === "whatsapp") return raw.replace(/\*\*/g, '*').replace(/^#+ /gm, '*');
    return raw;
  }
}

export default function AuthorityAgentChatPage() {
  const nav = useNavigate();
  const { agentKey = "" } = useParams<{ agentKey: string }>();
  const agent = authorityAgentByKey(agentKey);

  const clientId = React.useMemo(() => getClientId(), []);
  const nucleus = React.useMemo(() => (typeof window === "undefined" ? {} : loadStoredNucleus()), []);

  const [mode, setMode] = React.useState<ViewMode>("mindmap");
  const [resultMd, setResultMd] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [anim, setAnim] = React.useState<null | { id: string; label: string; fromX: number; fromY: number }>(null);

  const [suggestingFor, setSuggestingFor] = React.useState<string | null>(null);
  const [themes, setThemes] = React.useState<string[]>([]);
  const [loadingThemes, setLoadingThemes] = React.useState(false);
  const [customTheme, setCustomTheme] = React.useState("");
  
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);

  const filled = React.useMemo(() => {
    const keys = Object.keys(nucleus ?? {});
    if (!keys.length) return 0;
    let good = 0;
    for (const k of keys) {
      const v = String((nucleus as any)[k] ?? "").trim();
      if (v && v !== "não informado") good++;
    }
    return Math.min(1, good / 10);
  }, [nucleus]);

  React.useEffect(() => {
    if (!agent) nav("/authority-agents");
  }, [agent, nav]);

  const coreState = busy || loadingThemes ? "running" : filled > 0.35 ? "ready" : "idle";

  const taskLabels = React.useMemo(() => {
    const tasks = tasksByAgentKey(agentKey);
    if (tasks.length > 0) return tasks.map((t) => t.title);
    return ICEBREAKERS_GENERIC;
  }, [agentKey]);

  const half = React.useMemo(() => Math.ceil(taskLabels.length / 2), [taskLabels.length]);
  const leftLabels = React.useMemo(() => taskLabels.slice(0, half), [taskLabels, half]);
  const rightLabels = React.useMemo(() => taskLabels.slice(half), [taskLabels, half]);

  async function handleIcebreakerClick(label: string, fromX: number, fromY: number) {
    const textoBotao = label.toUpperCase();
    const precisaDeTema = textoBotao.includes("FAQ") || textoBotao.includes("BLOG");

    if (precisaDeTema) {
      setSuggestingFor(label);
      setLoadingThemes(true);
      setErr(null);
      setCustomTheme("");
      try {
        const res = await api.authorityAgents.suggestThemes({
          agent_key: agent!.key,
          task: label,
          nucleus: nucleus ?? {}
        });
        setThemes(res.themes);
      } catch (e: any) {
        setErr("Falha ao gerar sugestões de temas.");
        setThemes([]);
      } finally {
        setLoadingThemes(false);
      }
    } else {
      runIcebreaker(label, label, fromX, fromY);
    }
  }

  async function runIcebreaker(taskLabel: string, themeContext: string, fromX: number, fromY: number) {
    if (!agent) return;
    if (busy) return;

    if (!nucleus || Object.keys(nucleus).length === 0) {
      setErr("Preencha o núcleo da empresa antes de executar um agente.");
      return;
    }

    setSuggestingFor(null);
    setErr(null);
    setBusy(true);

    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    setAnim({ id, label: themeContext, fromX, fromY });

    try {
      await new Promise((r) => setTimeout(r, 650));

      const payload = {
        client_id: clientId,
        agent_key: agent.key,
        nucleus: { 
          ...(nucleus ?? {}), 
          requested_task: taskLabel,
          selected_theme: themeContext
        },
      };

      const out = await api.authorityAgents.runGlobal(payload);

      setResultMd((out as any).output ?? (out as any).output_text ?? "Sem saída.");
      setMode("result");
    } catch (e: any) {
      const msg = e?.detail?.message || e?.message || "Falha ao executar agente.";
      setErr(String(msg));
    } finally {
      setAnim(null);
      setBusy(false);
    }
  }

  function handlePrint() {
    if (!resultMd || !agent) return;
    const htmlContent = exportFormat(resultMd, "html");
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permita pop-ups neste site para imprimir/salvar PDF.");
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Resultado - ${agent.name || agent.label}</title>
          <meta charset="utf-8">
      </head>
      <body>
          ${htmlContent}
          <script>
              window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); }
              }
          </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  function downloadFile(format: "md" | "txt" | "doc" | "pdf") {
    if (format === "pdf") {
      handlePrint();
      setShowDownloadMenu(false);
      return;
    }

    const rawText = String(resultMd ?? "");
    if (!rawText) return;
    
    let mimeType = "text/plain;charset=utf-8";
    let fileContent = "";
    
    if (format === "doc") {
      mimeType = "application/msword";
      const htmlContent = exportFormat(rawText, "html");
      fileContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${htmlContent}</body></html>`;
    } else {
      fileContent = exportFormat(rawText, format as any);
    }

    const blob = new Blob([format === "doc" ? '\ufeff' + fileContent : fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agent?.key || 'agente'}-resultado.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }

  if (!agent) return null;

  return (
    <div className="relative min-h-[calc(100dvh-1px)]">
      <Particles className="pointer-events-none absolute inset-0 opacity-35" />

      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="outline" className="h-10" onClick={() => nav(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-background/40 shadow-soft">
            <agent.Icon className="h-5 w-5 text-google-blue" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-xl font-semibold tracking-tight">{agent.name}</div>
            <div className="truncate text-sm text-muted-foreground">{agent.desc}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {mode === "mindmap" ? (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                execute via mapa mental
              </Badge>
            ) : (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                resultado estruturado
              </Badge>
            )}

            <Link to="/authority-agents">
              <Button variant="outline" className="h-10">
                Editar núcleo
              </Button>
            </Link>

            {mode === "result" ? (
              <Button
                variant="outline"
                className="h-10"
                onClick={() => {
                  setMode("mindmap");
                  setResultMd("");
                  setErr(null);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Novo quebra-gelo
              </Button>
            ) : null}
          </div>
        </div>

        {err ? <div className="mb-4 text-sm text-destructive">{err}</div> : null}

        <AnimatePresence mode="wait">
          {mode === "mindmap" ? (
            <motion.div
              key="mindmap"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="relative overflow-hidden rounded-3xl border bg-background/30 shadow-card"
              style={{ height: "calc(100dvh - 160px)" }}
            >
              
              <div className="h-full w-full">
                <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] gap-6 p-6">
                  {/* coluna esquerda */}
                  <div className="flex min-w-0 flex-col items-end gap-3 overflow-y-auto pr-1">
                    {leftLabels.map((label) => (
                      <button
                        key={`l-${label}`}
                        type="button"
                        disabled={busy || loadingThemes}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          handleIcebreakerClick(label, rect.left + rect.width / 2, rect.top + rect.height / 2);
                        }}
                        className={cn(
                          "w-full max-w-[260px] rounded-2xl border bg-background/60 px-3 py-2 text-left text-xs shadow-soft",
                          "backdrop-blur hover:bg-[rgba(0,200,232,0.10)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          (busy || loadingThemes) ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2">{label}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* núcleo central */}
                  <div className="grid place-items-center relative">
                    <div className="relative aspect-square w-[min(72vmin,720px)] max-w-[720px]">
                      <div className="absolute inset-0 rounded-[44px] border bg-background/20 shadow-soft" />
                      <div className="absolute inset-0 p-2">
                        <BusinessCore3D progress={filled} state={coreState as any} className="h-full w-full" />
                      </div>

                      {busy && !suggestingFor ? (
                        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border bg-background/70 p-3 text-xs shadow-soft backdrop-blur">
                          <div className="flex items-center gap-2 font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            processando…
                          </div>
                          <div className="mt-1 text-muted-foreground">O agente está a arquitetar o ecrã com blocos de layout...</div>
                        </div>
                      ) : null}

                      {/* OVERLAY DE TEMAS */}
                      <AnimatePresence>
                        {suggestingFor && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-background/90 backdrop-blur-md rounded-[44px] border shadow-xl"
                          >
                            {loadingThemes ? (
                              <div className="flex flex-col items-center gap-4 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-google-blue mx-auto" />
                                <p className="text-sm font-medium text-muted-foreground">A ler o núcleo e a gerar temas...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-4 w-full max-w-sm">
                                <div className="text-center font-semibold text-lg">Qual o foco do {suggestingFor}?</div>
                                <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                                  {themes.map((t, idx) => (
                                    <Button key={idx} variant="secondary" className="justify-start text-left h-auto py-3 whitespace-normal" onClick={() => runIcebreaker(suggestingFor, t, window.innerWidth/2, window.innerHeight/2)}>
                                      <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-google-blue" />
                                      <span>{t}</span>
                                    </Button>
                                  ))}
                                  <Button variant="secondary" className="justify-start text-left py-3" onClick={() => runIcebreaker(suggestingFor, "Surpreenda-me", window.innerWidth/2, window.innerHeight/2)}>
                                    <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-google-yellow" /> 
                                    <span>Surpreenda-me (Tema Geral)</span>
                                  </Button>
                                </div>
                                <div className="flex gap-2 items-center mt-2 border-t pt-4">
                                  <Input 
                                    placeholder="Ou digite o seu tema..." 
                                    value={customTheme} 
                                    onChange={(e) => setCustomTheme(e.target.value)} 
                                    className="bg-background"
                                  />
                                  <Button size="icon" disabled={!customTheme.trim()} onClick={() => customTheme.trim() && runIcebreaker(suggestingFor, customTheme, window.innerWidth/2, window.innerHeight/2)}>
                                    <ArrowLeft className="h-4 w-4 rotate-180" />
                                  </Button>
                                </div>
                                <Button variant="ghost" className="mt-2 text-xs text-muted-foreground" onClick={() => setSuggestingFor(null)}>Cancelar e voltar</Button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* coluna direita */}
                  <div className="flex min-w-0 flex-col items-start gap-3 overflow-y-auto pl-1">
                    {rightLabels.map((label) => (
                      <button
                        key={`r-${label}`}
                        type="button"
                        disabled={busy || loadingThemes}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          handleIcebreakerClick(label, rect.left + rect.width / 2, rect.top + rect.height / 2);
                        }}
                        className={cn(
                          "w-full max-w-[260px] rounded-2xl border bg-background/60 px-3 py-2 text-left text-xs shadow-soft",
                          "backdrop-blur hover:bg-[rgba(0,200,232,0.10)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          (busy || loadingThemes) ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2">{label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* animação do chip */}
                <AnimatePresence>
                  {anim ? (
                    <motion.div
                      key={anim.id}
                      initial={{ opacity: 0, scale: 0.9, x: anim.fromX, y: anim.fromY, position: "fixed" as any, zIndex: 60 }}
                      animate={{
                        opacity: 1,
                        scale: [1, 1.08, 0.08],
                        x: [anim.fromX, window.innerWidth / 2, window.innerWidth / 2],
                        y: [anim.fromY, window.innerHeight / 2, window.innerHeight / 2],
                      }}
                      exit={{ opacity: 0, scale: 0.05 }}
                      transition={{ times: [0, 0.6, 1], duration: 0.75, ease: "easeInOut" }}
                      className="pointer-events-none"
                    >
                      <div className="max-w-[280px] rounded-2xl border bg-background/80 px-3 py-2 text-xs shadow-card backdrop-blur">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-google-blue" />
                          <span className="line-clamp-2">{anim.label}</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-google-blue" />
                  <div className="text-sm font-semibold text-foreground">Ação concluída com sucesso!</div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-card shadow-sm rounded-xl h-9 px-4" 
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    >
                      <FileText className="h-4 w-4 mr-2" /> 
                      Baixar <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                    </Button>
                    
                    <AnimatePresence>
                      {showDownloadMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 mt-2 w-40 bg-popover border border-border rounded-xl shadow-lg z-50 flex flex-col p-1.5 overflow-hidden"
                          >
                            <button onClick={() => downloadFile("pdf")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📄 PDF</button>
                            <button onClick={() => downloadFile("doc")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📝 Word (.doc)</button>
                            <button onClick={() => downloadFile("txt")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📃 Texto (.txt)</button>
                            <button onClick={() => downloadFile("md")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">🛠️ Markdown</button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-card shadow-sm rounded-xl h-9 px-4" 
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="bg-[#25D366] text-white shadow-sm rounded-xl hover:bg-[#1EBE5D] border-none h-9 px-4" 
                    onClick={() => {
                      const cleanText = exportFormat(resultMd, "whatsapp");
                      const encodedText = encodeURIComponent(cleanText);
                      window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <svg className="h-4 w-4 mr-2 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    Encaminhar
                  </Button>
                </div>
              </div>

              {/* RENDERIZADOR NOVO (ARQUITETURA DE BLOCOS) */}
              <ResultViewer title={agent.name} text={resultMd} />
              
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}