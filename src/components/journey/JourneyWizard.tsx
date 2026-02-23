import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { useNavigate } from "react-router-dom";
import { JOURNEY_STEPS } from "@/constants/journey";
import type { BriefingIn, BusinessCoreIn } from "@/types/api";
import type { JourneyStep, Achievement } from "@/types/journey";
import { journeyReducer, initialJourneyState, validateField } from "@/state/journeyStore";
import { JourneyProgress } from "@/components/journey/JourneyProgress";
import { MônicaPanel } from "@/components/journey/CoachPanel";
import { RobotPreviewPanel } from "@/components/journey/RobotPreviewPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "@/components/journey/Sparkles";
import { ConfettiBurst } from "@/components/effects/ConfettiBurst";
import { transitions, fadeUp } from "@/lib/motion";
import { useCreateRobot } from "@/hooks/useRobots";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { api } from "@/services/robots"; 

const TONE_OPTIONS: Array<{ id: string; label: string; value: string }> = [
  { id: "professional_clear", label: "Profissional, direto e claro", value: "Profissional, direto, claro" },
  { id: "didactic_firm", label: "Didático e firme", value: "Didático, firme, sem rodeios" },
  { id: "authoritative_confident", label: "Autoritário e confiante", value: "Autoridade alta, confiante, sem hesitação" },
  { id: "friendly_expert", label: "Amigável, mas especialista", value: "Amigável, especialista, seguro" },
  { id: "other", label: "Outro (escrever manualmente)", value: "__OTHER__" },
];

function achievementsFrom(state: ReturnType<typeof initialJourneyState>): Achievement[] {
  const durationMs = Date.now() - state.startedAt;
  const durationMin = durationMs / 60000;

  const allFilled =
    state.values.company_name?.trim() &&
    state.values.niche?.trim() &&
    state.values.audience?.trim() &&
    state.values.offer?.trim();

  const out: Achievement[] = [];
  if (state.backCount === 0) {
    out.push({
      id: "perfect",
      title: "Jornada perfeita",
      description: "Você concluiu sem voltar etapas.",
      tone: "blue",
    });
  }
  if (durationMin <= 6) {
    out.push({
      id: "fast",
      title: "Criador ágil",
      description: "Concluiu em poucos minutos.",
      tone: "green",
    });
  }
  if (allFilled) {
    out.push({
      id: "complete",
      title: "Estrategista completo",
      description: "Preencheu o núcleo inteiro.",
      tone: "yellow",
    });
  }
  return out;
}

function coachHint(stepId: string) {
  switch (stepId) {
    case "company_name":
      return `Nome da empresa. Se já tem marca, use exatamente como nas redes.`;
    case "niche":
      return `Defina o recorte: "o quê" + "para quem" + "contexto".`;
    case "audience":
      return `Descreva pelo contexto e dor. Ex: "mulheres 25-45 buscando estética natural".`;
    case "offer":
      return `Sua promessa principal. Ex: "clareza em 7 dias" ou "consultoria em tráfego".`;
    case "region":
      return `Região ajusta vocabulário. Pode ser Brasil, ou a cidade para foco local.`;
    case "tone":
      return `Escolha um tom que você sustentaria todos os dias.`;
    case "competitors":
      return `Influenciadores ou empresas-modelo que ditam o nível da conversa.`;
    case "goals":
      return `Objetivo mensurável. Ex: mais agendamentos ou leads.`;
    case "real_differentials":
      return `Fase 2: Esqueça promessas vazias. Fale de método próprio, anos de mercado ou garantias.`;
    case "restrictions":
      return `Fase 2: Defenda a marca. O que o robô não pode fazer em hipótese alguma?`;
    case "site":
      return `Fase 2: URL de destino para onde o robô vai tentar converter.`;
    case "instagram":
      return `Fase 2: Seu @ oficial para o robô sugerir nas respostas.`;
    default:
      return `Vamos avançar com calma. Você sempre pode ajustar depois no painel.`;
  }
}

