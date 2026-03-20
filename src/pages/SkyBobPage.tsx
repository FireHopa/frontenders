import * as React from "react";
import { motion } from "framer-motion";
import { Rocket, ThumbsDown, ThumbsUp, RefreshCw, Save, Sparkles, Grip, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/robots";
import type { SkyBobCard, SkyBobRunResponse } from "@/types/api";
import { toastApiError, toastInfo, toastSuccess } from "@/lib/toast";

type VoteValue = "like" | "dislike" | null;
type VotesMap = Record<string, VoteValue>;

type MousePoint = { x: number; y: number };

const STORAGE_KEY = "ori_authority_nucleus_v1";
const FEEDBACK_KEY = "ori_skybob_feedback_v1";

function loadNucleus(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNucleus(next: Record<string, any>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function loadVotes(): VotesMap {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVotes(votes: VotesMap) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(votes));
}

function buildPreferences(study: SkyBobRunResponse | null, votes: VotesMap) {
  if (!study) return {};
  const liked = study.cards.filter((card) => votes[card.id] === "like");
  const disliked = study.cards.filter((card) => votes[card.id] === "dislike");
  return {
    liked_titles: liked.map((card) => card.title),
    disliked_titles: disliked.map((card) => card.title),
    liked_sections: Array.from(new Set(liked.map((card) => card.section))),
    disliked_sections: Array.from(new Set(disliked.map((card) => card.section))),
    feedback_summary: {
      likes: liked.length,
      dislikes: disliked.length,
    },
  };
}

function RocketHero() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [mouse, setMouse] = React.useState<MousePoint>({ x: 0.5, y: 0.5 });

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    setMouse({ x, y });
  };

  const rocketX = (mouse.x - 0.5) * 36;
  const rocketY = (0.5 - mouse.y) * 24;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top,rgba(0,200,232,0.20),transparent_40%),linear-gradient(180deg,rgba(8,11,20,0.94),rgba(8,11,20,1))] min-h-[520px]"
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{ x: (mouse.x - 0.5) * 18, y: (mouse.y - 0.5) * 18 }}
        transition={{ type: "spring", stiffness: 70, damping: 16, mass: 0.8 }}
      >
        <svg viewBox="0 0 1200 520" className="absolute inset-0 h-full w-full opacity-90">
          <defs>
            <linearGradient id="lineSky" x1="0" x2="1">
              <stop offset="0%" stopColor="rgba(77,232,255,0.18)" />
              <stop offset="100%" stopColor="rgba(77,232,255,0.92)" />
            </linearGradient>
          </defs>
          <path d="M20 450 C120 420, 170 410, 260 395 S420 330, 520 300 S710 220, 790 190 S980 100, 1180 45" fill="none" stroke="url(#lineSky)" strokeWidth="10" strokeLinecap="round" />
          <path d="M20 450 C120 420, 170 410, 260 395 S420 330, 520 300 S710 220, 790 190 S980 100, 1180 45" fill="rgba(77,232,255,0.08)" opacity="0.55" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 w-[280px] max-w-[62vw] -translate-x-1/2 -translate-y-1/2"
        animate={{ x: rocketX, y: rocketY, rotate: (mouse.x - 0.5) * 5 }}
        transition={{ type: "spring", stiffness: 90, damping: 18, mass: 0.7 }}
      >
        <svg viewBox="0 0 300 300" className="drop-shadow-[0_0_36px_rgba(0,200,232,0.35)]">
          <g>
            <ellipse cx="150" cy="242" rx="54" ry="18" fill="rgba(0,200,232,0.18)" />
            <path d="M154 250 C146 270,130 284,116 294 C120 274,125 257,138 242" fill="#EA4335" opacity="0.85" />
            <path d="M146 250 C154 270,170 284,184 294 C180 274,175 257,162 242" fill="#FBBC05" opacity="0.9" />
            <path d="M150 246 C144 265,145 285,150 300 C155 285,156 265,150 246" fill="#34A853" opacity="0.95" />
            <path d="M150 26 C196 58,220 112,220 164 C220 212,188 244,150 244 C112 244,80 212,80 164 C80 112,104 58,150 26 Z" fill="#F7FBFF" />
            <path d="M150 26 C196 58,220 112,220 164 C220 212,188 244,150 244" fill="#D9ECFF" opacity="0.65" />
            <circle cx="150" cy="128" r="34" fill="#4285F4" />
            <circle cx="150" cy="128" r="20" fill="#A8F4FF" opacity="0.85" />
            <path d="M92 182 L56 212 L82 150 Z" fill="#EA4335" />
            <path d="M208 182 L244 212 L218 150 Z" fill="#34A853" />
            <path d="M114 210 L90 246 L126 226 Z" fill="#4285F4" />
            <path d="M186 210 L210 246 L174 226 Z" fill="#FBBC05" />
          </g>
        </svg>
      </motion.div>

      <div className="absolute inset-x-0 top-0 p-8 md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
          <Sparkles className="h-4 w-4" />
          SkyBob
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Calendário editorial com inteligência de padrão, hook e formato.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
          O SkyBob lê o núcleo da empresa, identifica o que tende a performar no nicho e transforma isso em um estudo estratégico pronto para refinar com o seu gosto.
        </p>
      </div>
    </div>
  );
}

