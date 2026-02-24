import * as React from "react";
import { Timer, CheckCircle2, Play, Edit2, Copy, X, BrainCircuit, ShieldCheck, Link2, Sparkles, MessageSquareDashed } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, getClientId } from "@/services/robots";
import { AUTHORITY_AGENTS, type AuthorityAgentDef } from "@/constants/authorityAgents";
import { tasksByAgentKey } from "@/constants/authorityTasks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { transitions, fadeUp } from "@/lib/motion";
import { Markdown } from "@/components/markdown/Markdown";
import { Particles } from "@/components/effects/Particles";

function formatRemaining(sec: number) {
  if (sec <= 0) return "Pronto";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 60) return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

const CORE_GROUPS = [
  { title: "Fundação", icon: BrainCircuit, fields: [
      { key: "company_name", label: "Empresa", kind: "input" },
      { key: "city_state", label: "Local", kind: "input" },
      { key: "main_audience", label: "Público", kind: "textarea" },
      { key: "services_products", label: "Oferta", kind: "textarea" },
  ]},
  { title: "Regras e Provas", icon: ShieldCheck, fields: [
      { key: "real_differentials", label: "Diferenciais", kind: "textarea" },
      { key: "restrictions", label: "Restrições", kind: "textarea" },
      { key: "forbidden_content", label: "Proibido", kind: "textarea" },
      { key: "reviews", label: "Avaliações", kind: "textarea" },
      { key: "testimonials", label: "Depoimentos", kind: "textarea" },
      { key: "usable_links_texts", label: "Links Úteis", kind: "textarea" },
  ]},
  { title: "Ecossistema Digital", icon: Link2, fields: [
      { key: "site", label: "Site", kind: "input" },
      { key: "instagram", label: "Instagram", kind: "input" },
      { key: "linkedin", label: "LinkedIn", kind: "input" },
      { key: "youtube", label: "YouTube", kind: "input" },
      { key: "tiktok", label: "TikTok", kind: "input" },
  ]},
];

const STORAGE_KEY = "ori_authority_nucleus_v1";
const COOLDOWNS_KEY = "ori_authority_cooldowns_v1"; // Chave para salvar os cooldowns!

// Função para ler o cooldown ao recarregar a página
function loadCooldowns(): Record<string, number> {
  try {
    const stored = JSON.parse(localStorage.getItem(COOLDOWNS_KEY) || "{}");
    const now = Date.now();
    const active: Record<string, number> = {};
    for (const [key, exp] of Object.entries(stored)) {
      const remaining = Math.floor((Number(exp) - now) / 1000);
      if (remaining > 0) active[key] = remaining;
    }
    return active;
  } catch {
    return {};
  }
}

// Função para salvar a data de validade de um cooldown
function saveCooldown(agentKey: string, seconds: number) {
  try {
    const stored = JSON.parse(localStorage.getItem(COOLDOWNS_KEY) || "{}");
    stored[agentKey] = Date.now() + seconds * 1000;
    localStorage.setItem(COOLDOWNS_KEY, JSON.stringify(stored));
  } catch {}
}