export function JourneyWizard() {
  const [state, dispatch] = React.useReducer(journeyReducer, undefined, initialJourneyState);
  const navigate = useNavigate();
  const createRobot = useCreateRobot();

  const step = JOURNEY_STEPS[state.stepIndex];
  const value = state.values[step.id] || "";

  const [showSpark, setShowSpark] = React.useState(false);
  const [coachMessage, setMônicaMessage] = React.useState(() => coachHint(JOURNEY_STEPS[0]?.id ?? "company_name"));
  const coachHistory = React.useRef<string[]>([]);
  const [completed, setCompleted] = React.useState<null | { publicId: string; title: string; achievements: Achievement[] }>(null);
  const [confetti, setConfetti] = React.useState(false);
  const [egg, setEgg] = React.useState(false);

  const [toneChoice, setToneChoice] = React.useState<string | null>(null);
  const [customTone, setCustomTone] = React.useState("");

  React.useEffect(() => {
    if (step.id !== "tone") return;

    const v = (value ?? "").toString();
    const preset = TONE_OPTIONS.find((o) => o.value !== "__OTHER__" && o.value === v);

    if (preset) {
      setToneChoice(preset.value);
      setCustomTone("");
      return;
    }

    if (v.trim().length > 0) {
      setToneChoice("__OTHER__");
      setCustomTone(v);
      return;
    }

    setToneChoice(null);
    setCustomTone("");
  }, [step.id, value]);

  const error = validateField(step.id as any, value);
  const isLast = state.stepIndex === JOURNEY_STEPS.length - 1;

  const canAdvance = !error;

  const setValue = (v: string) => dispatch({ type: "SET_VALUE", field: step.id as any, value: v });

  const onNext = async () => {
    dispatch({ type: "TOUCH", field: step.id as any });

    if (!canAdvance) return;

    if (value.trim().length > 0 || step.optional) {
      setShowSpark(true);
      window.setTimeout(() => setShowSpark(false), 700);
    }

    if (!isLast) {
      dispatch({ type: "NEXT" });
      return;
    }

    // --- MAGIA DA UNIFICAÇÃO (FASE 1 + FASE 2) ---
    
    // 1. Payload do Briefing (Gera o sistema do Robô)
    const briefingPayload: BriefingIn = {
      company_name: state.values.company_name?.trim() || "",
      niche: state.values.niche?.trim() || "",
      audience: state.values.audience?.trim() || "",
      offer: state.values.offer?.trim() || "",
      region: state.values.region?.trim() || "Brasil",
      tone: state.values.tone?.trim() || "Profissional, direto, claro",
      competitors: state.values.competitors?.trim() || "",
      goals: state.values.goals?.trim() || "Aumentar autoridade e ser citado por IA",
    };

    // 2. Payload do Núcleo da Empresa (Business Core)
    const corePayload: BusinessCoreIn = {
      company_name: state.values.company_name?.trim() || "",
      city_state: state.values.region?.trim() || "",
      main_audience: state.values.audience?.trim() || "",
      services_products: state.values.offer?.trim() || "",
      real_differentials: state.values.real_differentials?.trim() || "",
      restrictions: state.values.restrictions?.trim() || "",
      site: state.values.site?.trim() || "",
      instagram: state.values.instagram?.trim() || "",
    };

    try {
      // Cria o robô
      const created = await createRobot.mutateAsync(briefingPayload);
      
      // Imediatamente vincula o Business Core de forma invisível
      await api.robots.businessCore.patch(created.public_id, corePayload);

      toastSuccess("Robô e Núcleo Estratégico montados com sucesso.");
      setConfetti(true);
      window.setTimeout(() => setConfetti(false), 950);
      
      const ach = achievementsFrom(state as any);
      setMônicaMessage("Tudo certo! Estrutura montada.");
      setCompleted({ publicId: created.public_id, title: created.title, achievements: ach });
    } catch (e) {
      toastApiError(e, "Falha ao criar configuração");
    }
  };

  const onBack = () => {
    if (state.stepIndex === 0) return;
    dispatch({ type: "BACK" });
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void onNext();
    }
  };

  React.useEffect(() => {
    if (completed) return;

    const base = coachHint(step.id) ?? (step.helper ? step.helper : `Etapa: ${step.label}.`);
    const msg = step.optional ? `${base} (Opcional)` : base;

    const last = coachHistory.current[0];
    if (msg !== last) {
      coachHistory.current = [msg, ...coachHistory.current].slice(0, 6);
      setMônicaMessage(msg);
    }
  }, [step.id, completed, step.optional, step.helper, step.label]);

  React.useEffect(() => {
    if (!completed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCompleted(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [completed]);

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-hero" />
      <Particles />
      <Particles />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <JourneyProgress stepIndex={state.stepIndex} />

          <Card variant="glass" className="relative overflow-hidden">
            <Sparkles active={showSpark} />
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={step.accent as any}>
                  {step.label}
                </Badge>
                {step.optional ? <Badge variant="outline">opcional</Badge> : null}
              </div>
              <CardTitle className="mt-2 text-xl">Responda e avance.</CardTitle>
              <CardDescription>{step.helper}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeUp}
                  transition={transitions.base}
                  className="space-y-2"
                >
                  {step.id === "tone" ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {TONE_OPTIONS.map((opt) => {
                          const selected = toneChoice === opt.value;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setToneChoice(opt.value);
                                if (opt.value !== "__OTHER__") {
                                  setCustomTone("");
                                  setValue(opt.value);
                                } else {
                                  setValue(customTone);
                                }
                              }}
                              className={[
                                "w-full rounded-xl border px-4 py-3 text-left transition",
                                selected ? "border-google-blue/70 bg-google-blue/10" : "border-border/60 hover:bg-background/40",
                              ].join(" ")}
                            >
                              <div className="font-medium">{opt.label}</div>
                            </button>
                          );
                        })}
                      </div>

                      {toneChoice === "__OTHER__" ? (
                        <Input
                          autoFocus
                          value={customTone}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomTone(v);
                            setValue(v);
                          }}
                          onKeyDown={onKeyDown}
                          placeholder={step.placeholder}
                          aria-invalid={Boolean(error)}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <Input
                      autoFocus
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder={step.placeholder}
                      aria-invalid={Boolean(error)}
                    />
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs">
                      {error && state.touched[step.id] ? (
                        <span className="text-google-red">{error}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {step.optional ? "Pode deixar em branco e avançar." : "Obrigatório."}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {state.stepIndex + 1}/{JOURNEY_STEPS.length}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={onBack} disabled={state.stepIndex === 0}>
                  Voltar
                </Button>

                <div className="flex gap-2 sm:justify-end">
                  <Button
                    variant="glass"
                    onClick={() => {
                      setValue("");
                      dispatch({ type: "TOUCH", field: step.id as any });
                      void onNext();
                    }}
                  >
                    Pular
                  </Button>
                  <Button
                    variant="accent"
                    onClick={() => void onNext()}
                    isLoading={createRobot.isPending}
                    loadingLabel={isLast ? "Montando…" : "Avançando…"}
                  >
                    {isLast ? "Finalizar" : "Avançar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <MônicaPanel step={step as any} message={coachMessage} kind="phase" />
        </div>

        <div className="space-y-6">
          <RobotPreviewPanel values={state.values as unknown as BriefingIn} stepIndex={state.stepIndex} />

          <Card variant="glass">
            <CardContent className="p-5 space-y-3">
              <div className="text-sm font-semibold">Progresso Estratégico</div>
              <div className="text-xs text-muted-foreground">
                Fase 1: Configuração do Robô <br/>
                Fase 2: Construção do Núcleo
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion cinematic */}
      <AnimatePresence>
        {completed ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-background/40 p-4 backdrop-blur"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ConfettiBurst active={confetti} />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={transitions.slow}
              className="w-full max-w-xl"
            >
              <Card variant="glass" className="overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-google-blue/60 via-google-green/45 to-google-yellow/45" />
                <CardHeader>
                  <Badge variant="green">Robô e Núcleo criados</Badge>
                  <CardTitle className="mt-2 text-2xl">A inteligência está montada.</CardTitle>
                  <CardDescription>{completed.title} recebeu o briefing e os dados essenciais do núcleo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completed.achievements.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {completed.achievements.map((a) => (
                        <Badge key={a.id} variant={a.tone as any}>
                          {a.title}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {completed.achievements.some((a) => a.id === "perfect") ? (
                    <div className="rounded-2xl border bg-background/40 p-4 text-xs text-muted-foreground shadow-soft">
                      <div className="flex items-center justify-between gap-2">
                        <span>Easter egg</span>
                        <Button variant="ghost" size="sm" onClick={() => setEgg((v) => !v)}>
                          {egg ? "Fechar" : "Abrir"}
                        </Button>
                      </div>
                      {egg ? <div className="mt-2">Você concluiu sem voltar etapas. Isso é raro. 👀</div> : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4">
                    <Button variant="glass" onClick={() => navigate(`/robots/${completed.publicId}/business-core`)}>
                      Ver Núcleo
                    </Button>
                    <Button variant="accent" onClick={() => navigate(`/robots/${completed.publicId}`)}>
                      Ir para o chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}