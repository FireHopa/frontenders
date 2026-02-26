import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { CompanyProfile } from "@/hooks/useCompanyProfile";
import { cn } from "@/lib/utils";

type Field = {
  key: keyof CompanyProfile;
  title: string;
  hint?: string;
  placeholder?: string;
  required: boolean;
};

const FIELDS: Field[] = [
  { key: "companyName", title: "Nome da empresa", placeholder: "Ex: Clínica Exemplo", required: false },
  { key: "cityState", title: "Cidade e estado", hint: "Precisamos disso para achar concorrentes na mesma região.", placeholder: "Ex: Santos - SP", required: true },
  { key: "neighborhood", title: "Bairro", placeholder: "Ex: Gonzaga", required: false },
  { key: "segment", title: "Segmento do negócio", hint: "Ex: clínica estética, pizzaria, advogado", placeholder: "Ex: pizzaria", required: true },
  { key: "services", title: "Principais serviços ou produtos", hint: "Ex: implantes, limpeza, harmonização", placeholder: "Ex: implantes, limpeza", required: true },
  { key: "audience", title: "Público-alvo", hint: "Ex: mulheres 25 a 45, empresas, idosos", placeholder: "Ex: mulheres 25 a 45", required: true },
  { key: "serviceRegion", title: "Região de atendimento", hint: "Ex: somente minha cidade, região metropolitana, todo o Brasil", placeholder: "Ex: região metropolitana", required: true },
  { key: "differentiator", title: "Principal diferencial", placeholder: "Ex: atendimento, rapidez, premium", required: false },
  { key: "instagram", title: "Instagram da empresa", placeholder: "Ex: @minhaempresa", required: false },
  { key: "website", title: "Site da empresa", placeholder: "Ex: https://minhaempresa.com.br", required: false },
  { key: "brandWords", title: "3 palavras que descrevem a marca", hint: "Ex: moderno, direto, premium", placeholder: "Ex: moderno, direto, premium", required: false },
];

function isTextFieldTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = (t.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((t as any).isContentEditable) return true;
  return false;
}

