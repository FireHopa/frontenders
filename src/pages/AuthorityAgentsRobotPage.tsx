
import * as React from "react";
import { useParams } from "react-router-dom";
import {
  Globe,
  MapPin,
  Star,
  FileText,
  Instagram,
  Linkedin,
  Youtube,
  Sparkles,
  Layers,
  Megaphone,
  Timer,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/robots";
import type { BusinessCoreIn, BusinessCoreOut, AuthorityAgentRunResponse } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

type AgentDef = {
  key:
    | "site"
    | "google_business_profile"
    | "social_proof"
    | "decision_content"
    | "instagram"
    | "linkedin"
    | "youtube"
    | "tiktok"
    | "cross_platform_consistency"
    | "external_mentions";
  title: string;
  humanName: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const AGENTS: AgentDef[] = [
  { key: "site", title: "Agente Site", humanName: "Caio Web", desc: "Kit de autoridade para site (páginas, FAQ, prova social).", Icon: Globe },
  { key: "google_business_profile", title: "Agente Perfil de Empresa no Google", humanName: "Gabi Maps", desc: "Otimização total do GBP (descrições, posts, avaliações).", Icon: MapPin },
  { key: "social_proof", title: "Agente Prova social e reputação", humanName: "Rafa Reputação", desc: "Scripts e ativos para coletar e publicar prova social.", Icon: Star },
  { key: "decision_content", title: "Agente Conteúdos de decisão", humanName: "Duda Decisão", desc: "Conteúdos de fundo de funil que fecham sem prometer o impossível.", Icon: FileText },
  { key: "instagram", title: "Agente Instagram", humanName: "Bia Insta", desc: "Plano de 30 dias + bio + Reels + carrosséis + stories.", Icon: Instagram },
  { key: "linkedin", title: "Agente LinkedIn", humanName: "Leo B2B", desc: "Perfil + posts + prospecção + cases (sem inventar números).", Icon: Linkedin },
  { key: "youtube", title: "Agente YouTube", humanName: "Yuri Vídeos", desc: "Ideias, roteiros e SEO para autoridade em vídeo.", Icon: Youtube },
  { key: "tiktok", title: "Agente TikTok", humanName: "Tati Trend", desc: "30 ideias de vídeos curtos (autoridade, prova, decisão).", Icon: Sparkles },
  { key: "cross_platform_consistency", title: "Agente Consistência entre plataformas", humanName: "Nina Consistência", desc: "Mensagem central + bios consistentes + reaproveitamento.", Icon: Layers },
  { key: "external_mentions", title: "Agente Menções externas", humanName: "Enzo PR", desc: "Plano de PR, parcerias e backlinks (sem inventar domínios).", Icon: Megaphone },
];

const CORE_STEPS: { title: string; fields: { key: keyof BusinessCoreIn; label: string; kind: "input" | "textarea"; placeholder?: string }[] }[] =
  [
    {
      title: "Núcleo do negócio",
      fields: [
        { key: "company_name", label: "Nome da empresa", kind: "input" },
        { key: "city_state", label: "Cidade e estado", kind: "input", placeholder: "Ex: São Paulo - SP" },
        { key: "service_area", label: "Tipo de atendimento (local / nacional)", kind: "input", placeholder: "local | nacional" },
        { key: "main_audience", label: "Público principal", kind: "textarea" },
        { key: "services_products", label: "Lista de serviços ou produtos", kind: "textarea" },
        { key: "real_differentials", label: "Diferenciais reais", kind: "textarea" },
        { key: "restrictions", label: "Restrições (o que não pode prometer ou dizer)", kind: "textarea" },
      ],
    },
    {
      title: "Prova social",
      fields: [
        { key: "reviews", label: "Possui avaliações? Onde?", kind: "textarea" },
        { key: "testimonials", label: "Possui depoimentos? Onde?", kind: "textarea" },
        { key: "usable_links_texts", label: "Links ou textos que podem ser usados", kind: "textarea" },
        { key: "forbidden_content", label: "O que não pode ser publicado", kind: "textarea" },
      ],
    },
    {
      title: "Plataformas",
      fields: [
        { key: "site", label: "Site", kind: "input", placeholder: "URL (se tiver)" },
        { key: "google_business_profile", label: "Perfil de Empresa no Google", kind: "input", placeholder: "URL (se tiver)" },
        { key: "instagram", label: "Instagram", kind: "input", placeholder: "@perfil ou URL" },
        { key: "linkedin", label: "LinkedIn", kind: "input", placeholder: "URL (se tiver)" },
        { key: "youtube", label: "YouTube", kind: "input", placeholder: "URL (se tiver)" },
        { key: "tiktok", label: "TikTok", kind: "input", placeholder: "@perfil ou URL" },
      ],
    },
  ];

function normalize(v: string | undefined | null) {
  const s = (v ?? "").trim();
  return s.length ? s : "não informado";
}

function formatRemaining(sec: number) {
  if (sec <= 0) return "Liberado";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}h ${String(mm).padStart(2, "0")}m`;
  return `${mm}m ${String(s).padStart(2, "0")}s`;
}

export default function AuthorityAgentsRobotPage() {
  const { publicId = "" } = useParams();

  const coreQ = useQuery({
    queryKey: ["business-core", publicId],
    queryFn: () => api.robots.businessCore.get(publicId),
    enabled: Boolean(publicId),
  });

  const patchCore = useMutation({
    mutationFn: (patch: BusinessCoreIn) => api.robots.businessCore.patch(publicId, patch),
    onError: (e) => toastApiError(e, "Falha ao salvar núcleo do negócio"),
  });

  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<BusinessCoreIn>({});
  const [cooldowns, setCooldowns] = React.useState<Record<string, number>>({});
  const [runningKey, setRunningKey] = React.useState<string | null>(null);
  const [lastOutput, setLastOutput] = React.useState<{ title: string; output: string } | null>(null);
  const [extraMessage, setExtraMessage] = React.useState("");

  // bootstrap core into draft
  React.useEffect(() => {
    if (coreQ.data) {
      const c = coreQ.data;
      setDraft({
        company_name: c.company_name,
        city_state: c.city_state,
        service_area: c.service_area,
        main_audience: c.main_audience,
        services_products: c.services_products,
        real_differentials: c.real_differentials,
        restrictions: c.restrictions,
        reviews: c.reviews,
        testimonials: c.testimonials,
        usable_links_texts: c.usable_links_texts,
        forbidden_content: c.forbidden_content,
        site: c.site,
        google_business_profile: c.google_business_profile,
        instagram: c.instagram,
        linkedin: c.linkedin,
        youtube: c.youtube,
        tiktok: c.tiktok,
      });
    }
  }, [coreQ.data]);

  // load cooldowns once
  React.useEffect(() => {
    if (!publicId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await Promise.all(
          AGENTS.map(async (a) => {
            const r = await api.robots.authorityAgents.cooldown(publicId, a.key);
            return [a.key, r.cooldown_seconds] as const;
          })
        );
        if (!cancelled) {
          const map: Record<string, number> = {};
          res.forEach(([k, v]) => (map[k] = v));
          setCooldowns(map);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  // tick cooldowns
  React.useEffect(() => {
    const t = setInterval(() => {
      setCooldowns((prev) => {
        const next: Record<string, number> = { ...prev };
        let changed = false;
        for (const k of Object.keys(next)) {
          if (next[k] > 0) {
            next[k] = Math.max(0, next[k] - 1);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const currentStep = CORE_STEPS[step];

  async function saveStep() {
    const payload: BusinessCoreIn = {};
    for (const f of currentStep.fields) {
      const v = (draft as any)[f.key];
      (payload as any)[f.key] = normalize(v);
    }
    const saved = await patchCore.mutateAsync(payload);
    toastSuccess("Núcleo salvo.");
    // reflect normalized values
    setDraft((d) => ({ ...d, ...saved }));
  }

  function canProceed(): boolean {
    // allow proceed if every field has something typed OR explicitly "não informado"
    return currentStep.fields.every((f) => {
      const v = ((draft as any)[f.key] ?? "").toString().trim();
      return v.length > 0;
    });
  }

  async function markAllNotInformedAndProceed() {
    const payload: BusinessCoreIn = {};
    currentStep.fields.forEach((f) => ((payload as any)[f.key] = "não informado"));
    const saved = await patchCore.mutateAsync(payload);
    toastSuccess("Marcado como não informado.");
    setDraft((d) => ({ ...d, ...saved }));
  }

  const runAgent = useMutation({
    mutationFn: async (agentKey: string) => {
      return api.robots.authorityAgents.run(publicId, agentKey, { message: extraMessage || undefined });
    },
    onSuccess: (res: AuthorityAgentRunResponse) => {
      setCooldowns((m) => ({ ...m, [res.agent_key]: res.cooldown_seconds }));
      setLastOutput({ title: res.agent_name, output: res.output });
      toastSuccess("Pronto.");
    },
    onError: (e) => toastApiError(e, "Falha ao executar agente"),
    onSettled: () => setRunningKey(null),
  });

  const coreReady = Boolean(coreQ.data);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agentes de Autoridade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Primeiro, preencha o núcleo do negócio. Depois é 1 clique por agente (cooldown de 1h).
          </p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-2xl">
          <Timer className="mr-1 h-3.5 w-3.5" />
          1 hora de intervalo
        </Badge>
      </div>

      <Card className="rounded-3xl shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Núcleo do negócio</CardTitle>
          <CardDescription>Responda em progressão. Se não houver dado, marque como “não informado”.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!coreReady ? (
            coreQ.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando…</div>
            ) : (
              <div className="text-sm text-destructive">Falha ao carregar.</div>
            )
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {CORE_STEPS.map((s, idx) => (
                  <Button
                    key={s.title}
                    type="button"
                    variant={idx === step ? "default" : "secondary"}
                    className="rounded-2xl"
                    onClick={() => setStep(idx)}
                  >
                    {idx + 1}. {s.title}
                  </Button>
                ))}
              </div>

              <div className="rounded-3xl border bg-background/35 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{currentStep.title}</div>
                  <div className="text-xs text-muted-foreground">
                    Passo {step + 1} de {CORE_STEPS.length}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {currentStep.fields.map((f) => (
                    <div key={String(f.key)} className={cn("space-y-2", f.kind === "textarea" ? "md:col-span-2" : "")}>
                      <div className="text-sm font-medium">{f.label}</div>
                      {f.kind === "input" ? (
                        <Input
                          value={((draft as any)[f.key] ?? "") as string}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          placeholder={f.placeholder || ""}
                          className="rounded-2xl"
                        />
                      ) : (
                        <Textarea
                          value={((draft as any)[f.key] ?? "") as string}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          placeholder={f.placeholder || ""}
                          className="min-h-[92px] rounded-2xl"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-2xl"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-2xl"
                      onClick={async () => {
                        await markAllNotInformedAndProceed();
                        setStep((s) => Math.min(CORE_STEPS.length - 1, s + 1));
                      }}
                      disabled={patchCore.isPending}
                    >
                      Marcar como não informado e avançar
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      className="rounded-2xl"
                      onClick={async () => {
                        await saveStep();
                        if (step < CORE_STEPS.length - 1) setStep(step + 1);
                      }}
                      disabled={!canProceed() || patchCore.isPending}
                      title={!canProceed() ? "Preencha ou use 'não informado'." : ""}
                    >
                      Salvar e avançar
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium">Mensagem extra (opcional)</div>
                <Textarea
                  value={extraMessage}
                  onChange={(e) => setExtraMessage(e.target.value)}
                  placeholder="Ex: focar em premium, linguagem mais direta, etc."
                  className="min-h-[84px] rounded-2xl"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Agentes (1 clique)</CardTitle>
          <CardDescription>Cada agente pode ser usado 1 vez por hora.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {AGENTS.map((a) => {
            const remaining = cooldowns[a.key] ?? 0;
            const disabled = remaining > 0 || runAgent.isPending;
            const isRunning = runningKey === a.key;

            return (
              <Card key={a.key} className="rounded-3xl border bg-background/35 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span className="flex items-center gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl border bg-background/50 shadow-soft">
                        <a.Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">{a.humanName}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{a.title}</span>
                      </span>
                    </span>

                    <Badge variant={remaining > 0 ? "secondary" : "default"} className="rounded-2xl">
                      <Timer className="mr-1 h-3.5 w-3.5" />
                      {formatRemaining(remaining)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{a.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    className="rounded-2xl"
                    disabled={disabled}
                    onClick={() => {
                      setRunningKey(a.key);
                      runAgent.mutate(a.key);
                    }}
                  >
                    {isRunning ? "Executando…" : remaining > 0 ? "Aguarde" : "Executar"}
                  </Button>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    <span>cooldown por agente</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {lastOutput ? (
        <Card className="rounded-3xl shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Saída — {lastOutput.title}</CardTitle>
            <CardDescription>Copie e aplique. (O agente não inventa dados.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="whitespace-pre-wrap rounded-3xl border bg-background/35 p-4 text-sm leading-relaxed">
              {lastOutput.output}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-2xl"
                onClick={async () => {
                  await navigator.clipboard.writeText(lastOutput.output);
                  toastSuccess("Copiado.");
                }}
              >
                Copiar
              </Button>
              <Button type="button" variant="secondary" className="rounded-2xl" onClick={() => setLastOutput(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
