import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Edit3,
  Layers3,
  Lightbulb,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastApiError, toastInfo, toastSuccess } from "@/lib/toast";
import {
  buildSkyBobFeedbackPreferences,
  buildSkyBobNucleusSignature,
  createEmptySkyBobWorkspace,
  parseSkyBobWorkspace,
  serializeSkyBobWorkspace,
  withWorkspaceTimestamp,
  type SkyBobFeedbackItem,
  type SkyBobWorkspace,
  type VoteValue,
} from "@/lib/skybob";
import { api } from "@/services/robots";
import type { BusinessCoreOut, SkyBobCard, SkyBobCatalogItem, SkyBobHook, SkyBobRunResponse } from "@/types/api";

const STORAGE_KEY = "ori_authority_nucleus_v1";

function loadNucleus(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function saveNucleus(next: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function ensureString(value: unknown): string {
  return String(value ?? "");
}

function splitLines(value: string): string[] {
  return value
    .split(/\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitComma(value: string): string[] {
  return value
    .split(/[,;|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatNowIso(): string {
  return new Date().toISOString();
}

function normalizeNucleus(coreData?: BusinessCoreOut | null): Record<string, unknown> {
  if (!coreData) return loadNucleus();
  const merged = { ...loadNucleus(), ...coreData };
  saveNucleus(merged);
  return merged;
}

function resolveHook(workspace: SkyBobWorkspace, hook: SkyBobHook): SkyBobHook {
  return workspace.hooks_feedback[hook.id]?.item ?? hook;
}

function resolveCard(workspace: SkyBobWorkspace, card: SkyBobCard): SkyBobCard {
  return workspace.cards_feedback[card.id]?.item ?? card;
}

function createHookFeedbackItem(item: SkyBobHook): SkyBobFeedbackItem<SkyBobHook> {
  return {
    id: item.id,
    item,
    status: null,
    notes: "",
    updated_at: formatNowIso(),
  };
}

function createCardFeedbackItem(item: SkyBobCard): SkyBobFeedbackItem<SkyBobCard> {
  return {
    id: item.id,
    item,
    status: null,
    notes: "",
    updated_at: formatNowIso(),
  };
}

function sortFeedbackByDate<T extends SkyBobHook | SkyBobCard>(entries: SkyBobFeedbackItem<T>[]) {
  return [...entries].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

function statusBadgeVariant(status: VoteValue): "green" | "red" | "outline" {
  if (status === "like") return "green";
  if (status === "dislike") return "red";
  return "outline";
}

function statusLabel(status: VoteValue): string {
  if (status === "like") return "Gostei";
  if (status === "dislike") return "Não gostei";
  return "Sem feedback";
}

function RocketHero() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top,rgba(0,200,232,0.20),transparent_40%),linear-gradient(180deg,rgba(8,11,20,0.94),rgba(8,11,20,1))] min-h-[360px]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <motion.div
        className="absolute right-6 top-10 hidden md:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Rocket className="h-28 w-28 text-cyan-200 drop-shadow-[0_0_36px_rgba(0,200,232,0.35)]" />
      </motion.div>

      <div className="relative p-8 md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
          <Sparkles className="h-4 w-4" />
          SkyBob
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Estudo editorial + Hook Lab treinável com memória persistida.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
          Agora o SkyBob faz uma pré-análise do catálogo antes de rodar, executa em GPT-5.4, refina só hooks/cards quando você pede e mantém feedbacks/edições salvos no núcleo da empresa.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card className="border-cyan-400/14 bg-white/[0.03]">
      <CardContent className="p-5">
        <div className="mb-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">{icon}</div>
        <div className="text-sm text-slate-400">{title}</div>
        <div className="mt-2 text-3xl font-black">{value}</div>
        <div className="mt-2 text-xs leading-5 text-slate-400">{description}</div>
      </CardContent>
    </Card>
  );
}

function HookLabCard({
  hook,
  vote,
  onVote,
}: {
  hook: SkyBobHook;
  vote: VoteValue;
  onVote: (hook: SkyBobHook, value: VoteValue) => void;
}) {
  return (
    <Card className="h-full border-cyan-400/20 bg-[linear-gradient(180deg,rgba(13,20,34,0.96),rgba(8,11,20,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="blue">{hook.angle || "hook"}</Badge>
          <Badge variant="outline">{hook.format_hint || "Formato não informado"}</Badge>
          <Badge variant={statusBadgeVariant(vote)}>{statusLabel(vote)}</Badge>
        </div>
        <CardTitle className="text-xl leading-tight">{hook.hook}</CardTitle>
        <CardDescription className="text-sm leading-6 text-slate-300">{hook.why_it_matches || "Hook alinhado ao posicionamento atual do negócio."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {hook.use_case ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">Como usar</div>
            <div className="text-sm leading-6 text-slate-200">{hook.use_case}</div>
          </div>
        ) : null}

        {hook.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {hook.tags.map((tag) => (
              <Badge key={`${hook.id}-${tag}`} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button variant={vote === "like" ? "default" : "outline"} size="sm" onClick={() => onVote(hook, vote === "like" ? null : "like")}>
            <ThumbsUp className="h-4 w-4" />
            Gostei
          </Button>
          <Button variant={vote === "dislike" ? "destructive" : "outline"} size="sm" onClick={() => onVote(hook, vote === "dislike" ? null : "dislike")}>
            <ThumbsDown className="h-4 w-4" />
            Não gostei
          </Button>
          <span className="text-xs text-slate-400">Esse feedback entra no próximo refinamento.</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StudyCard({
  card,
  vote,
  onVote,
}: {
  card: SkyBobCard;
  vote: VoteValue;
  onVote: (card: SkyBobCard, value: VoteValue) => void;
}) {
  return (
    <Card className="h-full border-cyan-400/15 bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(8,11,20,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <CardHeader className="space-y-4 pb-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue">{card.section}</Badge>
            <Badge variant={statusBadgeVariant(vote)}>{statusLabel(vote)}</Badge>
          </div>
          <CardTitle className="text-xl leading-tight">{card.title}</CardTitle>
        </div>
        <CardDescription className="text-sm leading-6 text-slate-300">{card.body}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {card.badges.length ? (
          <div className="flex flex-wrap gap-2">
            {card.badges.map((badge) => (
              <Badge key={`${card.id}-${badge}`} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}

        {card.bullets.length ? (
          <div className="space-y-2">
            {card.bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-2 text-sm leading-6 text-slate-200">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button variant={vote === "like" ? "default" : "outline"} size="sm" onClick={() => onVote(card, vote === "like" ? null : "like")}>
            <ThumbsUp className="h-4 w-4" />
            Gostei
          </Button>
          <Button variant={vote === "dislike" ? "destructive" : "outline"} size="sm" onClick={() => onVote(card, vote === "dislike" ? null : "dislike")}>
            <ThumbsDown className="h-4 w-4" />
            Não gostei
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogItemCard({ item }: { item: SkyBobCatalogItem }) {
  return (
    <Card className="border-cyan-400/16 bg-[linear-gradient(180deg,rgba(10,16,28,0.92),rgba(8,11,20,0.98))]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="blue">{item.kind}</Badge>
          <Badge variant="outline">{item.name}</Badge>
        </div>
        <CardDescription className="text-sm leading-6 text-slate-300">{item.rationale}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-200">{item.study}</div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Dores</div>
            <div className="space-y-2 text-sm text-slate-200">
              {item.pains.map((pain) => (
                <div key={pain}>{pain}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Desejos</div>
            <div className="space-y-2 text-sm text-slate-200">
              {item.desires.map((desire) => (
                <div key={desire}>{desire}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Objeções</div>
            <div className="space-y-2 text-sm text-slate-200">
              {item.objections.map((objection) => (
                <div key={objection}>{objection}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Ângulos úteis</div>
            <div className="space-y-2 text-sm text-slate-200">
              {item.messaging_angles.map((angle) => (
                <div key={angle}>{angle}</div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HookFeedbackEditor({
  entry,
  onVote,
  onChange,
  onNotesChange,
}: {
  entry: SkyBobFeedbackItem<SkyBobHook>;
  onVote: (hook: SkyBobHook, value: VoteValue) => void;
  onChange: (hook: SkyBobHook, field: keyof SkyBobHook, value: string | string[]) => void;
  onNotesChange: (hook: SkyBobHook, notes: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(entry.status)}>{statusLabel(entry.status)}</Badge>
          <Badge variant="outline">{entry.item.angle || "sem ângulo"}</Badge>
          <Badge variant="outline">{entry.item.format_hint || "sem formato"}</Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{entry.item.hook}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={entry.item.hook} onChange={(event) => onChange(entry.item, "hook", event.target.value)} placeholder="Hook" />
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={entry.item.angle} onChange={(event) => onChange(entry.item, "angle", event.target.value)} placeholder="Ângulo" />
          <Input value={entry.item.format_hint} onChange={(event) => onChange(entry.item, "format_hint", event.target.value)} placeholder="Formato" />
        </div>
        <Textarea value={entry.item.use_case} onChange={(event) => onChange(entry.item, "use_case", event.target.value)} placeholder="Como usar" />
        <Textarea value={entry.item.why_it_matches} onChange={(event) => onChange(entry.item, "why_it_matches", event.target.value)} placeholder="Por que combina" />
        <Input value={entry.item.tags.join(", ")} onChange={(event) => onChange(entry.item, "tags", splitComma(event.target.value))} placeholder="Tags separadas por vírgula" />
        <Textarea value={entry.notes} onChange={(event) => onNotesChange(entry.item, event.target.value)} placeholder="Notas do feedback para o núcleo" />

        <div className="flex flex-wrap gap-3">
          <Button variant={entry.status === "like" ? "default" : "outline"} size="sm" onClick={() => onVote(entry.item, entry.status === "like" ? null : "like")}>
            <ThumbsUp className="h-4 w-4" />
            Gostei
          </Button>
          <Button variant={entry.status === "dislike" ? "destructive" : "outline"} size="sm" onClick={() => onVote(entry.item, entry.status === "dislike" ? null : "dislike")}>
            <ThumbsDown className="h-4 w-4" />
            Não gostei
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CardFeedbackEditor({
  entry,
  onVote,
  onChange,
  onNotesChange,
}: {
  entry: SkyBobFeedbackItem<SkyBobCard>;
  onVote: (card: SkyBobCard, value: VoteValue) => void;
  onChange: (card: SkyBobCard, field: keyof SkyBobCard, value: string | string[]) => void;
  onNotesChange: (card: SkyBobCard, notes: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusBadgeVariant(entry.status)}>{statusLabel(entry.status)}</Badge>
          <Badge variant="outline">{entry.item.section || "sem seção"}</Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{entry.item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={entry.item.title} onChange={(event) => onChange(entry.item, "title", event.target.value)} placeholder="Título" />
        <Input value={entry.item.section} onChange={(event) => onChange(entry.item, "section", event.target.value)} placeholder="Seção" />
        <Textarea value={entry.item.body} onChange={(event) => onChange(entry.item, "body", event.target.value)} placeholder="Resumo do estudo" />
        <Textarea value={entry.item.bullets.join("\n")} onChange={(event) => onChange(entry.item, "bullets", splitLines(event.target.value))} placeholder="Bullets, uma linha por item" />
        <Input value={entry.item.badges.join(", ")} onChange={(event) => onChange(entry.item, "badges", splitComma(event.target.value))} placeholder="Badges separadas por vírgula" />
        <Textarea value={entry.notes} onChange={(event) => onNotesChange(entry.item, event.target.value)} placeholder="Notas do feedback para o núcleo" />

        <div className="flex flex-wrap gap-3">
          <Button variant={entry.status === "like" ? "default" : "outline"} size="sm" onClick={() => onVote(entry.item, entry.status === "like" ? null : "like")}>
            <ThumbsUp className="h-4 w-4" />
            Gostei
          </Button>
          <Button variant={entry.status === "dislike" ? "destructive" : "outline"} size="sm" onClick={() => onVote(entry.item, entry.status === "dislike" ? null : "dislike")}>
            <ThumbsDown className="h-4 w-4" />
            Não gostei
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SkyBobPage() {
  const { data: coreData } = useQuery({
    queryKey: ["business-core", "business-core-global", "skybob"],
    queryFn: () => api.robots.businessCore.get("business-core-global"),
  });

  const nucleus = React.useMemo(() => normalizeNucleus(coreData), [coreData]);
  const nucleusSignature = React.useMemo(() => buildSkyBobNucleusSignature(nucleus), [nucleus]);

  const [workspace, setWorkspace] = React.useState<SkyBobWorkspace>(() => {
    const saved = parseSkyBobWorkspace(ensureString(loadNucleus().skybob));
    return saved ?? createEmptySkyBobWorkspace("");
  });
  const [isAnalyzingCatalog, setIsAnalyzingCatalog] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const fromServer = parseSkyBobWorkspace(coreData?.skybob);
    if (fromServer) {
      setWorkspace(fromServer);
      return;
    }

    setWorkspace((prev) => ({
      ...prev,
      nucleus_signature: nucleusSignature,
    }));
  }, [coreData?.skybob, nucleusSignature]);

  const persistWorkspace = React.useCallback(
    async (nextWorkspace: SkyBobWorkspace, successMessage?: string) => {
      const payload = serializeSkyBobWorkspace(nextWorkspace);
      saveNucleus({ ...loadNucleus(), ...nucleus, skybob: payload });
      await api.robots.businessCore.patch("business-core-global", { skybob: payload });
      if (successMessage) {
        toastSuccess(successMessage);
      }
    },
    [nucleus]
  );

  const analyzeCatalog = React.useCallback(
    async (successMessage?: string) => {
      setIsAnalyzingCatalog(true);
      try {
        const catalogAnalysis = await api.skybob.preflight({ nucleus });
        const nextWorkspace = withWorkspaceTimestamp({
          ...workspace,
          nucleus_signature: nucleusSignature,
          model_used: workspace.study?.model_used || catalogAnalysis.model_used,
          catalog_analysis: catalogAnalysis,
        });
        setWorkspace(nextWorkspace);
        await persistWorkspace(nextWorkspace, successMessage);
      } catch (error) {
        toastApiError(error, "Não consegui analisar os serviços e produtos do núcleo");
      } finally {
        setIsAnalyzingCatalog(false);
      }
    },
    [nucleus, nucleusSignature, persistWorkspace, workspace]
  );

  React.useEffect(() => {
    if (workspace.catalog_analysis && workspace.nucleus_signature === nucleusSignature) return;
    if (!Object.values(nucleus).some((value) => ensureString(value).trim())) return;
    void analyzeCatalog();
  }, [analyzeCatalog, nucleus, nucleusSignature, workspace.catalog_analysis, workspace.nucleus_signature]);

  const upsertHookFeedback = React.useCallback((hook: SkyBobHook, updater: (current: SkyBobFeedbackItem<SkyBobHook>) => SkyBobFeedbackItem<SkyBobHook>) => {
    setWorkspace((prev) => {
      const current = prev.hooks_feedback[hook.id] ?? createHookFeedbackItem(hook);
      const nextEntry = updater(current);
      return withWorkspaceTimestamp({
        ...prev,
        hooks_feedback: {
          ...prev.hooks_feedback,
          [hook.id]: nextEntry,
        },
      });
    });
  }, []);

  const upsertCardFeedback = React.useCallback((card: SkyBobCard, updater: (current: SkyBobFeedbackItem<SkyBobCard>) => SkyBobFeedbackItem<SkyBobCard>) => {
    setWorkspace((prev) => {
      const current = prev.cards_feedback[card.id] ?? createCardFeedbackItem(card);
      const nextEntry = updater(current);
      return withWorkspaceTimestamp({
        ...prev,
        cards_feedback: {
          ...prev.cards_feedback,
          [card.id]: nextEntry,
        },
      });
    });
  }, []);

  const handleHookVote = React.useCallback(
    (hook: SkyBobHook, value: VoteValue) => {
      upsertHookFeedback(hook, (current) => ({
        ...current,
        item: current.item.id ? current.item : hook,
        status: value,
        updated_at: formatNowIso(),
      }));
    },
    [upsertHookFeedback]
  );

  const handleCardVote = React.useCallback(
    (card: SkyBobCard, value: VoteValue) => {
      upsertCardFeedback(card, (current) => ({
        ...current,
        item: current.item.id ? current.item : card,
        status: value,
        updated_at: formatNowIso(),
      }));
    },
    [upsertCardFeedback]
  );

  const handleHookChange = React.useCallback(
    (hook: SkyBobHook, field: keyof SkyBobHook, value: string | string[]) => {
      upsertHookFeedback(hook, (current) => ({
        ...current,
        item: {
          ...current.item,
          [field]: value,
        },
        updated_at: formatNowIso(),
      }));
    },
    [upsertHookFeedback]
  );

  const handleCardChange = React.useCallback(
    (card: SkyBobCard, field: keyof SkyBobCard, value: string | string[]) => {
      upsertCardFeedback(card, (current) => ({
        ...current,
        item: {
          ...current.item,
          [field]: value,
        },
        updated_at: formatNowIso(),
      }));
    },
    [upsertCardFeedback]
  );

  const handleHookNotesChange = React.useCallback(
    (hook: SkyBobHook, notes: string) => {
      upsertHookFeedback(hook, (current) => ({
        ...current,
        notes,
        updated_at: formatNowIso(),
      }));
    },
    [upsertHookFeedback]
  );

  const handleCardNotesChange = React.useCallback(
    (card: SkyBobCard, notes: string) => {
      upsertCardFeedback(card, (current) => ({
        ...current,
        notes,
        updated_at: formatNowIso(),
      }));
    },
    [upsertCardFeedback]
  );

  const runStudy = React.useCallback(async () => {
    setIsRunning(true);
    try {
      const catalogAnalysis = workspace.catalog_analysis ?? (await api.skybob.preflight({ nucleus }));
      const result = await api.skybob.run({
        nucleus,
        catalog_analysis: catalogAnalysis,
        mode: "full",
      });

      const nextWorkspace = withWorkspaceTimestamp({
        ...workspace,
        nucleus_signature: nucleusSignature,
        model_used: result.model_used,
        catalog_analysis: result.catalog_analysis ?? catalogAnalysis,
        study: result,
      });
      setWorkspace(nextWorkspace);
      await persistWorkspace(nextWorkspace, "SkyBob iniciado e salvo no núcleo da empresa.");
    } catch (error) {
      toastApiError(error, "Não consegui executar o SkyBob");
    } finally {
      setIsRunning(false);
    }
  }, [nucleus, nucleusSignature, persistWorkspace, workspace]);

  const rerunStudy = React.useCallback(async () => {
    if (!workspace.study) {
      toastInfo("Inicie o SkyBob antes de refinar.");
      return;
    }

    setIsRegenerating(true);
    try {
      const result = await api.skybob.run({
        nucleus,
        catalog_analysis: workspace.catalog_analysis,
        preferences: buildSkyBobFeedbackPreferences(workspace),
        previous_study: workspace.study,
        mode: "refine",
      });

      const nextWorkspace = withWorkspaceTimestamp({
        ...workspace,
        nucleus_signature: nucleusSignature,
        model_used: result.model_used,
        study: result,
      });
      setWorkspace(nextWorkspace);
      await persistWorkspace(nextWorkspace, "Hooks e cards refinados com base no feedback salvo.");
    } catch (error) {
      toastApiError(error, "Não consegui refinar hooks e estudo");
    } finally {
      setIsRegenerating(false);
    }
  }, [nucleus, nucleusSignature, persistWorkspace, workspace]);

  const saveWorkspaceChanges = React.useCallback(async () => {
    setIsSaving(true);
    try {
      const nextWorkspace = withWorkspaceTimestamp({
        ...workspace,
        nucleus_signature: nucleusSignature,
        model_used: workspace.study?.model_used || workspace.catalog_analysis?.model_used || workspace.model_used,
      });
      setWorkspace(nextWorkspace);
      await persistWorkspace(nextWorkspace, "Feedbacks e edições salvos no campo SkyBob do núcleo.");
    } catch (error) {
      toastApiError(error, "Não consegui salvar o feedback do SkyBob");
    } finally {
      setIsSaving(false);
    }
  }, [nucleusSignature, persistWorkspace, workspace]);

  const study = workspace.study;
  const resolvedHooks = React.useMemo(() => (study?.hooks || []).map((hook) => resolveHook(workspace, hook)), [study, workspace]);
  const resolvedCards = React.useMemo(() => (study?.cards || []).map((card) => resolveCard(workspace, card)), [study, workspace]);

  const hookFeedbackEntries = React.useMemo(() => sortFeedbackByDate(Object.values(workspace.hooks_feedback)), [workspace.hooks_feedback]);
  const cardFeedbackEntries = React.useMemo(() => sortFeedbackByDate(Object.values(workspace.cards_feedback)), [workspace.cards_feedback]);

  const likedHooks = hookFeedbackEntries.filter((entry) => entry.status === "like");
  const dislikedHooks = hookFeedbackEntries.filter((entry) => entry.status === "dislike");
  const pendingHooks = hookFeedbackEntries.filter((entry) => entry.status === null);
  const likedCards = cardFeedbackEntries.filter((entry) => entry.status === "like");
  const dislikedCards = cardFeedbackEntries.filter((entry) => entry.status === "dislike");
  const pendingCards = cardFeedbackEntries.filter((entry) => entry.status === null);

  const currentHookIds = new Set((study?.hooks || []).map((hook) => hook.id));
  const currentCardIds = new Set((study?.cards || []).map((card) => card.id));

  const currentHookEditors = React.useMemo(() => {
    return resolvedHooks.map((hook) => workspace.hooks_feedback[hook.id] ?? createHookFeedbackItem(hook));
  }, [resolvedHooks, workspace.hooks_feedback]);

  const currentCardEditors = React.useMemo(() => {
    return resolvedCards.map((card) => workspace.cards_feedback[card.id] ?? createCardFeedbackItem(card));
  }, [resolvedCards, workspace.cards_feedback]);

  const historicalHookEditors = React.useMemo(
    () => hookFeedbackEntries.filter((entry) => !currentHookIds.has(entry.id)),
    [currentHookIds, hookFeedbackEntries]
  );
  const historicalCardEditors = React.useMemo(
    () => cardFeedbackEntries.filter((entry) => !currentCardIds.has(entry.id)),
    [cardFeedbackEntries, currentCardIds]
  );

  const filledCount = React.useMemo(
    () => Object.values(nucleus || {}).filter((value) => ensureString(value).trim() && ensureString(value).trim() !== "não informado").length,
    [nucleus]
  );

  const isCatalogStale = workspace.nucleus_signature && workspace.nucleus_signature !== nucleusSignature;
  const detectedItems = workspace.catalog_analysis?.detected_items || [];

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 pb-24 sm:px-6 lg:px-8">
      <RocketHero />

      <div className="-mt-20 px-4 md:px-8">
        <Card className="border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(8,11,20,0.98))] backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">SkyBob Engine</div>
                <div className="text-2xl font-black tracking-tight">Pré-análise de catálogo + estudo refinável com memória</div>
                <p className="max-w-3xl text-sm leading-6 text-slate-300">
                  O núcleo atual tem {filledCount} campos preenchidos. Antes de rodar o estudo completo, o SkyBob primeiro normaliza serviços/produtos para reduzir generalismo.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="lg" onClick={() => void analyzeCatalog("Catálogo reanalisado e salvo no núcleo.")} isLoading={isAnalyzingCatalog} loadingLabel="Analisando catálogo">
                  <Database className="h-5 w-5" />
                  Reanalisar serviços/produtos
                </Button>
                <Button size="lg" onClick={() => void runStudy()} isLoading={isRunning} loadingLabel="Executando SkyBob">
                  <Rocket className="h-5 w-5" />
                  Iniciar SkyBob
                </Button>
                <Button variant="outline" size="lg" onClick={() => void rerunStudy()} isLoading={isRegenerating} loadingLabel="Refinando" disabled={!study}>
                  <RefreshCw className="h-5 w-5" />
                  Refinar hooks e estudo
                </Button>
                <Button variant="outline" size="lg" onClick={() => void saveWorkspaceChanges()} isLoading={isSaving} loadingLabel="Salvando">
                  <Save className="h-5 w-5" />
                  Salvar feedback e edições
                </Button>
              </div>
            </div>

            {isCatalogStale ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                O núcleo mudou desde a última análise. Reanalise os serviços/produtos para alinhar o próximo estudo.
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-5">
              <StatCard
                icon={<Layers3 className="h-4 w-4" />}
                title="Itens detectados"
                value={detectedItems.length}
                description="Serviços/produtos normalizados antes da geração."
              />
              <StatCard
                icon={<Lightbulb className="h-4 w-4" />}
                title="Hooks aprovados"
                value={likedHooks.length}
                description="Histórico salvo de hooks curtidos."
              />
              <StatCard
                icon={<Target className="h-4 w-4" />}
                title="Estudos aprovados"
                value={likedCards.length}
                description="Cards estratégicos aprovados e editáveis."
              />
              <StatCard
                icon={<Wand2 className="h-4 w-4" />}
                title="Feedback total"
                value={hookFeedbackEntries.length + cardFeedbackEntries.length}
                description="Tudo o que já foi avaliado ou editado."
              />
              <StatCard
                icon={<Sparkles className="h-4 w-4" />}
                title="Modelo do SkyBob"
                value={study?.model_used || workspace.catalog_analysis?.model_used || "—"}
                description="Execução principal do SkyBob agora prioriza GPT-5.4."
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-cyan-400/16">
                <CardHeader>
                  <CardTitle className="text-2xl">Serviços e produtos detectados no núcleo</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-300">
                    {workspace.catalog_analysis?.summary || "O SkyBob ainda está analisando o catálogo para reduzir generalismo na execução."}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-cyan-400/16">
                <CardHeader>
                  <CardTitle className="text-2xl">Feedback persistido</CardTitle>
                  <CardDescription className="text-slate-300">
                    Hooks curtidos: {likedHooks.length} · hooks rejeitados: {dislikedHooks.length} · estudos curtidos: {likedCards.length} · estudos rejeitados: {dislikedCards.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Hooks</div>
                    <div className="space-y-2 text-sm text-slate-200">
                      <div className="flex items-center justify-between"><span>Aprovados</span><Badge variant="green">{likedHooks.length}</Badge></div>
                      <div className="flex items-center justify-between"><span>Rejeitados</span><Badge variant="red">{dislikedHooks.length}</Badge></div>
                      <div className="flex items-center justify-between"><span>Sem feedback salvo</span><Badge variant="outline">{pendingHooks.length}</Badge></div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Estudos</div>
                    <div className="space-y-2 text-sm text-slate-200">
                      <div className="flex items-center justify-between"><span>Aprovados</span><Badge variant="green">{likedCards.length}</Badge></div>
                      <div className="flex items-center justify-between"><span>Rejeitados</span><Badge variant="red">{dislikedCards.length}</Badge></div>
                      <div className="flex items-center justify-between"><span>Sem feedback salvo</span><Badge variant="outline">{pendingCards.length}</Badge></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {detectedItems.length ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {detectedItems.map((item) => (
                  <CatalogItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-cyan-400/20 bg-white/[0.02]">
                <CardContent className="flex min-h-[160px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <Database className="h-12 w-12 text-cyan-200" />
                  <div className="space-y-2">
                    <div className="text-xl font-black tracking-tight">Ainda não há catálogo pré-analisado.</div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-300">
                      Use o botão de reanálise ou preencha melhor serviços/produtos no núcleo para a IA detectar o catálogo antes da execução.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {study ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-cyan-400/16">
              <CardHeader>
                <CardTitle className="text-2xl">Leitura estratégica do nicho</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-300">{study.overview}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-cyan-400/16">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl">Direção do Hook Lab</CardTitle>
                  <Badge variant="outline">{study.mode === "refine" ? "refino parcial" : "execução completa"}</Badge>
                  <Badge variant="outline">{study.model_used}</Badge>
                </div>
                <CardDescription className="text-slate-300">
                  {study.hook_strategy.positioning_summary || "O SkyBob vai usar seu feedback para aproximar os hooks do tom e do ângulo que você prefere."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Ângulos a priorizar</div>
                  <div className="space-y-2 text-sm text-slate-200">
                    {study.hook_strategy.preferred_angles.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Ângulos a reduzir</div>
                  <div className="space-y-2 text-sm text-slate-200">
                    {study.hook_strategy.angles_to_reduce.length ? (
                      study.hook_strategy.angles_to_reduce.map((item) => <div key={item}>{item}</div>)
                    ) : (
                      <div>Nenhum padrão rejeitado forte até agora.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-cyan-400/16">
              <CardHeader>
                <CardTitle className="text-2xl">Resumo tático do nicho</CardTitle>
                <CardDescription className="text-slate-300">A base do estudo completo fica preservada quando você clica em refinar.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-3">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Padrões</div>
                  <div className="space-y-2 text-sm text-slate-200">
                    {study.success_patterns.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Erros</div>
                  <div className="space-y-2 text-sm text-slate-200">
                    {study.mistakes.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Oportunidades</div>
                  <div className="space-y-2 text-sm text-slate-200">
                    {study.opportunities.map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-cyan-400/16">
              <CardHeader>
                <CardTitle className="text-2xl">Recomendações de calendário</CardTitle>
                <CardDescription className="text-slate-300">Direções rápidas para transformar o estudo em sequência de publicação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {study.calendar_recommendations.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-200">
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Hook Lab</h2>
                <p className="text-sm text-slate-300">
                  Ao refinar, o SkyBob só troca a direção de hooks e cards. A base do estudo acima continua como memória estável.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                Hooks curtidos: {likedHooks.length} · Hooks rejeitados: {dislikedHooks.length} · Modelo: {study.model_used}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resolvedHooks.map((hook) => (
                <HookLabCard key={hook.id} hook={hook} vote={workspace.hooks_feedback[hook.id]?.status ?? null} onVote={handleHookVote} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Cards estratégicos do estudo</h2>
                <p className="text-sm text-slate-300">Esses cards continuam editáveis e com feedback persistido no núcleo da empresa.</p>
              </div>
              <div className="text-sm text-slate-400">
                Estudos curtidos: {likedCards.length} · Estudos rejeitados: {dislikedCards.length}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {resolvedCards.map((card) => (
                <StudyCard key={card.id} card={card} vote={workspace.cards_feedback[card.id]?.status ?? null} onVote={handleCardVote} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <Card className="border-dashed border-cyan-400/20 bg-white/[0.02]">
          <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
            <Rocket className="h-12 w-12 text-cyan-200" />
            <div className="space-y-2">
              <div className="text-2xl font-black tracking-tight">O SkyBob ainda não foi iniciado.</div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                A pré-análise do catálogo já pode ser salva antes da execução completa. Depois, ao clicar em refinar, o SkyBob só troca hooks/cards com base no seu feedback.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-cyan-400/16">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl">Central de feedback de hooks</CardTitle>
              <Badge variant="outline">fica salvo no núcleo</Badge>
            </div>
            <CardDescription className="text-slate-300">
              Aqui ficam os hooks atuais e o histórico dos hooks que você já gostou, rejeitou ou editou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentHookEditors.length ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  <Edit3 className="h-4 w-4" />
                  Hooks da execução atual
                </div>
                {currentHookEditors.map((entry) => (
                  <HookFeedbackEditor
                    key={entry.id}
                    entry={entry}
                    onVote={handleHookVote}
                    onChange={handleHookChange}
                    onNotesChange={handleHookNotesChange}
                  />
                ))}
              </>
            ) : null}

            {historicalHookEditors.length ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Histórico salvo
                </div>
                {historicalHookEditors.map((entry) => (
                  <HookFeedbackEditor
                    key={entry.id}
                    entry={entry}
                    onVote={handleHookVote}
                    onChange={handleHookChange}
                    onNotesChange={handleHookNotesChange}
                  />
                ))}
              </>
            ) : null}

            {!currentHookEditors.length && !historicalHookEditors.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
                Nenhum hook recebeu feedback ainda. Quando você curtir, rejeitar ou editar um hook, ele aparece aqui.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-cyan-400/16">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl">Central de feedback do estudo</CardTitle>
              <Badge variant="outline">cards estratégicos persistidos</Badge>
            </div>
            <CardDescription className="text-slate-300">
              Visualize onde ficaram os estudos/cards curtidos ou rejeitados e edite antes de salvar no núcleo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentCardEditors.length ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  <Edit3 className="h-4 w-4" />
                  Cards da execução atual
                </div>
                {currentCardEditors.map((entry) => (
                  <CardFeedbackEditor
                    key={entry.id}
                    entry={entry}
                    onVote={handleCardVote}
                    onChange={handleCardChange}
                    onNotesChange={handleCardNotesChange}
                  />
                ))}
              </>
            ) : null}

            {historicalCardEditors.length ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Histórico salvo
                </div>
                {historicalCardEditors.map((entry) => (
                  <CardFeedbackEditor
                    key={entry.id}
                    entry={entry}
                    onVote={handleCardVote}
                    onChange={handleCardChange}
                    onNotesChange={handleCardNotesChange}
                  />
                ))}
              </>
            ) : null}

            {!currentCardEditors.length && !historicalCardEditors.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
                Nenhum card recebeu feedback ainda. Quando você curtir, rejeitar ou editar um card, ele aparece aqui.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="border-cyan-400/16">
          <CardHeader>
            <CardTitle className="text-lg">Hooks curtidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            {likedHooks.length ? likedHooks.map((entry) => <div key={entry.id}>{entry.item.hook}</div>) : <div>Nenhum ainda.</div>}
          </CardContent>
        </Card>
        <Card className="border-cyan-400/16">
          <CardHeader>
            <CardTitle className="text-lg">Hooks rejeitados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            {dislikedHooks.length ? dislikedHooks.map((entry) => <div key={entry.id}>{entry.item.hook}</div>) : <div>Nenhum ainda.</div>}
          </CardContent>
        </Card>
        <Card className="border-cyan-400/16">
          <CardHeader>
            <CardTitle className="text-lg">Estudos curtidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            {likedCards.length ? likedCards.map((entry) => <div key={entry.id}>{entry.item.title}</div>) : <div>Nenhum ainda.</div>}
          </CardContent>
        </Card>
        <Card className="border-cyan-400/16">
          <CardHeader>
            <CardTitle className="text-lg">Estudos rejeitados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-200">
            {dislikedCards.length ? dislikedCards.map((entry) => <div key={entry.id}>{entry.item.title}</div>) : <div>Nenhum ainda.</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-cyan-400/16">
        <CardHeader>
          <CardTitle className="text-xl">O que mudou no fluxo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-cyan-200"><Sparkles className="h-4 w-4" />Modelo</div>
            <div>O SkyBob agora prioriza GPT-5.4 na execução principal do estudo.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-cyan-200"><Database className="h-4 w-4" />Pré-análise</div>
            <div>Serviços/produtos são analisados antes da execução completa e já ficam visíveis na interface.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-cyan-200"><RefreshCw className="h-4 w-4" />Refinamento</div>
            <div>Refinar troca só hooks/cards com base no feedback, sem reescrever a fundação do estudo.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            <div className="mb-2 flex items-center gap-2 font-semibold text-cyan-200"><Save className="h-4 w-4" />Persistência</div>
            <div>Likes, dislikes e edições ficam serializados no campo SkyBob do núcleo da empresa.</div>
          </div>
        </CardContent>
      </Card>

      <div className="hidden">
        <XCircle />
      </div>
    </div>
  );
}