export function CompetitorFindWizard({
  open,
  initialProfile,
  missingKeys,
  onClose,
  onComplete,
}: {
  open: boolean;
  initialProfile: CompanyProfile;
  missingKeys: Array<keyof CompanyProfile>;
  onClose: () => void;
  onComplete: (next: CompanyProfile) => void;
}) {
  const steps = React.useMemo(() => {
    // pergunta só o que está faltando (e só se for campo conhecido)
    const set = new Set(missingKeys.map(String));
    return FIELDS.filter((f) => set.has(String(f.key)));
  }, [missingKeys]);

  const [idx, setIdx] = React.useState(0);
  const [value, setValue] = React.useState("");
  const [draft, setDraft] = React.useState<CompanyProfile>(initialProfile);
  const [error, setError] = React.useState<string | null>(null);
  const [showSummary, setShowSummary] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDraft(initialProfile);
    setIdx(0);
    setShowSummary(false);
    setError(null);
  }, [open, initialProfile]);

  const step = steps[idx];
  const total = Math.max(steps.length, 1);
  const progress = steps.length ? Math.round(((idx) / total) * 100) : 100;

  React.useEffect(() => {
    if (!open) return;
    if (!step) return;
    setValue(String((draft as any)[step.key] ?? ""));
    setError(null);
  }, [open, step?.key]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Enter avança, mas SEM bloquear digitação normal (ex: espaço) e sem interferir fora do modal
      if (e.key === "Enter") {
        // se está digitando em input/textarea, a gente controla o avanço
        if (isTextFieldTarget(e.target)) {
          e.preventDefault();
          handleContinue();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [open, idx, value, showSummary, step?.key, draft]);

  const setField = (k: keyof CompanyProfile, v: string) => {
    setDraft((prev) => ({ ...prev, [k]: v }));
  };

  const validateCurrent = () => {
    if (!step) return true;
    const v = value.trim();
    if (step.required && !v) {
      setError("Precisamos dessa informação para encontrar concorrentes parecidos com você.");
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (showSummary) return;
    if (!step) {
      setShowSummary(true);
      return;
    }
    if (!validateCurrent()) return;

    setField(step.key, value.trim());
    const nextIdx = idx + 1;

    if (nextIdx >= steps.length) {
      setShowSummary(true);
    } else {
      setIdx(nextIdx);
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
      setIdx(Math.max(steps.length - 1, 0));
      return;
    }
    setIdx((v) => Math.max(v - 1, 0));
  };

  const handleSkip = () => {
    if (!step) return;
    if (step.required) return;
    setField(step.key, "");
    const nextIdx = idx + 1;
    if (nextIdx >= steps.length) setShowSummary(true);
    else setIdx(nextIdx);
  };

  const requiredStillMissing = React.useMemo(() => {
    const requiredKeys = FIELDS.filter((f) => f.required).map((f) => f.key);
    const missing = requiredKeys.filter((k) => !String((draft as any)[k] ?? "").trim());
    return missing;
  }, [draft]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onMouseDown={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-xl" onMouseDown={(e) => e.stopPropagation()}>
        <Card variant="glass" className="overflow-hidden rounded-3xl shadow-soft">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">Vamos achar concorrentes parecidos com você</CardTitle>
                <CardDescription>Responda rápido. É uma pergunta por vez.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{showSummary ? "Resumo" : `Passo ${Math.min(idx + 1, total)} de ${total}`}</span>
                <Badge variant="secondary">{showSummary ? "revisão" : `${progress}%`}</Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(0,200,232,0.08)]">
                <div
                  className={cn("h-full rounded-full bg-google-blue/60 transition-all")}
                  style={{ width: `${showSummary ? 100 : Math.max(progress, 5)}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {!showSummary ? (
              <>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{step?.title ?? "Tudo certo"}</div>
                  {step?.hint ? <div className="text-xs text-muted-foreground">{step.hint}</div> : null}
                </div>

                {step ? (
                  <>
                    <Input
                      autoFocus
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={step.placeholder}
                      className="bg-background/40"
                    />
                    {error ? <div className="text-xs text-[#FF5050]">{error}</div> : <div className="text-xs text-muted-foreground">Dica: Enter continua. Esc fecha.</div>}
                  </>
                ) : (
                  <div className="rounded-2xl border bg-background/40 p-4 text-sm text-muted-foreground">
                    Nada para perguntar agora. Você já preencheu o essencial.
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Confira se está tudo certo</div>
                <div className="rounded-2xl border bg-background/40 p-4 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FIELDS.filter((f) => String((draft as any)[f.key] ?? "").trim()).map((f) => (
                      <div key={String(f.key)} className="min-w-0">
                        <div className="text-xs text-muted-foreground">{f.title}</div>
                        <div className="truncate font-medium">{String((draft as any)[f.key])}</div>
                      </div>
                    ))}
                  </div>

                  {requiredStillMissing.length ? (
                    <div className="mt-3 rounded-xl border border-red-200/40 bg-[#FF5050]/5 p-3 text-xs text-[#FF5050]">
                      Falta preencher: {requiredStillMissing.map(String).join(", ")}.
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Fechar
              </Button>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={handleBack} disabled={idx === 0 && !showSummary} className="w-full sm:w-auto">
                  Voltar
                </Button>

                {!showSummary && step && !step.required ? (
                  <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
                    Pular
                  </Button>
                ) : null}

                {showSummary ? (
                  <Button
                    variant="accent"
                    onClick={() => {
                      if (requiredStillMissing.length) return;
                      onComplete(draft);
                    }}
                    disabled={requiredStillMissing.length > 0}
                    className="w-full sm:w-auto"
                  >
                    Buscar concorrentes agora
                  </Button>
                ) : (
                  <Button variant="accent" onClick={handleContinue} className="w-full sm:w-auto">
                    Continuar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
