import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CompetitionResult } from "@/types/competition";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { Sparkles, TrendingUp, Shield, TriangleAlert } from "lucide-react";

function scoreBadge(v: number) {
  if (v >= 80) return "green";
  if (v >= 60) return "blue";
  if (v >= 40) return "yellow";
  return "red";
}

export function CompetitionResults({ result }: { result: CompetitionResult }) {
  const company = result.company;

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Resumo da comparação</CardTitle>
              <CardDescription>Notas de 0 a 100 com base no que aparece publicamente (site e redes).</CardDescription>
            </div>
            <Badge variant={scoreBadge(company.signals.perceived_authority)}>autoridade {company.signals.perceived_authority}</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            ["Presença", company.signals.presence],
            ["Clareza", company.signals.offer_clarity],
            ["Comunicação", company.signals.communication],
            ["Frequência", company.signals.content_frequency],
            ["Posicionamento", company.signals.positioning],
            ["Autoridade", company.signals.perceived_authority],
          ].map(([label, v]) => (
            <div key={label as string} className="rounded-2xl border bg-background/40 p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-2xl font-semibold">{v as number}</div>
                <Badge variant={scoreBadge(v as number)}>{label}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Autoridade / Clareza / Presença</CardTitle>
            <CardDescription>Comparação rápida por concorrente.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.comparisons.bar}>
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="authority" />
                <Bar dataKey="clarity" />
                <Bar dataKey="presence" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Radar estratégico</CardTitle>
            <CardDescription>Sua empresa vs melhor concorrente (por métrica).</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={result.comparisons.radar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Tooltip />
                <Radar dataKey="company" />
                <Radar dataKey="best_competitor" />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Principais pontos</CardTitle>
          <CardDescription>Clareza, oportunidades e recomendações acionáveis.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {result.insights.map((it, idx) => {
            const Icon =
              it.type === "strength" ? Shield : it.type === "opportunity" ? TrendingUp : it.type === "recommendation" ? Sparkles : TriangleAlert;
            const v = it.priority === "high" ? "red" : it.priority === "medium" ? "yellow" : "blue";
            return (
              <div key={idx} className="rounded-2xl border bg-background/40 p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-background/40 shadow-soft">
                    <Icon className="h-5 w-5 text-foreground/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{it.title}</div>
                      <Badge variant={v}>{it.priority}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{it.text}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Recomendações práticas</CardTitle>
          <CardDescription>Plano curto para ganhar autoridade com rapidez.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {result.recommendations.map((r, idx) => (
            <div key={idx} className="rounded-2xl border bg-background/40 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{r.title}</div>
                <Badge variant={r.expected_impact === "high" ? "green" : r.expected_impact === "medium" ? "blue" : "secondary"}>
                  impacto {r.expected_impact}
                </Badge>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {r.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
