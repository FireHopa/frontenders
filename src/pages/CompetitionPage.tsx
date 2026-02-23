import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CompetitionForm } from "@/components/competition/CompetitionForm";
import { CompetitionStateCard } from "@/components/competition/CompetitionStateCard";
import { CompetitionResults } from "@/components/competition/CompetitionResults";
import { useCompetitionFind, useCompetitionAnalyze, useCompetitionJob, useCompetitionReport } from "@/hooks/useCompetition";
import { toastInfo, toastSuccess } from "@/lib/toast";
import type { CompetitionBriefing } from "@/types/competition";

function cleanList(v: string[]) {
  return v
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}


function getBriefingForSearch(existing?: Partial<CompetitionBriefing>): CompetitionBriefing {
  // Try localStorage first
  const stored = (() => {
    try {
      const raw = localStorage.getItem("competition_briefing_v1");
      return raw ? (JSON.parse(raw) as Partial<CompetitionBriefing>) : {};
    } catch {
      return {};
    }
  })();

  const base: CompetitionBriefing = {
    company_name: existing?.company_name ?? stored.company_name ?? "",
    city_state: existing?.city_state ?? stored.city_state ?? "",
    neighborhood: existing?.neighborhood ?? stored.neighborhood ?? "",
    niche: existing?.niche ?? stored.niche ?? "",
    services: existing?.services ?? stored.services ?? "",
    audience: existing?.audience ?? stored.audience ?? "",
    service_region: existing?.service_region ?? stored.service_region ?? "",
    differentiator: existing?.differentiator ?? stored.differentiator ?? "",
    price_level: existing?.price_level ?? stored.price_level,
    business_goal: existing?.business_goal ?? stored.business_goal ?? "",
    instagram: existing?.instagram ?? stored.instagram ?? "",
    website: existing?.website ?? stored.website ?? "",
    brand_words: existing?.brand_words ?? stored.brand_words ?? [],
  };

  // Ask only what is missing (required for search quality)
  const ask = (label: string, current: string) => {
    const v = window.prompt(label, current || "");
    return (v ?? "").trim();
  };

  if (!base.city_state) base.city_state = ask("Qual é sua cidade e estado? (ex: São Paulo - SP)", base.city_state);
  if (!base.niche) base.niche = ask("Qual é o segmento do seu negócio? (ex: clínica estética, pizzaria)", base.niche);
  if (!base.services) base.services = ask("Quais são os principais serviços/produtos? (ex: implantes, limpeza)", base.services);
  if (!base.audience) base.audience = ask("Qual é o seu público-alvo? (ex: mulheres 25-45, empresas)", base.audience);
  if (!base.service_region) base.service_region = ask("Qual região você atende? (ex: minha cidade, região metropolitana, todo Brasil)", base.service_region);

  // Persist for next time
  try {
    localStorage.setItem("competition_briefing_v1", JSON.stringify(base));
  } catch {}

  return base;
}


function guessFromInputs(instagrams: string[], sites: string[]): CompetitionBriefing {
  // Minimal placeholders; ideally you will have a saved profile/briefing.
  return {
    city_state: "",
    niche: "",
    services: "",
    audience: "",
    service_region: "",
    instagram: instagrams.find((x) => x.trim().startsWith("@"))?.trim(),
    website: sites.find((x) => x.trim().startsWith("http"))?.trim() ?? sites.find((x) => x.trim())?.trim(),
  };
}

