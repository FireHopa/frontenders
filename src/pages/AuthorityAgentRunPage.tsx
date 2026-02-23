import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResultViewer from "@/components/authority/ResultViewer";
import { api, getClientId } from "@/services/robots";

// NOTE: mantém a UX consistente com o dashboard: cards + botões + shadow leve.
// Esta página:
// 1) coleta "núcleo do negócio" em passos (wizard)
// 2) executa o agente
// 3) mostra resultado bonito + aba "JSON bruto" + ações (copiar / baixar)

type Nucleus = {
  company_name: string;
  city_state: string;
  service_area: "local" | "nacional" | "não informado";
  main_audience: string;
  services_or_products: string;
  real_differentials: string;
  restrictions: string;

  social_reviews: string;
  social_testimonials: string;
  reusable_links_texts: string;
  cannot_publish: string;

  site: string;
  google_business_profile: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
};

const EMPTY: Nucleus = {
  company_name: "",
  city_state: "",
  service_area: "não informado",
  main_audience: "",
  services_or_products: "",
  real_differentials: "",
  restrictions: "",

  social_reviews: "",
  social_testimonials: "",
  reusable_links_texts: "",
  cannot_publish: "",

  site: "",
  google_business_profile: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  tiktok: "",
};

const STEPS: Array<{
  title: string;
  fields: Array<{ key: keyof Nucleus; label: string; placeholder?: string; multiline?: boolean; options?: string[] }>;
}> = [
  {
    title: "Núcleo do negócio",
    fields: [
      { key: "company_name", label: "Nome da empresa", placeholder: "Ex: Casa do ADS" },
      { key: "city_state", label: "Cidade e estado", placeholder: "Ex: São Paulo - SP" },
      { key: "service_area", label: "Tipo de atendimento", options: ["local", "nacional", "não informado"] },
      { key: "main_audience", label: "Público principal", placeholder: "Ex: pequenas e médias empresas" },
      { key: "services_or_products", label: "Lista de serviços ou produtos", placeholder: "Liste os principais", multiline: true },
      { key: "real_differentials", label: "Diferenciais reais", placeholder: "O que você faz melhor (sem inventar)", multiline: true },
      { key: "restrictions", label: "Restrições (o que não pode prometer ou dizer)", multiline: true },
    ],
  },
  {
    title: "Prova social",
    fields: [
      { key: "social_reviews", label: "Possui avaliações? Onde?", placeholder: "Ex: Google / Doctoralia / iFood", multiline: true },
      { key: "social_testimonials", label: "Possui depoimentos? Onde?", placeholder: "Ex: WhatsApp / Instagram / vídeo", multiline: true },
      { key: "reusable_links_texts", label: "Links ou textos que podem ser usados", multiline: true },
      { key: "cannot_publish", label: "O que não pode ser publicado", multiline: true },
    ],
  },
  {
    title: "Plataformas",
    fields: [
      { key: "site", label: "Site", placeholder: "URL ou 'não informado'", multiline: true },
      { key: "google_business_profile", label: "Perfil de Empresa no Google", placeholder: "URL ou 'não informado'", multiline: true },
      { key: "instagram", label: "Instagram", placeholder: "@ ou URL", multiline: true },
      { key: "linkedin", label: "LinkedIn", placeholder: "URL", multiline: true },
      { key: "youtube", label: "YouTube", placeholder: "URL", multiline: true },
      { key: "tiktok", label: "TikTok", placeholder: "URL", multiline: true },
    ],
  },
];

function ensureValue(v: string) {
  const t = (v || "").trim();
  return t ? t : "não informado";
}

