import * as React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessCore3D } from "@/components/authority/BusinessCore3D";
import { Markdown } from "@/components/markdown/Markdown";
import { api, getClientId } from "@/services/robots";
import { authorityAgentByKey } from "@/constants/authorityAgents";
import { tasksByAgentKey } from "@/constants/authorityTasks";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Sparkles, RotateCcw } from "lucide-react";

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

  const coreState = busy ? "running" : filled > 0.35 ? "ready" : "idle";

  
  const taskLabels = React.useMemo(() => {
    const tasks = tasksByAgentKey(agentKey);
    if (tasks.length > 0) return tasks.map((t) => t.title);
    return ICEBREAKERS_GENERIC;
  }, [agentKey]);

  const half = React.useMemo(() => Math.ceil(taskLabels.length / 2), [taskLabels.length]);
  const leftLabels = React.useMemo(() => taskLabels.slice(0, half), [taskLabels, half]);
  const rightLabels = React.useMemo(() => taskLabels.slice(half), [taskLabels, half]);


  async function runIcebreaker(label: string, fromX: number, fromY: number) {
    if (!agent) return;
    if (busy) return;

    if (!nucleus || Object.keys(nucleus).length === 0) {
      setErr("Preencha o núcleo da empresa antes de executar um agente.");
      return;
    }

    setErr(null);
    setBusy(true);

    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    setAnim({ id, label, fromX, fromY });

    try {
      // deixa a animação acontecer: chip expande e “entra” no núcleo
      await new Promise((r) => setTimeout(r, 650));

      const payload = {
        client_id: clientId,
        agent_key: agent.key,
        nucleus: { ...(nucleus ?? {}), requested_task: label },
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
                resultado em markdown
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
                {/* Layout estável: colunas esquerda / núcleo / direita (sem linhas e sem sobreposição) */}
                <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] gap-6 p-6">
                  {/* coluna esquerda */}
                  <div className="flex min-w-0 flex-col items-end gap-3 overflow-y-auto pr-1">
                    {leftLabels.map((label) => (
                      <button
                        key={`l-${label}`}
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          runIcebreaker(label, rect.left + rect.width / 2, rect.top + rect.height / 2);
                        }}
                        className={cn(
                          "w-full max-w-[260px] rounded-2xl border bg-background/60 px-3 py-2 text-left text-xs shadow-soft",
                          "backdrop-blur hover:bg-[rgba(0,200,232,0.10)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          busy ? "cursor-not-allowed opacity-70" : "cursor-pointer"
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
                  <div className="grid place-items-center">
                    <div className="relative aspect-square w-[min(72vmin,720px)] max-w-[720px]">
                      <div className="absolute inset-0 rounded-[44px] border bg-background/20 shadow-soft" />
                      <div className="absolute inset-0 p-2">
                        <BusinessCore3D progress={filled} state={coreState as any} className="h-full w-full" />
                      </div>

                      {busy ? (
                        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border bg-background/70 p-3 text-xs shadow-soft backdrop-blur">
                          <div className="flex items-center gap-2 font-medium">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            processando…
                          </div>
                          <div className="mt-1 text-muted-foreground">Núcleo girando + agente montando a saída em markdown.</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* coluna direita */}
                  <div className="flex min-w-0 flex-col items-start gap-3 overflow-y-auto pl-1">
                    {rightLabels.map((label) => (
                      <button
                        key={`r-${label}`}
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          runIcebreaker(label, rect.left + rect.width / 2, rect.top + rect.height / 2);
                        }}
                        className={cn(
                          "w-full max-w-[260px] rounded-2xl border bg-background/60 px-3 py-2 text-left text-xs shadow-soft",
                          "backdrop-blur hover:bg-[rgba(0,200,232,0.10)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          busy ? "cursor-not-allowed opacity-70" : "cursor-pointer"
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

                {/* animação do chip: expande pro centro e encolhe "dentro" do núcleo */}
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
              className="rounded-3xl border bg-background/40 p-5 shadow-card"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-google-blue" />
                <div className="text-sm font-semibold">Resposta do {agent.label}</div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <Markdown content={resultMd} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
