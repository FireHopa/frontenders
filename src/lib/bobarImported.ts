
import type { BobarCard, BobarFlowchart, CreateBobarCardIn } from "@/services/bobar";

export type ImportedTimelineItem = {
  tempo: string;
  acao: string;
  fala: string;
};

export type ImportedScriptPayload = {
  titulo_da_tela: string;
  analise_do_tema: string;
  estrategia_do_video: string;
  formato_do_video: string;
  hooks: string[];
  roteiro_segundo_a_segundo: ImportedTimelineItem[];
  texto_na_tela: string[];
  variacoes: string[];
  legenda: string;
};

function safeText(value: unknown): string {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeText(item))
    .filter(Boolean);
}

function safeTimeline(value: unknown): ImportedTimelineItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return {
          tempo: safeText(record.tempo || record.time || `Trecho ${index + 1}`),
          acao: safeText(record.acao || record.action),
          fala: safeText(record.fala || record.speech || record.text),
        };
      }

      const text = safeText(item);
      if (!text) return null;

      return {
        tempo: `Trecho ${index + 1}`,
        acao: "",
        fala: text,
      };
    })
    .filter((item): item is ImportedTimelineItem => Boolean(item));
}

function buildFormatoDoVideo(raw: Record<string, unknown>): string {
  const explicit = safeText(raw.formato_do_video || raw.formato || raw.video_format);
  if (explicit) return explicit;

  const parts: string[] = [];
  const selected = safeText(raw.video_format_selected);
  const recommended = safeText(raw.video_format_recommended);
  const rationale = safeText(raw.video_format_rationale);

  if (selected) parts.push(`Formato escolhido: ${selected}`);
  if (recommended) parts.push(`Melhor formato indicado: ${recommended}`);
  if (rationale) parts.push(`Justificativa: ${rationale}`);

  return parts.join("\n\n");
}

export function normalizeImportedScriptPayload(
  raw: unknown,
  fallbackTitle = "Roteiro importado",
): ImportedScriptPayload {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;

    return {
      titulo_da_tela:
        safeText(record.titulo_da_tela || record.title || record.titulo || record.headline) ||
        fallbackTitle,
      analise_do_tema: safeText(record.analise_do_tema),
      estrategia_do_video: safeText(record.estrategia_do_video),
      formato_do_video: buildFormatoDoVideo(record),
      hooks: safeStringArray(record.hooks),
      roteiro_segundo_a_segundo: safeTimeline(record.roteiro_segundo_a_segundo),
      texto_na_tela: safeStringArray(record.texto_na_tela),
      variacoes: safeStringArray(record.variacoes),
      legenda: safeText(record.legenda),
    };
  }

  const fallbackText = safeText(raw);
  return {
    titulo_da_tela: fallbackTitle,
    analise_do_tema: "",
    estrategia_do_video: "",
    formato_do_video: "",
    hooks: [],
    roteiro_segundo_a_segundo: [],
    texto_na_tela: [],
    variacoes: [],
    legenda: fallbackText,
  };
}

export function parseImportedScriptPayload(
  raw: string | null | undefined,
  fallbackTitle = "Roteiro importado",
): ImportedScriptPayload {
  const text = safeText(raw);
  if (!text) return normalizeImportedScriptPayload({}, fallbackTitle);

  try {
    return normalizeImportedScriptPayload(JSON.parse(text), fallbackTitle);
  } catch {
    return normalizeImportedScriptPayload(text, fallbackTitle);
  }
}

export function isAuthorityImportSourceKind(sourceKind?: string | null): boolean {
  const normalized = safeText(sourceKind).toLowerCase();
  return (
    normalized === "authority_agent" ||
    normalized === "authority_agent_import" ||
    normalized.startsWith("authority_agent:") ||
    normalized.startsWith("authority_agent_import:")
  );
}

export function extractAuthorityAgentKey(sourceKind?: string | null): string {
  const normalized = safeText(sourceKind);
  if (!normalized) return "";
  const match = normalized.match(/^authority_agent(?:_import)?:(.+)$/i);
  return match?.[1]?.trim() || "";
}

export function isAuthorityImportCard(card?: Pick<BobarCard, "source_kind"> | null): boolean {
  return isAuthorityImportSourceKind(card?.source_kind);
}

function newNodeId() {
  return `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function newEdgeId() {
  return `edge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildImportedFlowchart(script: ImportedScriptPayload): BobarFlowchart {
  const nodes = script.roteiro_segundo_a_segundo.map((item, index) => {
    const content = [item.acao ? `Ação: ${item.acao}` : "", item.fala ? `Fala: ${item.fala}` : ""]
      .filter(Boolean)
      .join("\n\n");

    return {
      id: newNodeId(),
      title: item.tempo || `Trecho ${index + 1}`,
      content,
      time: item.tempo || `Trecho ${index + 1}`,
      kind:
        index === 0
          ? "hook"
          : index === script.roteiro_segundo_a_segundo.length - 1
            ? "cta"
            : "timeline",
      x: 80,
      y: 80 + index * 180,
    };
  });

  const edges = nodes.slice(0, -1).map((node, index) => ({
    id: newEdgeId(),
    source: node.id,
    target: nodes[index + 1].id,
    label: "",
  }));

  return {
    nodes,
    edges,
    meta: { grid: 32, templateKey: "authority-imported-script" },
  };
}

export function buildAuthorityImportPayload(
  outputText: string,
  agent: { key: string; name: string },
): CreateBobarCardIn {
  const script = parseImportedScriptPayload(outputText, agent.name);

  return {
    title: script.titulo_da_tela || agent.name,
    content_text: JSON.stringify(script),
    card_type: "roteiro",
    source_kind: `authority_agent_import:${agent.key}`,
    source_label: agent.name,
    structure_json: JSON.stringify(buildImportedFlowchart(script)),
  };
}