export default function AuthorityAgentsPage() {
  const clientId = React.useMemo(() => getClientId(), []);

  // O Draft espelha o localStorage Global!
  const [draft, setDraft] = React.useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });

  const [isEditingCore, setIsEditingCore] = React.useState(false);
  const [resultModal, setResultModal] = React.useState<{ title: string; output: string } | null>(null);
  
  // Modal de Tarefas
  const [taskModalAgent, setTaskModalAgent] = React.useState<AuthorityAgentDef | null>(null);
  
  // Estado dos cooldowns que já inicia lendo do LocalStorage
  const [cooldowns, setCooldowns] = React.useState<Record<string, number>>(loadCooldowns);
  const [runningKey, setRunningKey] = React.useState<string | null>(null);

  // Salvar no Storage
  const saveCore = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setIsEditingCore(false);
    toastSuccess("Núcleo da Empresa atualizado!");
  };

  // Executar Agente
  const runAgent = useMutation({
    mutationFn: async ({ agentKey, taskTitle }: { agentKey: string; taskTitle?: string }) => {
      return api.authorityAgents.runGlobal({
        client_id: clientId,
        agent_key: agentKey,
        nucleus: {
          ...draft,
          ...(taskTitle ? { requested_task: taskTitle } : {}) 
        }
      });
    },
    onSuccess: (res) => {
      const agentName = AUTHORITY_AGENTS.find(a => a.key === res.agent_key)?.name || "Agente";
      const cooldown = (res as any).cooldown_seconds || 3600;
      
      // Atualiza o estado e salva no localStorage para persistir nos reloads!
      setCooldowns((m) => ({ ...m, [res.agent_key]: cooldown }));
      saveCooldown(res.agent_key, cooldown);
      
      setResultModal({ title: agentName, output: res.output_text });
      toastSuccess(`O agente ${agentName} concluiu a tarefa.`);
    },
    onError: (e: any) => {
      const retryAfter = e?.response?.data?.detail?.retry_after_seconds;
      if (retryAfter) {
          const key = runningKey || "";
          setCooldowns((m) => ({ ...m, [key]: retryAfter }));
          if (key) saveCooldown(key, retryAfter);
          toastApiError(e, "Agente em cooldown");
      } else {
          toastApiError(e, "Falha ao executar agente");
      }
    },
    onSettled: () => setRunningKey(null),
  });

  // Tique-taque dos Cooldowns
  React.useEffect(() => {
    const t = setInterval(() => {
      setCooldowns((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) { next[k] -= 1; changed = true; }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const executeSelectedTask = (agentKey: string, taskTitle?: string) => {
    setTaskModalAgent(null); 
    setRunningKey(agentKey); 
    runAgent.mutate({ agentKey, taskTitle });
  };

  const isCoreFilled = Object.values(draft).some(v => v && v !== "não informado" && String(v).trim() !== "");

  return (
    <div className="relative min-h-[calc(100dvh-1px)] pb-20">
      <Particles className="pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 mt-8 space-y-6">
        
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-2 bg-google-blue/10 text-google-blue border-google-blue/20">Centro Operacional</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-google-blue" /> Agentes de Autoridade
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Estes robôs já nascem prontos e se alimentam do Núcleo da sua Empresa. Escolha um agente para selecionar o que ele deve criar.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* ESQUERDA: CÉREBRO GLOBAL (READ ONLY) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-3xl border-border/50 bg-background/40 shadow-soft overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-google-blue/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-google-blue" /> Núcleo da Empresa
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingCore(true)} className="h-8 rounded-full bg-background/50 hover:bg-background border shadow-sm">
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                </div>
                <CardDescription className="text-xs">Contexto base que os 10 Agentes usam.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {!isCoreFilled ? (
                   <div className="text-center py-6 text-muted-foreground text-sm">O núcleo está vazio. Clique em Editar para preenchê-lo ou faça a Jornada.</div>
                ) : (
                  CORE_GROUPS.map((g) => (
                    <div key={g.title} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <g.icon className="h-3.5 w-3.5" /> {g.title}
                      </div>
                      <div className="grid gap-2 text-sm pl-1">
                        {g.fields.map(f => {
                          const val = draft[f.key];
                          if(!val || val === "não informado") return null;
                          return (
                            <div key={f.key} className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground">{f.label}</span>
                              <span className="font-medium text-foreground truncate">{val}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* DIREITA: GRID DOS 10 AGENTES */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AUTHORITY_AGENTS.map((agent) => {
                const remaining = cooldowns[agent.key] ?? 0;
                const isRunning = runningKey === agent.key;
                const disabled = remaining > 0 || runningKey !== null;

                return (
                  <Card key={agent.key} className={cn(
                    "rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col",
                    disabled ? "bg-muted/20 border-border/40 opacity-90" : "bg-card hover:border-google-blue/40 hover:shadow-md cursor-default"
                  )}>
                    {isRunning && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-google-blue via-google-green to-google-yellow animate-pulse" />}
                    
                    <div className="p-5 flex-1 flex gap-4">
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border", disabled ? "bg-background text-muted-foreground" : "bg-google-blue/10 text-google-blue border-google-blue/20")}>
                        <agent.Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm text-foreground flex items-center justify-between">
                          {agent.label}
                          {remaining > 0 && <span className="text-[10px] font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Timer className="h-3 w-3" /> {formatRemaining(remaining)}</span>}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                      </div>
                    </div>
                    <div className="px-5 pb-5 mt-auto">
                      <Button
                        size="sm"
                        className="w-full rounded-xl transition-all shadow-sm"
                        variant={disabled ? "secondary" : "accent"}
                        disabled={disabled}
                        onClick={() => setTaskModalAgent(agent)} 
                      >
                        {isRunning ? "A IA está pensando..." : remaining > 0 ? "Em Cooldown" : <><MessageSquareDashed className="h-3.5 w-3.5 mr-1.5" /> Escolher Ação</>}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* OVERLAY MODAL - SELEÇÃO DE TAREFAS (QUEBRA-GELO) */}
        <AnimatePresence>
          {taskModalAgent && (
            <motion.div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div variants={fadeUp} initial="hidden" animate="show" exit="hidden" className="w-full max-w-2xl max-h-[85vh] bg-card border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-google-blue/10 text-google-blue flex items-center justify-center border border-google-blue/20">
                      <taskModalAgent.Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">O que o {taskModalAgent.name} deve fazer?</h2>
                      <p className="text-xs text-muted-foreground">Selecione uma tarefa abaixo para ele executar imediatamente.</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full bg-background/50 hover:bg-background" onClick={() => setTaskModalAgent(null)}><X className="h-5 w-5" /></Button>
                </div>
                <div className="overflow-y-auto p-6 bg-background/30 custom-scrollbar">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {tasksByAgentKey(taskModalAgent.key).length > 0 ? (
                      tasksByAgentKey(taskModalAgent.key).map((task, idx) => (
                        <Button 
                          key={idx} 
                          variant="outline" 
                          className="h-auto py-3.5 px-4 justify-start text-left font-normal bg-background hover:border-google-blue/50 hover:bg-google-blue/5 whitespace-normal leading-snug rounded-2xl shadow-sm"
                          onClick={() => executeSelectedTask(taskModalAgent.key, task.title)}
                        >
                          <Play className="h-3.5 w-3.5 text-google-blue mr-2 shrink-0 opacity-70" />
                          {task.title}
                        </Button>
                      ))
                    ) : (
                      <div className="sm:col-span-2 space-y-4">
                        <div className="text-sm text-muted-foreground text-center py-4">Este agente não possui quebra-gelos listados.</div>
                        <Button 
                          variant="accent" 
                          className="w-full h-auto py-3.5 rounded-2xl"
                          onClick={() => executeSelectedTask(taskModalAgent.key)}
                        >
                          Gerar Estratégia Completa Padrão
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OVERLAY MODAL - EDIÇÃO DO NÚCLEO GLOBAL */}
        <AnimatePresence>
          {isEditingCore && (
            <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div variants={fadeUp} initial="hidden" animate="show" exit="hidden" className="w-full max-w-3xl max-h-[85vh] bg-card border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2"><Edit2 className="h-5 w-5 text-google-blue" /> Editar Núcleo da Empresa</h2>
                    <p className="text-xs text-muted-foreground">Atualize a base global de conhecimento da empresa.</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full bg-background/50 hover:bg-background" onClick={() => setIsEditingCore(false)}><X className="h-5 w-5" /></Button>
                </div>
                <div className="overflow-y-auto p-6 space-y-8 bg-background/30 custom-scrollbar">
                  {CORE_GROUPS.map(g => (
                    <div key={g.title} className="space-y-4">
                      <h3 className="font-semibold text-sm uppercase text-muted-foreground flex items-center gap-2"><g.icon className="h-4 w-4" /> {g.title}</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {g.fields.map(f => (
                          <div key={f.key} className={cn("space-y-1.5", f.kind === 'textarea' ? "sm:col-span-2" : "")}>
                            <label className="text-sm font-medium pl-1">{f.label}</label>
                            {f.kind === 'input' ? (
                              <Input value={draft[f.key] || ""} onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))} className="rounded-xl shadow-sm bg-background/50" />
                            ) : (
                              <Textarea value={draft[f.key] || ""} onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))} className="rounded-xl min-h-[90px] shadow-sm bg-background/50" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t bg-background/50 flex justify-end gap-3">
                  <Button variant="ghost" className="rounded-xl" onClick={() => setIsEditingCore(false)}>Cancelar</Button>
                  <Button variant="accent" className="rounded-xl" onClick={saveCore}>Salvar Modificações</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OVERLAY MODAL - RESULTADO IMERSIVO (Tela Cheia) */}
        <AnimatePresence>
          {resultModal && (
            <motion.div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <motion.div initial={{ y: 50, scale: 0.95, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, scale: 0.95, opacity: 0 }} transition={transitions.slow} className="w-full max-w-4xl h-[85vh] bg-card border border-border/50 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
                  <div className="px-6 py-5 border-b flex items-center justify-between bg-background">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-google-green/10 text-google-green flex items-center justify-center border border-google-green/20">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Entrega: {resultModal.title}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">Conteúdo gerado e pronto para uso.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" className="rounded-xl shadow-sm" onClick={async () => { await navigator.clipboard.writeText(resultModal.output); toastSuccess("Texto copiado!"); }}>
                        <Copy className="h-4 w-4 mr-2" /> Copiar Tudo
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-muted" onClick={() => setResultModal(null)}>
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-background/40">
                    <div className="max-w-3xl mx-auto bg-background p-8 rounded-3xl border shadow-sm">
                      <Markdown content={resultModal.output} />
                    </div>
                  </div>
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}