import * as React from "react";
import { useParams } from "react-router-dom";
import { Timer, Save, CheckCircle2, Play, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/robots";
import type { BusinessCoreIn, AuthorityAgentRunResponse } from "@/types/api";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Agrupamento dos campos para o Layout de Dashboard
const CORE_GROUPS = [
  {
    title: "1. Essencial e Diferenciais",
    desc: "A base da sua empresa preenchida durante a Jornada.",
    fields: [
      { key: "company_name", label: "Nome da empresa", kind: "input" },
      { key: "city_state", label: "Cidade e estado", kind: "input", placeholder: "Ex: São Paulo - SP" },
      { key: "main_audience", label: "Público principal", kind: "textarea" },
      { key: "services_products", label: "Serviços ou produtos", kind: "textarea" },
      { key: "real_differentials", label: "Diferenciais reais", kind: "textarea" },
      { key: "restrictions", label: "Restrições (o que não prometer)", kind: "textarea" },
    ],
  },
  {
    title: "2. Provas Sociais e Regras",
    desc: "Aprofundamento. Os agentes usam isso para gerar conteúdos mais confiáveis.",
    fields: [
      { key: "reviews", label: "Possui avaliações? (Google, etc)", kind: "textarea" },
      { key: "testimonials", label: "Depoimentos de clientes", kind: "textarea" },
      { key: "usable_links_texts", label: "Links ou textos permitidos", kind: "textarea" },
      { key: "forbidden_content", label: "Assuntos proibidos", kind: "textarea" },
    ],
  },
  {
    title: "3. Canais Oficiais",
    desc: "Onde o robô e os agentes vão direcionar o tráfego.",
    fields: [
      { key: "site", label: "Site", kind: "input", placeholder: "https://" },
      { key: "google_business_profile", label: "Perfil do Google", kind: "input", placeholder: "URL" },
      { key: "instagram", label: "Instagram", kind: "input", placeholder: "@" },
      { key: "linkedin", label: "LinkedIn", kind: "input", placeholder: "URL" },
      { key: "youtube", label: "YouTube", kind: "input", placeholder: "URL" },
      { key: "tiktok", label: "TikTok", kind: "input", placeholder: "@" },
    ],
  },
];

function formatRemaining(sec: number) {
  if (sec <= 0) return "Pronto";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  }
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function AuthorityAgentsRobotPage() {
  const { publicId = "" } = useParams();
  const queryClient = useQueryClient();

  // Buscar dados do núcleo
  const coreQ = useQuery({
    queryKey: ["business-core", publicId],
    queryFn: () => api.robots.businessCore.get(publicId),
    enabled: Boolean(publicId),
  });

  const patchCore = useMutation({
    mutationFn: (patch: BusinessCoreIn) => api.robots.businessCore.patch(publicId, patch),
    onSuccess: () => {
      toastSuccess("Núcleo atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["business-core", publicId] });
    },
    onError: (e) => toastApiError(e, "Falha ao salvar núcleo"),
  });

  const [draft, setDraft] = React.useState<BusinessCoreIn>({});
  const [cooldowns, setCooldowns] = React.useState<Record<string, number>>({});
  const [runningKey, setRunningKey] = React.useState<string | null>(null);
  const [lastOutput, setLastOutput] = React.useState<{ title: string; output: string } | null>(null);

  // Sincronizar backend com rascunho local
  React.useEffect(() => {
    if (coreQ.data) {
      setDraft(coreQ.data as BusinessCoreIn);
    }
  }, [coreQ.data]);

  // Carregar Cooldowns iniciais dos agentes
  React.useEffect(() => {
    if (!publicId) return;
    AUTHORITY_AGENTS.forEach(async (a) => {
      try {
        const r = await api.robots.authorityAgents.cooldown(publicId, a.key);
        setCooldowns((prev) => ({ ...prev, [a.key]: r.cooldown_seconds }));
      } catch (e) {
        // ignora falha isolada de cooldown
      }
    });
  }, [publicId]);

  // Cronômetro do cooldown
  React.useEffect(() => {
    const t = setInterval(() => {
      setCooldowns((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) {
            next[k] -= 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Executar Agente
  const runAgent = useMutation({
    mutationFn: async (agentKey: string) => {
      // Garante que o núcleo local seja salvo antes de rodar o agente
      await patchCore.mutateAsync(draft);
      return api.robots.authorityAgents.run(publicId, agentKey, { message: undefined });
    },
    onSuccess: (res: AuthorityAgentRunResponse) => {
      setCooldowns((m) => ({ ...m, [res.agent_key]: res.cooldown_seconds }));
      setLastOutput({ title: res.agent_name, output: res.output });
      toastSuccess(`${res.agent_name} finalizou a tarefa.`);
      // Scrolla para o resultado no topo
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e) => toastApiError(e, "Falha ao executar agente"),
    onSettled: () => setRunningKey(null),
  });

  const handleSaveCore = () => patchCore.mutate(draft);

  if (coreQ.isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando cérebro do robô...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col gap-2 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-google-blue" />
            Painel de Inteligência
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Bem-vindo ao núcleo operacional. Ajuste os dados da sua empresa à esquerda e rode os Agentes Especialistas à direita.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSaveCore} isLoading={patchCore.isPending} variant="accent" className="rounded-xl">
            <Save className="mr-2 h-4 w-4" />
            Salvar Cérebro
          </Button>
        </div>
      </div>

      {/* RESULTADO DO AGENTE (Aparece no topo quando finaliza) */}
      {lastOutput && (
        <Card className="rounded-3xl border-google-blue/50 bg-google-blue/5 shadow-soft animate-in fade-in slide-in-from-top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2 text-google-blue">
                <CheckCircle2 className="h-5 w-5" />
                Entrega do {lastOutput.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={async () => {
                  await navigator.clipboard.writeText(lastOutput.output);
                  toastSuccess("Copiado para a área de transferência.");
                }}>
                  Copiar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLastOutput(null)}>Fechar</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap rounded-2xl bg-background/80 p-5 text-sm leading-relaxed border shadow-inner">
              {lastOutput.output}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LAYOUT DE DUAS COLUNAS */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* COLUNA ESQUERDA: O CÉREBRO (NÚCLEO) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">1. Núcleo da Empresa</h2>
          </div>

          {CORE_GROUPS.map((group) => (
            <Card key={group.title} className="rounded-3xl shadow-sm bg-background/50 border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{group.title}</CardTitle>
                <CardDescription>{group.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.fields.map((f) => (
                    <div key={f.key} className={cn("space-y-2", f.kind === "textarea" ? "sm:col-span-2" : "")}>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {f.label}
                      </label>
                      {f.kind === "input" ? (
                        <Input
                          value={((draft as any)[f.key] ?? "") as string}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          placeholder={f.placeholder || "não informado"}
                          className="bg-background/80 transition-all focus:bg-background"
                        />
                      ) : (
                        <Textarea
                          value={((draft as any)[f.key] ?? "") as string}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          placeholder={f.placeholder || "não informado"}
                          className="min-h-[80px] bg-background/80 transition-all focus:bg-background resize-y"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* COLUNA DIREITA: OS AGENTES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">2. Agentes de Autoridade</h2>
            <Badge variant="outline" className="text-xs"><Timer className="mr-1 h-3 w-3" />1h Cooldown</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {AUTHORITY_AGENTS.map((agent) => {
              const remaining = cooldowns[agent.key] ?? 0;
              const isRunning = runningKey === agent.key;
              const disabled = remaining > 0 || runningKey !== null || patchCore.isPending;

              return (
                <div
                  key={agent.key}
                  className={cn(
                    "group relative flex flex-col justify-between gap-4 rounded-2xl border p-4 transition-all hover:shadow-md",
                    disabled ? "bg-muted/30 opacity-80" : "bg-card hover:border-google-blue/40"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      disabled ? "bg-muted text-muted-foreground" : "bg-google-blue/10 text-google-blue"
                    )}>
                      <agent.Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{agent.label}</h3>
                        {remaining > 0 && (
                          <span className="text-xs font-medium text-orange-500 flex items-center">
                            <Timer className="mr-1 h-3 w-3" /> {formatRemaining(remaining)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug pr-4">{agent.desc}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full rounded-xl"
                    variant={disabled ? "secondary" : "default"}
                    disabled={disabled}
                    onClick={() => {
                      setRunningKey(agent.key);
                      runAgent.mutate(agent.key);
                    }}
                  >
                    {isRunning ? (
                      <span className="animate-pulse">Criando conteúdo...</span>
                    ) : remaining > 0 ? (
                      "Em Cooldown"
                    ) : (
                      <span className="flex items-center gap-1"><Play className="h-3 w-3 fill-current" /> Rodar Agente</span>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}