function DraggableCard({ card, vote, onVote, index }: { card: SkyBobCard; vote: VoteValue; onVote: (id: string, value: VoteValue) => void; index: number }) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.08}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="h-full border-cyan-400/15 bg-[linear-gradient(180deg,rgba(17,24,39,0.95),rgba(8,11,20,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <CardHeader className="space-y-4 pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
              <Grip className="h-3.5 w-3.5" />
              {card.section}
            </div>
            <CardTitle className="text-xl leading-tight">{card.title}</CardTitle>
          </div>
          <CardDescription className="text-sm leading-6 text-slate-300">{card.body}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {card.badges?.length ? (
            <div className="flex flex-wrap gap-2">
              {card.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {card.bullets?.length ? (
            <div className="space-y-2">
              {card.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-2 text-sm leading-6 text-slate-200">
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-3 pt-1">
            <Button variant={vote === "like" ? "default" : "outline"} size="sm" onClick={() => onVote(card.id, vote === "like" ? null : "like")}>
              <ThumbsUp className="h-4 w-4" />
              Gostei
            </Button>
            <Button variant={vote === "dislike" ? "destructive" : "outline"} size="sm" onClick={() => onVote(card.id, vote === "dislike" ? null : "dislike")}>
              <ThumbsDown className="h-4 w-4" />
              Não gostei
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SkyBobPage() {
  const [study, setStudy] = React.useState<SkyBobRunResponse | null>(null);
  const [votes, setVotes] = React.useState<VotesMap>(() => loadVotes());
  const [savedPreferences, setSavedPreferences] = React.useState<Record<string, any> | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const nucleus = React.useMemo(() => loadNucleus(), []);
  const filledCount = React.useMemo(
    () => Object.values(nucleus || {}).filter((value) => String(value ?? "").trim()).length,
    [nucleus]
  );

  const persistStudy = React.useCallback(async (nextStudy: SkyBobRunResponse) => {
    const nextNucleus = { ...loadNucleus(), skybob: nextStudy.serialized_text };
    saveNucleus(nextNucleus);
    try {
      await api.robots.businessCore.patch("business-core-global", { skybob: nextStudy.serialized_text } as any);
    } catch {
      // persist locally even if backend sync fails
    }
  }, []);

  const runStudy = React.useCallback(async () => {
    setIsRunning(true);
    try {
      const result = await api.skybob.run({ nucleus: loadNucleus() });
      setStudy(result);
      setVotes({});
      saveVotes({});
      setSavedPreferences(null);
      await persistStudy(result);
      toastSuccess("SkyBob gerado e salvo no núcleo da empresa.");
    } catch (err) {
      toastApiError(err, "Não consegui executar o SkyBob");
    } finally {
      setIsRunning(false);
    }
  }, [persistStudy]);

  const onVote = React.useCallback((id: string, value: VoteValue) => {
    setVotes((prev) => {
      const next = { ...prev, [id]: value };
      saveVotes(next);
      return next;
    });
  }, []);

  const savePreferenceProfile = React.useCallback(async () => {
    if (!study) {
      toastInfo("Gere um estudo antes de salvar preferências.");
      return;
    }
    setIsSaving(true);
    try {
      const preferences = buildPreferences(study, votes);
      setSavedPreferences(preferences);
      const nextText = `${study.serialized_text}\n\nPreferências observadas\n- Cards curtidos: ${(preferences.liked_titles || []).join(", ") || "nenhum"}\n- Cards evitados: ${(preferences.disliked_titles || []).join(", ") || "nenhum"}`;
      const nextNucleus = { ...loadNucleus(), skybob: nextText };
      saveNucleus(nextNucleus);
      try {
        await api.robots.businessCore.patch("business-core-global", { skybob: nextText } as any);
      } catch {
        // local storage remains as source of truth for the session
      }
      toastSuccess("Preferências salvas. Agora o SkyBob já pode regenerar mais alinhado.");
    } catch (err) {
      toastApiError(err, "Não consegui salvar suas preferências");
    } finally {
      setIsSaving(false);
    }
  }, [study, votes]);

  const rerunStudy = React.useCallback(async () => {
    if (!study) {
      toastInfo("Gere um estudo primeiro.");
      return;
    }
    const preferences = savedPreferences || buildPreferences(study, votes);
    setIsRegenerating(true);
    try {
      const result = await api.skybob.run({
        nucleus: loadNucleus(),
        preferences,
        previous_study: study,
      });
      setStudy(result);
      await persistStudy(result);
      toastSuccess("SkyBob regenerado com base no seu feedback.");
    } catch (err) {
      toastApiError(err, "Não consegui regenerar o SkyBob");
    } finally {
      setIsRegenerating(false);
    }
  }, [savedPreferences, study, votes, persistStudy]);

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 pb-24 sm:px-6 lg:px-8">
      <RocketHero />

      <div className="-mt-24 px-4 md:px-8">
        <Card className="border-cyan-400/20 bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(8,11,20,0.98))] backdrop-blur">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">SkyBob Engine</div>
              <div className="text-2xl font-black tracking-tight">Iniciar SkyBob</div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                O estudo vai consumir o núcleo atual da empresa. Hoje o seu núcleo tem {filledCount} campos preenchidos. Quanto mais contexto, mais fino fica o diagnóstico.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={runStudy} isLoading={isRunning} loadingLabel="Executando SkyBob">
                <Rocket className="h-5 w-5" />
                Iniciar SkyBob
              </Button>
              <Button variant="outline" size="lg" onClick={savePreferenceProfile} isLoading={isSaving} loadingLabel="Salvando" disabled={!study}>
                <Save className="h-5 w-5" />
                Salvar o que gostei
              </Button>
              <Button variant="outline" size="lg" onClick={rerunStudy} isLoading={isRegenerating} loadingLabel="Regenerando" disabled={!study}>
                <RefreshCw className="h-5 w-5" />
                Gerar novamente alinhado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {study ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-cyan-400/16">
              <CardHeader>
                <CardTitle className="text-2xl">Visão geral do nicho</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-300">{study.overview}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-cyan-400/16">
              <CardHeader>
                <CardTitle className="text-2xl">Resumo tático</CardTitle>
                <CardDescription className="text-slate-300">Os blocos abaixo já estão prontos para você arrastar, avaliar e refinar.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-3">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Padrões</div>
                  <div className="space-y-2 text-sm text-slate-200">{study.success_patterns.map((item) => <div key={item}>{item}</div>)}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Erros</div>
                  <div className="space-y-2 text-sm text-slate-200">{study.mistakes.map((item) => <div key={item}>{item}</div>)}</div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Oportunidades</div>
                  <div className="space-y-2 text-sm text-slate-200">{study.opportunities.map((item) => <div key={item}>{item}</div>)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Cards movíveis do estudo</h2>
                <p className="text-sm text-slate-300">Arraste os blocos, marque o que gostou e salve suas preferências antes de regenerar.</p>
              </div>
              <div className="text-sm text-slate-400">
                Curtidos: {Object.values(votes).filter((value) => value === "like").length} · Não curtidos: {Object.values(votes).filter((value) => value === "dislike").length}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {study.cards.map((card, index) => (
                <DraggableCard key={card.id} card={card} vote={votes[card.id] ?? null} onVote={onVote} index={index} />
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
                Clique em Iniciar SkyBob para gerar o estudo, transformar a resposta em cards movíveis e gravar esse material no núcleo da empresa.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
