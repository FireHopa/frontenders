import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompetitionAIResult, CompetitionAIEntity, DimensionKey } from "@/types/api";
import { MiniBars } from "@/components/competition/MiniBars";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

function pickValues(ent: CompetitionAIEntity): Partial<Record<DimensionKey, number>> {
  const out: any = {};
  for (const [k, v] of Object.entries(ent.dimensions || {})) {
    if (typeof (v as any)?.score === "number") out[k] = (v as any).score;
  }
  return out;
}

export function CompetitionResultView({ result }: { result: CompetitionAIResult }) {
  const competitors = result.competitors ?? [];
  const company = result.company;

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Resultado</CardTitle>
              <CardDescription>Veja onde você está melhor e onde pode melhorar primeiro.</CardDescription>
            </div>
            <Badge variant="blue" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Análise automática
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {company ? (
            <Card variant="glass" className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Sua empresa</CardTitle>
                <CardDescription className="truncate">{company.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <MiniBars label="Notas" values={pickValues(company)} />
              </CardContent>
            </Card>
          ) : (
            <Card variant="glass" className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Sua empresa</CardTitle>
                <CardDescription>Dados incompletos para calcular todas as notas.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Dica: preencha mais dados da sua empresa para melhorar o resultado.
              </CardContent>
            </Card>
          )}

          <Card variant="glass" className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Concorrentes</CardTitle>
              <CardDescription>{competitors.length} analisados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitors.map((c, i) => (
                <div key={i} className="rounded-2xl border bg-background/35 p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{c.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.input?.instagram ?? ""} {c.input?.site ? "• " + c.input.site : ""}
                      </div>
                    </div>
                    <Badge variant="secondary">#{i + 1}</Badge>
                  </div>
                  <div className="mt-4">
                    <MiniBars label="Notas" values={pickValues(c)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Oportunidades
            </CardTitle>
            <CardDescription>Onde você pode ganhar autoridade com vantagem real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(result.comparison?.opportunities ?? []).slice(0, 6).map((x, i) => (
              <div key={i} className="rounded-2xl border bg-background/35 p-4 text-sm shadow-soft">
                {x}
              </div>
            ))}
            {!(result.comparison?.opportunities?.length) ? (
              <div className="text-sm text-muted-foreground">Sem oportunidades explícitas. Refinar sinais melhora o output.</div>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Recomendações práticas
            </CardTitle>
            <CardDescription>Ações diretas para executar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(result.recommendations ?? []).slice(0, 4).map((r, i) => (
              <div key={i} className="rounded-2xl border bg-background/35 p-4 shadow-soft">
                <div className="text-sm font-semibold">{r.title}</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {(r.steps ?? []).slice(0, 4).map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
            {!(result.recommendations?.length) ? (
              <div className="text-sm text-muted-foreground">Sem recomendações. Isso indica pouco material coletado.</div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Insights
          </CardTitle>
          <CardDescription>Leituras rápidas do cenário.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {(result.insights ?? []).slice(0, 8).map((it, i) => (
            <div key={i} className="rounded-2xl border bg-background/35 p-4 shadow-soft">
              <div className="text-sm font-semibold">{it.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{it.detail}</div>
            </div>
          ))}
          {!(result.insights?.length) ? (
            <div className="text-sm text-muted-foreground">Nenhum insight retornado.</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