export function CompetitionPage() {
  const [instagrams, setInstagrams] = React.useState<string[]>(["", ""]);
  const [sites, setSites] = React.useState<string[]>([""]);

  const [jobId, setJobId] = React.useState<string | null>(null);
  const [reportId, setReportId] = React.useState<string | null>(null);
  const [hasStarted, setHasStarted] = React.useState(false);

  const find = useCompetitionFind();
  const analyze = useCompetitionAnalyze();

  const jobQ = useCompetitionJob(jobId, hasStarted);
  const finalStatus = jobQ.data?.status;
  const reportQ = useCompetitionReport(reportId, finalStatus === "done" || finalStatus === "partial_data");

  React.useEffect(() => {
    if (!jobQ.data) return;
    if (jobQ.data.report_id && !reportId) setReportId(jobQ.data.report_id);
    // Some backends only return report_id on completion; handle that too.
    if ((jobQ.data.status === "done" || jobQ.data.status === "partial_data") && jobQ.data.report_id) {
      setReportId(jobQ.data.report_id);
    }
  }, [jobQ.data, reportId]);

  const canStart = cleanList(instagrams).length + cleanList(sites).length > 0;

  const state: "empty" | "loading" | "analyzing" | "result" | "error" =
    !hasStarted
      ? "empty"
      : jobQ.isLoading
        ? "loading"
        : jobQ.data?.status === "error"
          ? "error"
          : jobQ.data?.status === "done" || jobQ.data?.status === "partial_data"
            ? "result"
            : "analyzing";

  const onFind = async () => {
    // NOTE: ideally collect briefing via guided modal, but for now send minimal inputs.
    toastInfo("Procurando concorrentes…");
    const briefing = getBriefingForSearch(guessFromInputs(instagrams, sites));

    // Backend pode validar campos obrigatórios; garantimos aqui antes de chamar.
    if (!briefing.city_state || !briefing.niche || !briefing.services || !briefing.audience || !briefing.service_region) {
      toastInfo("Preencha as informações básicas para buscar concorrentes.");
      return;
    }

    const res = await find.mutateAsync({ briefing: {
      company_name: briefing.company_name || undefined,
      city_state: briefing.city_state,
      neighborhood: briefing.neighborhood || undefined,
      niche: briefing.niche || "negócio",
      services: briefing.services,
      audience: briefing.audience,
      service_region: briefing.service_region,
      differentiator: briefing.differentiator || undefined,
      price_level: briefing.price_level,
      business_goal: briefing.business_goal || undefined,
      instagram: briefing.instagram || undefined,
      website: briefing.website || undefined,
      brand_words: briefing.brand_words?.length ? briefing.brand_words : undefined,
    }});

    if (res.suggestions?.length) {
      const nextIg = [...instagrams];
      const nextWs = [...sites];

      for (const s of res.suggestions) {
        if (s.instagram) {
          const idx = nextIg.findIndex((x) => !x.trim());
          if (idx !== -1) nextIg[idx] = s.instagram;
        }
        if (s.website_url) {
          const idx2 = nextWs.findIndex((x) => !x.trim());
          if (idx2 !== -1) nextWs[idx2] = s.website_url;
        }
      }

      setInstagrams(nextIg);
      setSites(nextWs);
      toastSuccess("Sugestões aplicadas.");
    } else {
      toastInfo(res.note ?? "Sem sugestões no momento.");
    }
  };

  const onStart = async () => {
    const ig = cleanList(instagrams);
    const ws = cleanList(sites);

    const briefing = guessFromInputs(ig, ws);

    const job = await analyze.mutateAsync({ instagrams: ig, sites: ws, company: briefing });
    setJobId(job.job_id);
    setReportId(job.report_id ?? null);
    setHasStarted(true);
  };

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-2xl">Análise da concorrência</CardTitle>
          <CardDescription>
            Compare posicionamento, clareza e autoridade percebida. Caso faltem dados, a análise será marcada como “Dados incompletos”.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CompetitionForm
              instagrams={instagrams}
              sites={sites}
              onChangeInstagrams={setInstagrams}
              onChangeSites={setSites}
              onFind={() => void onFind()}
              onStart={() => void onStart()}
              canStart={canStart}
              busy={find.isPending || analyze.isPending || jobQ.isFetching}
            />
          </div>

          <div className="lg:col-span-1">
            <CompetitionStateCard
              state={state === "result" && jobQ.data?.status === "partial_data" ? "analyzing" : state}
              stage={jobQ.data?.stage}
              progress={jobQ.data?.progress}
              note={jobQ.data?.error ?? jobQ.data?.warning ?? undefined}
            />
          </div>
        </CardContent>
      </Card>

      {state === "result" && reportQ.data?.result ? (
        <div className="space-y-4">
          {jobQ.data?.status === "partial_data" ? (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Dados incompletos</CardTitle>
                <CardDescription>
                  Parte das informações não foi encontrada. A análise abaixo é útil, mas pode ficar mais precisa com mais dados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border bg-background/40 p-4 text-sm text-muted-foreground shadow-soft">
                  Dica: informe o site/Instagram da sua empresa e tente novamente, ou adicione concorrentes mais claros.
                </div>
              </CardContent>
            </Card>
          ) : null}
          <CompetitionResults result={reportQ.data.result} />
        </div>
      ) : state === "empty" ? (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Nada analisado ainda</CardTitle>
            <CardDescription>Comece adicionando concorrentes acima.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-background/40 p-6 text-sm text-muted-foreground shadow-soft">
              Dica: você pode usar “Procurar concorrentes com IA” para preencher exemplos rapidamente e depois ajustar manualmente.
            </div>
          </CardContent>
        </Card>
      ) : state === "error" ? (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Não foi possível concluir</CardTitle>
            <CardDescription>Tente novamente ou ajuste os concorrentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-background/40 p-6 text-sm text-muted-foreground shadow-soft">
              {jobQ.data?.error ?? "Erro desconhecido."}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default CompetitionPage;
