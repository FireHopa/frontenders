import { http } from "@/services/http";
import type {
  CompetitionFindIn,
  CompetitionFindOut,
  CompetitionStartIn,
  CompetitionJobOut,
  CompetitionStatusOut,
  CompetitionResultOut,
} from "@/types/competition";

type BriefingBackend = {
  nome_empresa?: string;
  cidade_estado: string;
  bairro?: string;
  segmento: string;
  servicos: string;
  publico_alvo: string;
  regiao_atendimento: string;
  diferencial?: string;
  nivel_preco?: "popular" | "medio" | "premium";
  objetivo?: string;
  instagram?: string;
  site?: string;
  palavras_marca?: string[];
};

function mapBriefingToBackend(b: CompetitionFindIn): BriefingBackend {
  return {
    nome_empresa: b.company_name || undefined,
    cidade_estado: (b.city_state || "").trim(),
    bairro: b.neighborhood || undefined,
    segmento: (b.niche || "").trim(),
    servicos: (b.services || "").trim(),
    publico_alvo: (b.audience || "").trim(),
    regiao_atendimento: (b.service_region || "").trim(),
    diferencial: b.differentiator || undefined,
    nivel_preco: b.price_level,
    objetivo: b.business_goal || undefined,
    instagram: b.instagram || undefined,
    site: b.website || undefined,
    palavras_marca: b.brand_words?.length ? b.brand_words : undefined,
  };
}

function mapCompanyToBackend(company?: any): Partial<BriefingBackend> | undefined {
  if (!company) return undefined;
  // company can be CompetitionBriefing; map the same fields but keep optional
  const b = company as CompetitionFindIn;
  const mapped = mapBriefingToBackend({
    company_name: b.company_name,
    city_state: b.city_state,
    neighborhood: b.neighborhood,
    niche: b.niche || "",
    services: b.services,
    audience: b.audience,
    service_region: b.service_region,
    differentiator: b.differentiator,
    price_level: b.price_level,
    business_goal: b.business_goal,
    instagram: b.instagram,
    website: b.website,
    brand_words: b.brand_words,
  });
  // For analyze, allow missing requireds; backend will decide partial_data
  return mapped;
}

export const competition = {
  // new backend endpoints
  findCompetitors: (body: CompetitionFindIn) =>
    http<CompetitionFindOut>("/api/competition/find-competitors", { method: "POST", json: { briefing: mapBriefingToBackend(body) } }),

  analyze: (body: CompetitionStartIn) =>
    http<CompetitionJobOut>("/api/competition/analyze", {
      method: "POST",
      json: {
        instagrams: body.instagrams,
        sites: body.sites,
        briefing: mapCompanyToBackend(body.company),
      },
    }),

  job: (jobId: string) => http<CompetitionStatusOut>(`/api/competition/jobs/${jobId}`),
  report: (reportId: string) => http<CompetitionResultOut>(`/api/competition/reports/${reportId}`),

  // compatibility (older routes)
  find: (body: CompetitionFindIn) =>
    http<CompetitionFindOut>("/api/competition/find", { method: "POST", json: body }),
  start: (body: CompetitionStartIn) =>
    http<CompetitionJobOut>("/api/competition/analyses", { method: "POST", json: body }),
  status: (analysisId: string) =>
    http<CompetitionStatusOut>(`/api/competition/analyses/${analysisId}/status`),
  result: (analysisId: string) =>
    http<CompetitionResultOut>(`/api/competition/analyses/${analysisId}/result`),
};