export default function AuthorityAgentRunPage() {
  const nav = useNavigate();
  const { agentKey } = useParams<{ agentKey: string }>();

  const [step, setStep] = useState(0);
  const [nucleus, setNucleus] = useState<Nucleus>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"visual" | "raw">("visual");

  const canBack = step > 0 && !loading;
  const canNext = step < STEPS.length - 1 && !loading;

  const normalizedPayload = useMemo(() => {
    // Normaliza vazio => "não informado" (regra do produto)
    return {
      company_name: ensureValue(nucleus.company_name),
      city_state: ensureValue(nucleus.city_state),
      service_area: nucleus.service_area || "não informado",
      main_audience: ensureValue(nucleus.main_audience),
      services_or_products: ensureValue(nucleus.services_or_products),
      real_differentials: ensureValue(nucleus.real_differentials),
      restrictions: ensureValue(nucleus.restrictions),

      social_reviews: ensureValue(nucleus.social_reviews),
      social_testimonials: ensureValue(nucleus.social_testimonials),
      reusable_links_texts: ensureValue(nucleus.reusable_links_texts),
      cannot_publish: ensureValue(nucleus.cannot_publish),

      site: ensureValue(nucleus.site),
      google_business_profile: ensureValue(nucleus.google_business_profile),
      instagram: ensureValue(nucleus.instagram),
      linkedin: ensureValue(nucleus.linkedin),
      youtube: ensureValue(nucleus.youtube),
      tiktok: ensureValue(nucleus.tiktok),
    };
  }, [nucleus]);

  async function run() {
    if (!agentKey) {
      setErr("Agente inválido.");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const clientId = getClientId();
      const payload = {
        client_id: clientId,
        agent_key: agentKey,
        nucleus: normalizedPayload,
      };
      const data = await api.authorityAgents.runGlobal(payload);
      setResult(data);
      setTab("visual");
      // volta pro topo do resultado
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (e: any) {
      // backend manda 429 com retry_after_seconds
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Falha ao executar. Verifique o backend (terminal) e tente novamente.";
      setErr(String(msg));
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof Nucleus>(key: K, value: string) {
    setNucleus((prev) => ({ ...prev, [key]: value }));
  }

  function markNotInformedForStep() {
    const keys = STEPS[step].fields.map((f) => f.key);
    setNucleus((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        // @ts-ignore
        next[k] = "não informado";
      }
      return next;
    });
  }

  function copyResult() {
    const txt = String(result?.output_text ?? "");
    if (!txt) return;
    navigator.clipboard.writeText(txt);
  }

  function downloadFile(ext: "md" | "txt") {
    const txt = String(result?.output_text ?? "");
    if (!txt) return;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agente-${agentKey}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const visualText = String(result?.output_text ?? "");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Agentes de Autoridade</div>
          <h1 className="text-xl font-semibold text-slate-900">
            Execução: <span className="capitalize">{agentKey || "—"}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => nav("/authority-agents")}
            disabled={loading}
          >
            Voltar
          </button>
        </div>
      </div>

      {/* Wizard */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">
              Passo {step + 1} de {STEPS.length}
            </div>
            <h2 className="text-base font-semibold text-slate-900">{STEPS[step].title}</h2>
          </div>

          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={markNotInformedForStep}
            disabled={loading}
            title="Preenche este passo com 'não informado'"
          >
            Marcar este passo como “não informado”
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS[step].fields.map((f) => {
            const v = nucleus[f.key] as any;
            const isSelect = Array.isArray(f.options);
            return (
              <div key={String(f.key)} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-800">{f.label}</label>

                {isSelect ? (
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                    value={String(v)}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    disabled={loading}
                  >
                    {f.options!.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : f.multiline ? (
                  <textarea
                    className="min-h-[96px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                    value={String(v)}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    disabled={loading}
                  />
                ) : (
                  <input
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                    value={String(v)}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    disabled={loading}
                  />
                )}
              </div>
            );
          })}
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={!canBack}
            >
              Voltar passo
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canNext}
            >
              Próximo passo
            </button>
          </div>

          <button
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
            onClick={run}
            disabled={loading}
          >
            {loading ? "Executando..." : "Executar agente"}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {result ? (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  tab === "visual" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
                }`}
                onClick={() => setTab("visual")}
              >
                Visual
              </button>
              <button
                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                  tab === "raw" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700"
                }`}
                onClick={() => setTab("raw")}
              >
                JSON bruto
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={copyResult}
              >
                Copiar texto
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => downloadFile("md")}
              >
                Baixar .md
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => downloadFile("txt")}
              >
                Baixar .txt
              </button>
            </div>
          </div>

          {tab === "visual" ? (
            <ResultViewer title="Resultado" text={visualText} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
