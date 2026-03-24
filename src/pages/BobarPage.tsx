
import * as React from "react";
import {
  Check,
  ChevronDown,
  FilePlus2,
  FolderKanban,
  GitBranch,
  GripVertical,
  Inbox,
  LayoutTemplate,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Unlink,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { exportAuthorityFormat } from "@/lib/authorityExport";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  bobarService,
  type BobarBoard,
  type BobarCard,
  type BobarCardType,
  type BobarColumn,
  type BobarFlowchart,
  type BobarFlowEdge,
  type BobarFlowNode,
} from "@/services/bobar";

type FlowTemplate = {
  key: string;
  label: string;
  description: string;
  cardType: BobarCardType;
  title: string;
  note: string;
  contentText: string;
  structure?: BobarFlowchart;
};

type CardEditorDraft = {
  title: string;
  card_type: BobarCardType | string;
  column_id: number;
  content_text: string;
  note: string;
};

type DropdownOption = {
  value: string;
  label: string;
  description?: string;
};

type DragCardState = {
  cardId: number;
  fromColumnId: number;
};

const CARD_TYPE_OPTIONS: Array<{ value: BobarCardType; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "roteiro", label: "Roteiro" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "ideia", label: "Ideia" },
  { value: "checklist", label: "Checklist" },
  { value: "fluxograma", label: "Fluxograma" },
];

function newNodeId() {
  return `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function newEdgeId() {
  return `edge-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function normalizeFlowNode(raw: Partial<BobarFlowNode>, index: number): BobarFlowNode {
  return {
    id: String(raw.id || newNodeId()),
    title: String(raw.title || raw.time || `Bloco ${index + 1}`).slice(0, 90),
    content: String(raw.content || ""),
    time: String(raw.time || ""),
    kind: String(raw.kind || "step"),
    x: Number.isFinite(Number(raw.x)) ? Number(raw.x) : 80 + (index % 3) * 300,
    y: Number.isFinite(Number(raw.y)) ? Number(raw.y) : 80 + Math.floor(index / 3) * 190,
  };
}

function normalizeFlowEdge(raw: Partial<BobarFlowEdge>, index: number): BobarFlowEdge {
  return {
    id: String(raw.id || `edge-${raw.source || "source"}-${raw.target || "target"}-${index}`),
    source: String(raw.source || ""),
    target: String(raw.target || ""),
    label: String(raw.label || ""),
  };
}

function dedupeEdges(edges: BobarFlowEdge[]) {
  const seen = new Set<string>();
  const next: BobarFlowEdge[] = [];
  for (const edge of edges) {
    if (!edge.source || !edge.target || edge.source === edge.target) continue;
    const key = `${edge.source}:${edge.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(edge);
  }
  return next;
}

function buildSequentialEdges(nodes: BobarFlowNode[]): BobarFlowEdge[] {
  const next: BobarFlowEdge[] = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    next.push({
      id: newEdgeId(),
      source: nodes[index].id,
      target: nodes[index + 1].id,
      label: "",
    });
  }
  return next;
}

function flowToContentText(flow: BobarFlowchart) {
  return flow.nodes
    .map((node, index) => {
      const header = [node.time || "", node.title || `Bloco ${index + 1}`].filter(Boolean).join(" · ");
      return [header, normalizeText(node.content)].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function parseFlowchart(structureJson?: string | null, fallbackTitle = "Novo fluxo", fallbackContent = ""): BobarFlowchart {
  try {
    const parsed = JSON.parse(structureJson || "{}");
    const rawNodes = Array.isArray(parsed?.nodes) ? parsed.nodes : [];
    const nodes = rawNodes.map((node: unknown, index: number) => normalizeFlowNode((node || {}) as Partial<BobarFlowNode>, index));
    const validIds = new Set(nodes.map((node) => node.id));
    const rawEdges = Array.isArray(parsed?.edges) ? parsed.edges : [];
    const edges = dedupeEdges(
      rawEdges
        .map((edge: unknown, index: number) => normalizeFlowEdge((edge || {}) as Partial<BobarFlowEdge>, index))
        .filter((edge) => validIds.has(edge.source) && validIds.has(edge.target))
    );

    if (nodes.length) {
      return {
        nodes,
        edges: edges.length ? edges : buildSequentialEdges(nodes),
        meta: typeof parsed?.meta === "object" && parsed?.meta ? parsed.meta : { grid: 32 },
      };
    }
  } catch {
    // noop
  }

  const text = normalizeText(fallbackContent);
  const chunks = text
    ? text
        .split(/\n\s*\n/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
    : [];

  const nodes =
    chunks.length > 0
      ? chunks.slice(0, 18).map((chunk, index) => {
          const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
          const head = lines[0] || fallbackTitle;
          const timeMatch = head.match(/(\d+\s*(?:-|a|até|to)\s*\d+\s*s|\d+\s*s)/i);
          return normalizeFlowNode(
            {
              title: timeMatch ? head.replace(String(timeMatch[1]), "").replace(/^[-–·:\s]+|[-–·:\s]+$/g, "") || head : head.slice(0, 70),
              time: timeMatch ? String(timeMatch[1]).replace(/\s+/g, "") : "",
              content: lines.slice(1).join("\n") || chunk,
              kind: index === 0 ? "hook" : index === chunks.length - 1 ? "cta" : "step",
            },
            index
          );
        })
      : [
          normalizeFlowNode(
            {
              title: fallbackTitle || "Novo bloco",
              content: fallbackContent,
              kind: "step",
            },
            0
          ),
        ];

  return {
    nodes,
    edges: buildSequentialEdges(nodes),
    meta: { grid: 32 },
  };
}

function cloneFlow(flow?: BobarFlowchart | null): BobarFlowchart {
  const source = flow || { nodes: [], edges: [], meta: { grid: 32 } };
  const idMap = new Map<string, string>();
  const nodes = source.nodes.map((node, index) => {
    const nextId = newNodeId();
    idMap.set(node.id, nextId);
    return normalizeFlowNode({ ...node, id: nextId }, index);
  });
  const edges = dedupeEdges(
    source.edges.map((edge, index) =>
      normalizeFlowEdge(
        {
          ...edge,
          id: newEdgeId(),
          source: idMap.get(edge.source) || edge.source,
          target: idMap.get(edge.target) || edge.target,
        },
        index
      )
    )
  );
  return {
    nodes,
    edges,
    meta: { ...(source.meta || {}), grid: Number(source.meta?.grid || 32) || 32 },
  };
}

function buildFlowTemplate(
  key: string,
  label: string,
  description: string,
  title: string,
  nodes: Array<Partial<BobarFlowNode>>
): FlowTemplate {
  const normalizedNodes = nodes.map((node, index) =>
    normalizeFlowNode(
      {
        id: newNodeId(),
        title: String(node.title || `Bloco ${index + 1}`),
        content: String(node.content || ""),
        time: String(node.time || ""),
        kind: String(node.kind || "step"),
        x: Number.isFinite(Number(node.x)) ? Number(node.x) : 80 + index * 280,
        y: Number.isFinite(Number(node.y)) ? Number(node.y) : 80 + (index % 2) * 160,
      },
      index
    )
  );

  const structure: BobarFlowchart = {
    nodes: normalizedNodes,
    edges: buildSequentialEdges(normalizedNodes),
    meta: { templateKey: key, grid: 32 },
  };

  return {
    key,
    label,
    description,
    cardType: "fluxograma",
    title,
    note: description,
    contentText: flowToContentText(structure),
    structure,
  };
}

const CARD_TEMPLATES: FlowTemplate[] = [
  buildFlowTemplate(
    "ugc-hook-30s",
    "UGC hook 30s",
    "Hook curto com dor, prova e CTA.",
    "Roteiro UGC · Hook 30s",
    [
      { time: "0-3s", title: "Hook", kind: "hook", content: "Abra com uma quebra forte, curiosidade ou contraste visual." },
      { time: "4-8s", title: "Dor", kind: "step", content: "Mostre o problema principal da audiência." },
      { time: "9-16s", title: "Prova", kind: "support", content: "Mostre evidência, exemplo ou resultado real." },
      { time: "17-30s", title: "CTA", kind: "cta", content: "Finalize com um próximo passo claro." },
    ]
  ),
  buildFlowTemplate(
    "storysell-45s",
    "Storysell 45s",
    "Narrativa com conflito, virada e fechamento comercial.",
    "Storysell · 45s",
    [
      { time: "0-5s", title: "Abertura", kind: "hook", content: "Entre já no contexto ou conflito." },
      { time: "6-15s", title: "Tensão", kind: "step", content: "Aumente o peso do problema ou desafio." },
      { time: "16-28s", title: "Virada", kind: "support", content: "Mostre o ponto de descoberta da solução." },
      { time: "29-45s", title: "Resultado + CTA", kind: "cta", content: "Feche com transformação e chamada." },
    ]
  ),
  {
    key: "pipeline-conteudo",
    label: "Pipeline de conteúdo",
    description: "Card de produção simples para acompanhar execução.",
    cardType: "conteudo",
    title: "Pipeline de conteúdo",
    note: "Use esse card para mover uma pauta entre etapas operacionais.",
    contentText: [
      "1. Definir objetivo do conteúdo",
      "2. Validar hook principal",
      "3. Aprovar roteiro",
      "4. Gravar versão principal",
      "5. Separar cortes e variações",
      "6. Publicar e revisar performance",
    ].join("\n"),
  },
  {
    key: "checklist-gravacao",
    label: "Checklist de gravação",
    description: "Checklist pronta para captação e revisão.",
    cardType: "checklist",
    title: "Checklist de gravação",
    note: "Use antes de liberar gravação ou edição.",
    contentText: [
      "- Confirmar hook e CTA aprovados",
      "- Validar enquadramento, lente e iluminação",
      "- Separar provas visuais e telas",
      "- Gravar variações de abertura",
      "- Revisar áudio, legenda e thumb",
    ].join("\n"),
  },
];

function buildEdgePath(source: BobarFlowNode, target: BobarFlowNode) {
  const startX = source.x + 256;
  const startY = source.y + 62;
  const endX = target.x;
  const endY = target.y + 62;
  const deltaX = Math.max(80, Math.abs(endX - startX) * 0.42);
  return `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
}

function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function autoArrangeFlow(flow: BobarFlowchart) {
  const ordered = [...flow.nodes].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const columns = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(ordered.length || 1))));
  const nodes = ordered.map((node, index) =>
    normalizeFlowNode(
      {
        ...node,
        x: 80 + (index % columns) * 300,
        y: 80 + Math.floor(index / columns) * 190,
      },
      index
    )
  );
  return { ...flow, nodes };
}

function readTemplateKeyFromStructure(structureJson?: string | null) {
  try {
    const parsed = JSON.parse(structureJson || "{}");
    return String(parsed?.meta?.templateKey || "");
  } catch {
    return "";
  }
}

function typeLabel(cardType?: string | null) {
  switch ((cardType || "").toLowerCase()) {
    case "roteiro":
      return "Roteiro";
    case "conteudo":
      return "Conteúdo";
    case "checklist":
      return "Checklist";
    case "ideia":
      return "Ideia";
    case "fluxograma":
      return "Fluxograma";
    default:
      return "Manual";
  }
}

function nodeKindLabel(kind?: string | null) {
  switch ((kind || "").toLowerCase()) {
    case "hook":
      return "Hook";
    case "cta":
      return "CTA";
    case "support":
      return "Prova";
    case "timeline":
      return "Linha do tempo";
    default:
      return "Passo";
  }
}

function typeBadgeClasses(cardType?: string | null) {
  const label = typeLabel(cardType);
  if (label === "Roteiro") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
  if (label === "Conteúdo") return "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200";
  if (label === "Checklist") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (label === "Ideia") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (label === "Fluxograma") return "border-violet-400/30 bg-violet-400/10 text-violet-200";
  return "border-white/10 bg-white/5 text-white/70";
}

function countImportedCards(board: BobarBoard | null) {
  if (!board) return 0;
  return board.columns.reduce(
    (acc, column) => acc + column.cards.filter((card) => card.source_kind && card.source_kind !== "manual").length,
    0
  );
}

function countFlowchartCards(board: BobarBoard | null) {
  if (!board) return 0;
  return board.columns.reduce(
    (acc, column) => acc + column.cards.filter((card) => String(card.card_type || "").toLowerCase() === "fluxograma").length,
    0
  );
}

function countTemplateCards(board: BobarBoard | null) {
  if (!board) return 0;
  return board.columns.reduce((acc, column) => {
    return acc + column.cards.filter((card) => Boolean(readTemplateKeyFromStructure(card.structure_json))).length;
  }, 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildSnippet(card: BobarCard) {
  if (String(card.card_type || "").toLowerCase() === "fluxograma") {
    const flow = parseFlowchart(card.structure_json, card.title, card.content_text);
    const titles = flow.nodes.map((node) => node.time || node.title).filter(Boolean).slice(0, 3);
    if (titles.length) return titles.join(" → ") + (flow.nodes.length > 3 ? "…" : "");
  }

  const cleanText = normalizeText(card.content_text);
  if (cleanText) {
    try {
      const exported = exportAuthorityFormat(cleanText, "txt").replace(/\s+/g, " ").trim();
      if (exported) return exported.slice(0, 180) + (exported.length > 180 ? "…" : "");
    } catch {
      // noop
    }
    return cleanText.replace(/\s+/g, " ").slice(0, 180) + (cleanText.length > 180 ? "…" : "");
  }

  const note = normalizeText(card.note).replace(/\s+/g, " ");
  if (note) return note.slice(0, 180) + (note.length > 180 ? "…" : "");
  return "Card vazio. Abra o editor e preencha o conteúdo.";
}

function findCard(board: BobarBoard | null, cardId: number | null) {
  if (!board || !cardId) return null;
  for (const column of board.columns) {
    const found = column.cards.find((card) => card.id === cardId);
    if (found) return found;
  }
  return null;
}

function firstCardId(board: BobarBoard | null) {
  if (!board) return null;
  for (const column of board.columns) {
    if (column.cards[0]) return column.cards[0].id;
  }
  return null;
}

function shallowEqualDraft(a: CardEditorDraft | null, b: CardEditorDraft | null) {
  if (!a || !b) return false;
  return (
    a.title === b.title &&
    a.card_type === b.card_type &&
    a.column_id === b.column_id &&
    a.content_text === b.content_text &&
    a.note === b.note
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  label?: string;
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const active = options.find((option) => option.value === value);

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</div> : null}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-left shadow-[0_16px_40px_rgba(0,0,0,0.2)] transition",
            "border-cyan-400/30 bg-[#0a1225] text-white hover:border-cyan-300/50 hover:bg-[#0d1830]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <div className="min-w-0">
            <div className={cn("truncate text-sm font-medium", active ? "text-white" : "text-white/45")}>
              {active?.label || placeholder || "Selecionar"}
            </div>
            {active?.description ? <div className="truncate text-xs text-white/45">{active.description}</div> : null}
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/55 transition", open && "rotate-180")} />
        </button>

        {open ? (
          <div className="absolute z-[80] mt-2 w-full overflow-hidden rounded-[1.4rem] border border-cyan-400/20 bg-[#07101f] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="max-h-72 overflow-y-auto pr-1">
              {options.map((option) => {
                const activeOption = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition",
                      activeOption ? "bg-cyan-400/12 text-cyan-100" : "text-white/80 hover:bg-white/5"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{option.label}</div>
                      {option.description ? <div className="mt-1 text-xs leading-5 text-white/45">{option.description}</div> : null}
                    </div>
                    {activeOption ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">{icon}</div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</div>
          <div className="mt-1 text-2xl font-black text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/40">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="mt-4 text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/55">{description}</div>
    </div>
  );
}

function ColumnLane({
  column,
  selectedCardId,
  onSelectCard,
  onCreateCard,
  onRenameColumn,
  onDeleteColumn,
  dragState,
  dragOverColumnId,
  onStartDragCard,
  onEndDragCard,
  onDragColumn,
  onDropColumn,
}: {
  column: BobarColumn;
  selectedCardId: number | null;
  onSelectCard: (cardId: number) => void;
  onCreateCard: (columnId: number) => void;
  onRenameColumn: (column: BobarColumn) => void;
  onDeleteColumn: (column: BobarColumn) => void;
  dragState: DragCardState | null;
  dragOverColumnId: number | null;
  onStartDragCard: (card: BobarCard, event: React.DragEvent<HTMLButtonElement>) => void;
  onEndDragCard: () => void;
  onDragColumn: (columnId: number) => void;
  onDropColumn: (columnId: number) => void;
}) {
  const isDropActive = dragState && dragOverColumnId === column.id && dragState.fromColumnId !== column.id;

  return (
    <Card
      variant="glass"
      className={cn(
        "min-w-[320px] max-w-[320px] rounded-[2rem] border bg-[#07101f]/75 backdrop-blur",
        isDropActive ? "border-cyan-300/60 shadow-[0_0_0_1px_rgba(34,211,238,0.28),0_24px_48px_rgba(8,145,178,0.18)]" : "border-cyan-400/12"
      )}
      onDragOver={(event) => {
        if (!dragState) return;
        event.preventDefault();
        onDragColumn(column.id);
      }}
      onDragLeave={(event) => {
        if (!dragState) return;
        const related = event.relatedTarget as Node | null;
        if (related && event.currentTarget.contains(related)) return;
        onDragColumn(-1);
      }}
      onDrop={(event) => {
        if (!dragState) return;
        event.preventDefault();
        onDropColumn(column.id);
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Coluna</div>
            </div>
            <CardTitle className="break-words text-[1.7rem] leading-tight text-white">{column.name}</CardTitle>
            <CardDescription className="mt-2 text-white/45">
              {column.cards.length} {column.cards.length === 1 ? "card" : "cards"}
            </CardDescription>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => onRenameColumn(column)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => onDeleteColumn(column)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button className="h-10 w-full rounded-2xl" variant="outline" onClick={() => onCreateCard(column.id)}>
          <Plus className="h-4 w-4" />
          Novo card
        </Button>

        {isDropActive ? (
          <div className="rounded-[1.6rem] border border-dashed border-cyan-300/50 bg-cyan-400/8 px-4 py-5 text-center text-sm font-medium text-cyan-100">
            Solte aqui para mover o card para {column.name}.
          </div>
        ) : null}

        <div className="space-y-3">
          {column.cards.length ? (
            column.cards.map((card) => {
              const active = selectedCardId === card.id;
              const dragging = dragState?.cardId === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  draggable
                  onDragStart={(event) => onStartDragCard(card, event)}
                  onDragEnd={onEndDragCard}
                  onClick={() => onSelectCard(card.id)}
                  className={cn(
                    "w-full rounded-[1.7rem] border p-4 text-left shadow-[0_16px_34px_rgba(0,0,0,0.22)] transition",
                    active ? "border-cyan-400/50 bg-cyan-400/10 ring-2 ring-cyan-400/25" : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]",
                    dragging && "opacity-45"
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]", typeBadgeClasses(card.card_type))}>
                          {typeLabel(card.card_type)}
                        </Badge>
                        {card.source_label ? (
                          <Badge className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/65">
                            {card.source_label}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="line-clamp-2 text-base font-semibold leading-6 text-white">{card.title}</div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="line-clamp-4 text-sm leading-6 text-white/60">{buildSnippet(card)}</div>

                  <div className="mt-4 flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">
                    <span>{formatDate(card.updated_at)}</span>
                    <span>{String(card.card_type || "").toLowerCase() === "fluxograma" ? `${parseFlowchart(card.structure_json, card.title, card.content_text).nodes.length} blocos` : "Texto"}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.025] px-6 py-10 text-center text-sm leading-6 text-white/45">
              Arraste cards para essa coluna ou crie um novo card.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FlowchartCanvas({
  flow,
  selectedNodeId,
  selectedEdgeId,
  onNodeActivate,
  onSelectEdge,
  onMoveNode,
}: {
  flow: BobarFlowchart;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onNodeActivate: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onMoveNode: (nodeId: string, patch: Partial<BobarFlowNode>) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const gestureRef = React.useRef<{
    nodeId: string;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const width = Math.max(980, ...flow.nodes.map((node) => node.x + 360));
  const height = Math.max(560, ...flow.nodes.map((node) => node.y + 210));
  const byId = React.useMemo(() => new Map(flow.nodes.map((node) => [node.id, node])), [flow.nodes]);

  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      const dx = event.clientX - gesture.startClientX;
      const dy = event.clientY - gesture.startClientY;
      if (!gesture.moved && Math.hypot(dx, dy) > 4) {
        gesture.moved = true;
      }
      if (!gesture.moved) return;
      onMoveNode(gesture.nodeId, {
        x: clampPosition(gesture.originX + dx, 24, width - 280),
        y: clampPosition(gesture.originY + dy, 24, height - 130),
      });
    };

    const handlePointerUp = () => {
      const gesture = gestureRef.current;
      if (!gesture) return;
      if (!gesture.moved) {
        onNodeActivate(gesture.nodeId);
      }
      gestureRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [height, onMoveNode, onNodeActivate, width]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#040914]">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
          <Badge className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100">
            Fluxograma interativo
          </Badge>
          <span>Clique em um bloco e depois em outro para conectar ou desconectar.</span>
          <span>Arraste o bloco pelo próprio card para reposicionar.</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[640px] overflow-auto bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_35%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:auto,32px_32px,32px_32px]"
      >
        <div className="relative" style={{ width, height }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {flow.edges.map((edge) => {
              const source = byId.get(edge.source);
              const target = byId.get(edge.target);
              if (!source || !target) return null;
              const selected = edge.id === selectedEdgeId;
              return (
                <path
                  key={edge.id}
                  d={buildEdgePath(source, target)}
                  fill="none"
                  stroke={selected ? "rgba(34,211,238,0.95)" : "rgba(148,163,184,0.45)"}
                  strokeWidth={selected ? 3 : 2}
                  strokeLinecap="round"
                  className="pointer-events-auto cursor-pointer transition"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectEdge(edge.id);
                  }}
                />
              );
            })}
          </svg>

          {flow.edges.map((edge) => {
            const source = byId.get(edge.source);
            const target = byId.get(edge.target);
            if (!source || !target) return null;
            const centerX = (source.x + 256 + target.x) / 2;
            const centerY = (source.y + 62 + target.y + 62) / 2;
            const selected = edge.id === selectedEdgeId;
            return (
              <button
                key={`${edge.id}-label`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectEdge(edge.id);
                }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition",
                  selected ? "border-cyan-300/55 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-[#0b1426] text-white/55 hover:bg-white/10"
                )}
                style={{ left: centerX, top: centerY }}
              >
                {edge.label || "Conexão"}
              </button>
            );
          })}

          {flow.nodes.map((node) => {
            const selected = node.id === selectedNodeId;
            return (
              <div
                key={node.id}
                role="button"
                tabIndex={0}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  gestureRef.current = {
                    nodeId: node.id,
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    originX: node.x,
                    originY: node.y,
                    moved: false,
                  };
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onNodeActivate(node.id);
                  }
                }}
                className={cn(
                  "absolute w-64 cursor-grab rounded-[1.8rem] border p-4 shadow-[0_20px_40px_rgba(0,0,0,0.28)] transition active:cursor-grabbing",
                  selected ? "border-cyan-300/55 bg-[#10213d] ring-2 ring-cyan-300/25" : "border-white/10 bg-[#0b1426]/95 hover:border-white/20"
                )}
                style={{ left: node.x, top: node.y }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                        {nodeKindLabel(node.kind)}
                      </Badge>
                      {node.time ? (
                        <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                          {node.time}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold leading-5 text-white">{node.title || "Bloco sem título"}</div>
                  </div>
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/45">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>

                <div className="line-clamp-4 text-sm leading-6 text-white/60">{normalizeText(node.content) || "Sem conteúdo."}</div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="h-3 w-3 rounded-full bg-cyan-300/80 shadow-[0_0_0_6px_rgba(34,211,238,0.12)]" />
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                    {selected ? "Selecionado" : "Clique ou arraste"}
                  </div>
                  <div className="h-3 w-3 rounded-full bg-violet-300/80 shadow-[0_0_0_6px_rgba(167,139,250,0.12)]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BobarPage() {
  const [board, setBoard] = React.useState<BobarBoard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [selectedCardId, setSelectedCardId] = React.useState<number | null>(null);
  const [cardDraft, setCardDraft] = React.useState<CardEditorDraft | null>(null);
  const [baselineDraft, setBaselineDraft] = React.useState<CardEditorDraft | null>(null);
  const [flowDraft, setFlowDraft] = React.useState<BobarFlowchart | null>(null);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  const [newColumnName, setNewColumnName] = React.useState("");
  const [templateKey, setTemplateKey] = React.useState("");
  const [dragState, setDragState] = React.useState<DragCardState | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = React.useState<number | null>(null);

  const selectedCard = React.useMemo(() => findCard(board, selectedCardId), [board, selectedCardId]);
  const cards = React.useMemo(() => board?.columns.flatMap((column) => column.cards) || [], [board]);

  const selectedCardType = String(cardDraft?.card_type || selectedCard?.card_type || "").toLowerCase();
  const isFlowCard = selectedCardType === "fluxograma";
  const templateOptions = React.useMemo<DropdownOption[]>(
    () =>
      CARD_TEMPLATES.map((template) => ({
        value: template.key,
        label: template.label,
        description: template.description,
      })),
    []
  );
  const cardTypeOptions = React.useMemo<DropdownOption[]>(
    () =>
      CARD_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    []
  );
  const columnOptions = React.useMemo<DropdownOption[]>(
    () =>
      (board?.columns || []).map((column) => ({
        value: String(column.id),
        label: column.name,
      })),
    [board]
  );

  const selectedNode = React.useMemo(
    () => (flowDraft?.nodes || []).find((node) => node.id === selectedNodeId) || null,
    [flowDraft, selectedNodeId]
  );
  const selectedEdge = React.useMemo(
    () => (flowDraft?.edges || []).find((edge) => edge.id === selectedEdgeId) || null,
    [flowDraft, selectedEdgeId]
  );

  const hasPendingChanges = React.useMemo(() => {
    if (!selectedCard || !cardDraft || !baselineDraft) return false;
    if (!shallowEqualDraft(cardDraft, baselineDraft)) return true;
    if (isFlowCard) {
      const current = JSON.stringify(flowDraft || parseFlowchart(selectedCard.structure_json, selectedCard.title, selectedCard.content_text));
      const persisted = JSON.stringify(parseFlowchart(selectedCard.structure_json, selectedCard.title, selectedCard.content_text));
      return current !== persisted;
    }
    return false;
  }, [baselineDraft, cardDraft, flowDraft, isFlowCard, selectedCard]);

  const syncSelection = React.useCallback((nextBoard: BobarBoard | null, preferredCardId?: number | null) => {
    const nextId = preferredCardId && findCard(nextBoard, preferredCardId) ? preferredCardId : firstCardId(nextBoard);
    setSelectedCardId(nextId);
  }, []);

  const loadBoard = React.useCallback(
    async (preferredCardId?: number | null) => {
      try {
        setLoading(true);
        const nextBoard = await bobarService.board();
        setBoard(nextBoard);
        syncSelection(nextBoard, preferredCardId);
      } catch (error) {
        toastApiError(error, "Não foi possível carregar o Bobar.");
      } finally {
        setLoading(false);
      }
    },
    [syncSelection]
  );

  React.useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  React.useEffect(() => {
    if (!selectedCard) {
      setCardDraft(null);
      setBaselineDraft(null);
      setFlowDraft(null);
      setTemplateKey("");
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      return;
    }

    const draft: CardEditorDraft = {
      title: selectedCard.title || "",
      card_type: selectedCard.card_type || "manual",
      column_id: selectedCard.column_id,
      content_text: selectedCard.content_text || "",
      note: selectedCard.note || "",
    };

    setCardDraft(draft);
    setBaselineDraft(draft);
    const nextFlow = parseFlowchart(selectedCard.structure_json, selectedCard.title, selectedCard.content_text);
    setFlowDraft(nextFlow);
    setTemplateKey(readTemplateKeyFromStructure(selectedCard.structure_json));
    setSelectedNodeId(nextFlow.nodes[0]?.id || null);
    setSelectedEdgeId(null);
  }, [selectedCard]);

  const runBoardMutation = React.useCallback(
    async (task: () => Promise<BobarBoard>, successMessage?: string, preferredCardId?: number | null) => {
      try {
        setBusy(true);
        const nextBoard = await task();
        setBoard(nextBoard);
        syncSelection(nextBoard, preferredCardId ?? selectedCardId);
        if (successMessage) toastSuccess(successMessage);
      } catch (error) {
        toastApiError(error);
      } finally {
        setBusy(false);
      }
    },
    [selectedCardId, syncSelection]
  );

  const handleCreateColumn = React.useCallback(async () => {
    const name = newColumnName.trim();
    if (!name) return;
    await runBoardMutation(() => bobarService.createColumn({ name }), "Coluna criada.");
    setNewColumnName("");
  }, [newColumnName, runBoardMutation]);

  const handleRenameColumn = React.useCallback(
    async (column: BobarColumn) => {
      const name = window.prompt("Novo nome da coluna:", column.name)?.trim();
      if (!name || name === column.name) return;
      await runBoardMutation(() => bobarService.renameColumn(column.id, { name }), "Coluna atualizada.");
    },
    [runBoardMutation]
  );

  const handleDeleteColumn = React.useCallback(
    async (column: BobarColumn) => {
      const confirmed = window.confirm(
        `Excluir a coluna "${column.name}"?\n\nOs cards serão movidos automaticamente para outra coluna.`
      );
      if (!confirmed) return;
      await runBoardMutation(() => bobarService.deleteColumn(column.id), "Coluna removida.");
    },
    [runBoardMutation]
  );

  const handleCreateCard = React.useCallback(
    async (columnId?: number) => {
      const fallbackColumnId = columnId || board?.columns[0]?.id;
      if (!fallbackColumnId) return;
      await runBoardMutation(
        () =>
          bobarService.createCard({
            column_id: fallbackColumnId,
            title: "Novo card",
            note: "",
            content_text: "",
            card_type: "manual",
          }),
        "Card criado."
      );
    },
    [board, runBoardMutation]
  );

  const handleStartDragCard = React.useCallback((card: BobarCard, event: React.DragEvent<HTMLButtonElement>) => {
    setDragState({ cardId: card.id, fromColumnId: card.column_id });
    setDragOverColumnId(card.column_id);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleEndDragCard = React.useCallback(() => {
    setDragState(null);
    setDragOverColumnId(null);
  }, []);

  const handleDropColumn = React.useCallback(
    async (columnId: number) => {
      const drag = dragState;
      setDragState(null);
      setDragOverColumnId(null);
      if (!drag) return;
      const targetColumn = board?.columns.find((column) => column.id === columnId);
      if (!targetColumn || (drag.fromColumnId === columnId && targetColumn.cards.some((card) => card.id === drag.cardId))) return;
      await runBoardMutation(
        () =>
          bobarService.moveCard(drag.cardId, {
            column_id: columnId,
            position: targetColumn.cards.length,
          }),
        "Card movido.",
        drag.cardId
      );
    },
    [board, dragState, runBoardMutation]
  );

  const handleSaveCard = React.useCallback(async () => {
    if (!selectedCard || !cardDraft) return;

    const normalizedFlow = isFlowCard
      ? flowDraft && flowDraft.nodes.length
        ? flowDraft
        : parseFlowchart(selectedCard.structure_json, cardDraft.title, cardDraft.content_text)
      : null;

    const payload = {
      title: cardDraft.title.trim() || "Card sem título",
      card_type: String(cardDraft.card_type || "manual"),
      column_id: Number(cardDraft.column_id),
      note: cardDraft.note,
      content_text: normalizedFlow ? flowToContentText(normalizedFlow) : cardDraft.content_text,
      structure_json: normalizedFlow
        ? JSON.stringify({
            ...normalizedFlow,
            meta: { ...(normalizedFlow.meta || {}), templateKey: templateKey || null, grid: 32 },
          })
        : "",
    };

    await runBoardMutation(() => bobarService.updateCard(selectedCard.id, payload), "Card salvo.", selectedCard.id);
  }, [cardDraft, flowDraft, isFlowCard, runBoardMutation, selectedCard, templateKey]);

  const handleDeleteCard = React.useCallback(async () => {
    if (!selectedCard) return;
    const confirmed = window.confirm(`Excluir o card "${selectedCard.title}"?`);
    if (!confirmed) return;
    const deletingId = selectedCard.id;
    await runBoardMutation(() => bobarService.deleteCard(deletingId), "Card removido.");
  }, [runBoardMutation, selectedCard]);

  const handleApplyTemplate = React.useCallback(() => {
    if (!cardDraft || !templateKey) return;
    const template = CARD_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;

    setCardDraft((current) =>
      current
        ? {
            ...current,
            title: template.title,
            note: template.note,
            card_type: template.cardType,
            content_text: template.contentText,
          }
        : current
    );

    if (template.structure) {
      const cloned = cloneFlow(template.structure);
      setFlowDraft({
        ...cloned,
        meta: { ...(cloned.meta || {}), templateKey: template.key, grid: 32 },
      });
      setSelectedNodeId(cloned.nodes[0]?.id || null);
      setSelectedEdgeId(null);
    } else {
      setFlowDraft(null);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }

    toastSuccess("Template aplicado no card.");
  }, [cardDraft, templateKey]);

  const setNodePatch = React.useCallback((nodeId: string, patch: Partial<BobarFlowNode>) => {
    setFlowDraft((current) => {
      const source = current || { nodes: [], edges: [], meta: { grid: 32 } };
      return {
        ...source,
        nodes: source.nodes.map((node, index) => (node.id === nodeId ? normalizeFlowNode({ ...node, ...patch }, index) : node)),
      };
    });
  }, []);

  const handleNodeActivate = React.useCallback(
    (nodeId: string) => {
      setSelectedEdgeId(null);
      setFlowDraft((current) => {
        if (!current) return current;
        if (selectedNodeId && selectedNodeId !== nodeId) {
          const existing = current.edges.find((edge) => edge.source === selectedNodeId && edge.target === nodeId);
          const nextEdges = existing
            ? current.edges.filter((edge) => edge.id !== existing.id)
            : dedupeEdges([...current.edges, { id: newEdgeId(), source: selectedNodeId, target: nodeId, label: "" }]);
          setSelectedEdgeId(existing ? null : nextEdges[nextEdges.length - 1]?.id || null);
          setSelectedNodeId(nodeId);
          return { ...current, edges: nextEdges };
        }
        setSelectedNodeId(nodeId);
        return current;
      });
    },
    [selectedNodeId]
  );

  const handleAddNode = React.useCallback(() => {
    setFlowDraft((current) => {
      const base = current || parseFlowchart("", cardDraft?.title || "Novo fluxo", cardDraft?.content_text || "");
      const anchor = base.nodes.find((node) => node.id === selectedNodeId) || base.nodes[base.nodes.length - 1] || null;
      const node = normalizeFlowNode(
        {
          id: newNodeId(),
          title: `Bloco ${base.nodes.length + 1}`,
          content: "",
          kind: "step",
          x: anchor ? anchor.x + 300 : 80,
          y: anchor ? anchor.y : 80,
        },
        base.nodes.length
      );
      const nextEdges = anchor
        ? dedupeEdges([...base.edges, { id: newEdgeId(), source: anchor.id, target: node.id, label: "" }])
        : base.edges;
      return {
        ...base,
        nodes: [...base.nodes, node],
        edges: nextEdges,
      };
    });
  }, [cardDraft?.content_text, cardDraft?.title, selectedNodeId]);

  const handleDeleteSelectedNode = React.useCallback(() => {
    if (!selectedNodeId) return;
    setFlowDraft((current) => {
      if (!current) return current;
      const nextNodes = current.nodes.filter((node) => node.id !== selectedNodeId);
      const nextEdges = current.edges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId);
      const nextFlow = {
        ...current,
        nodes: nextNodes,
        edges: nextEdges,
      };
      setSelectedNodeId(nextNodes[0]?.id || null);
      setSelectedEdgeId(null);
      return nextFlow;
    });
  }, [selectedNodeId]);

  const handleDeleteSelectedEdge = React.useCallback(() => {
    if (!selectedEdgeId) return;
    setFlowDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        edges: current.edges.filter((edge) => edge.id !== selectedEdgeId),
      };
    });
    setSelectedEdgeId(null);
  }, [selectedEdgeId]);

  const handleAutoArrange = React.useCallback(() => {
    setFlowDraft((current) => (current ? autoArrangeFlow(current) : current));
    toastSuccess("Fluxograma reorganizado.");
  }, []);

  const handleExportText = React.useCallback(() => {
    if (!selectedCard) return;
    const element = document.createElement("a");
    const blob = new Blob([selectedCard.content_text || ""], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(blob);
    element.download = `${selectedCard.title || "card"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  }, [selectedCard]);

  const selectedTemplate = CARD_TEMPLATES.find((template) => template.key === templateKey) || null;

  return (
    <div className="min-h-screen bg-[#020611] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1540px] flex-col gap-6">
        <Card variant="glass" className="overflow-visible rounded-[2.4rem] border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),#040914]">
          <CardHeader className="gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-100">
                <Sparkles className="h-4 w-4" />
                Bobar · fluxo operacional
              </div>
              <CardTitle className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Organize cards, roteiros e fluxogramas sem ruído na interface.
              </CardTitle>
              <CardDescription className="mt-4 max-w-2xl text-base leading-8 text-white/65">
                O quadro ficou mais direto: dropdown escuro, cards mais claros, movimento sem aquelas barras azuis estranhas e
                conexões do fluxograma feitas por clique entre blocos.
              </CardDescription>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[520px]">
              <StatChip icon={<FilePlus2 className="h-5 w-5" />} label="Cards" value={board?.total_cards || 0} />
              <StatChip icon={<Sparkles className="h-5 w-5" />} label="Importados" value={countImportedCards(board)} />
              <StatChip icon={<GitBranch className="h-5 w-5" />} label="Fluxogramas" value={countFlowchartCards(board)} />
              <StatChip icon={<LayoutTemplate className="h-5 w-5" />} label="Com template" value={countTemplateCards(board)} />
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 border-t border-white/10 pt-6 lg:grid-cols-[1fr_auto_auto]">
            <Input
              value={newColumnName}
              onChange={(event) => setNewColumnName(event.target.value)}
              placeholder="Nome de uma nova coluna"
              className="h-12 rounded-2xl border-cyan-400/20 bg-[#0a1225]"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateColumn();
                }
              }}
            />
            <Button className="h-12 rounded-2xl px-6" onClick={() => void handleCreateColumn()} disabled={busy || !newColumnName.trim()}>
              <Plus className="h-4 w-4" />
              Criar coluna
            </Button>
            <Button className="h-12 rounded-2xl px-6" variant="outline" onClick={() => void handleCreateCard()} disabled={busy || !board?.columns.length}>
              <FilePlus2 className="h-4 w-4" />
              Novo card
            </Button>
          </CardContent>
        </Card>

        <Card variant="glass" className="rounded-[2.2rem] border-cyan-400/10 bg-[#040914]">
          <CardHeader>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Quadro visual</div>
            <CardTitle className="text-3xl font-black text-white">Cards organizados por coluna</CardTitle>
            <CardDescription className="text-white/55">
              Clique para editar. Arraste para mover de uma coluna para outra. O destaque agora fica só na coluna de destino.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
              </div>
            ) : board?.columns.length ? (
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {board.columns.map((column) => (
                    <ColumnLane
                      key={column.id}
                      column={column}
                      selectedCardId={selectedCardId}
                      onSelectCard={setSelectedCardId}
                      onCreateCard={(columnId) => void handleCreateCard(columnId)}
                      onRenameColumn={handleRenameColumn}
                      onDeleteColumn={handleDeleteColumn}
                      dragState={dragState}
                      dragOverColumnId={dragOverColumnId}
                      onStartDragCard={handleStartDragCard}
                      onEndDragCard={handleEndDragCard}
                      onDragColumn={(columnId) => setDragOverColumnId(columnId > 0 ? columnId : null)}
                      onDropColumn={(columnId) => void handleDropColumn(columnId)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="Nenhuma coluna criada ainda"
                description="Crie sua primeira coluna para começar a organizar roteiros, ideias e fluxogramas dentro do Bobar."
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <Card variant="glass" className="overflow-visible rounded-[2.2rem] border-cyan-400/10 bg-[#040914]">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Estúdio do Bobar</div>
                  <CardTitle className="mt-2 text-3xl font-black text-white">{selectedCard?.title || "Selecione um card"}</CardTitle>
                  <CardDescription className="mt-2 text-white/55">
                    Edite os dados do card e salve. Para fluxograma, clique em um bloco e depois em outro para ligar ou desligar a conexão.
                  </CardDescription>
                </div>

                {selectedCard ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]", typeBadgeClasses(cardDraft?.card_type))}>
                      {typeLabel(cardDraft?.card_type)}
                    </Badge>
                    <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
                      Atualizado {formatDate(selectedCard.updated_at)}
                    </Badge>
                  </div>
                ) : null}
              </div>

              {selectedCard ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <SelectField
                    label="Tipo do card"
                    value={String(cardDraft?.card_type || "")}
                    options={cardTypeOptions}
                    onChange={(value) => {
                      setCardDraft((current) => (current ? { ...current, card_type: value } : current));
                      if (value === "fluxograma" && (!flowDraft || !flowDraft.nodes.length)) {
                        const nextFlow = parseFlowchart("", cardDraft?.title || selectedCard.title, cardDraft?.content_text || selectedCard.content_text);
                        setFlowDraft(nextFlow);
                        setSelectedNodeId(nextFlow.nodes[0]?.id || null);
                      }
                    }}
                  />
                  <SelectField
                    label="Template premium"
                    value={templateKey}
                    options={templateOptions}
                    placeholder="Escolha um template"
                    onChange={setTemplateKey}
                  />
                </div>
              ) : null}

              {selectedCard && selectedTemplate ? (
                <div className="rounded-[1.6rem] border border-cyan-400/15 bg-cyan-400/8 px-4 py-4 text-sm leading-6 text-cyan-50/85">
                  <div className="font-semibold text-white">{selectedTemplate.label}</div>
                  <div className="mt-1">{selectedTemplate.description}</div>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-6">
              {selectedCard && cardDraft ? (
                <>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Título do card</div>
                      <Input
                        value={cardDraft.title}
                        onChange={(event) => setCardDraft((current) => (current ? { ...current, title: event.target.value } : current))}
                        className="h-12 rounded-2xl border-cyan-400/20 bg-[#0a1225]"
                      />
                    </div>

                    <SelectField
                      label="Coluna"
                      value={String(cardDraft.column_id)}
                      options={columnOptions}
                      onChange={(value) =>
                        setCardDraft((current) => (current ? { ...current, column_id: Number(value) } : current))
                      }
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                    <Button className="h-12 rounded-2xl" onClick={handleApplyTemplate} disabled={!templateKey}>
                      <Wand2 className="h-4 w-4" />
                      Aplicar template
                    </Button>
                    {selectedCardType !== "fluxograma" ? (
                      <Button
                        variant="outline"
                        className="h-12 rounded-2xl"
                        onClick={() => {
                          const nextFlow = parseFlowchart("", cardDraft.title, cardDraft.content_text);
                          setFlowDraft(nextFlow);
                          setSelectedNodeId(nextFlow.nodes[0]?.id || null);
                          setCardDraft((current) => (current ? { ...current, card_type: "fluxograma" } : current));
                          toastSuccess("Card transformado em fluxograma no editor.");
                        }}
                      >
                        <GitBranch className="h-4 w-4" />
                        Transformar em fluxograma
                      </Button>
                    ) : null}
                    <Button variant="outline" className="h-12 rounded-2xl" onClick={handleExportText}>
                      <FilePlus2 className="h-4 w-4" />
                      Baixar texto
                    </Button>
                    <Button variant="outline" className="h-12 rounded-2xl text-red-200 hover:text-red-100" onClick={handleDeleteCard}>
                      <Trash2 className="h-4 w-4" />
                      Excluir card
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Observações</div>
                    <Textarea
                      value={cardDraft.note}
                      onChange={(event) => setCardDraft((current) => (current ? { ...current, note: event.target.value } : current))}
                      placeholder="Observações operacionais, contexto ou objetivo do card."
                      className="min-h-[112px] rounded-[1.6rem] border-cyan-400/15 bg-[#0a1225]"
                    />
                  </div>

                  {isFlowCard ? (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button className="h-11 rounded-2xl" variant="outline" onClick={handleAddNode}>
                          <Plus className="h-4 w-4" />
                          Novo bloco
                        </Button>
                        <Button className="h-11 rounded-2xl" variant="outline" onClick={handleAutoArrange}>
                          <Sparkles className="h-4 w-4" />
                          Auto-organizar
                        </Button>
                        <Button
                          className="h-11 rounded-2xl"
                          variant="outline"
                          onClick={handleDeleteSelectedNode}
                          disabled={!selectedNodeId}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover bloco
                        </Button>
                        <Button
                          className="h-11 rounded-2xl"
                          variant="outline"
                          onClick={handleDeleteSelectedEdge}
                          disabled={!selectedEdgeId}
                        >
                          <Unlink className="h-4 w-4" />
                          Remover conexão
                        </Button>
                      </div>

                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <FlowchartCanvas
                          flow={flowDraft || parseFlowchart(selectedCard.structure_json, selectedCard.title, selectedCard.content_text)}
                          selectedNodeId={selectedNodeId}
                          selectedEdgeId={selectedEdgeId}
                          onNodeActivate={handleNodeActivate}
                          onSelectEdge={(edgeId) => {
                            setSelectedEdgeId(edgeId);
                            setSelectedNodeId(null);
                          }}
                          onMoveNode={setNodePatch}
                        />

                        <Card variant="glass" className="rounded-[2rem] border-white/10 bg-[#06101f]">
                          <CardHeader>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Inspector</div>
                            <CardTitle className="text-2xl font-black text-white">
                              {selectedNode ? "Editar bloco" : selectedEdge ? "Editar conexão" : "Selecione um item"}
                            </CardTitle>
                            <CardDescription className="text-white/55">
                              Clique em um bloco. Se clicar em outro bloco depois, a conexão entre eles é criada ou removida na hora.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {selectedNode ? (
                              <>
                                <div className="space-y-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Título do bloco</div>
                                  <Input
                                    value={selectedNode.title}
                                    onChange={(event) => setNodePatch(selectedNode.id, { title: event.target.value })}
                                    className="h-12 rounded-2xl border-cyan-400/20 bg-[#0a1225]"
                                  />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Tempo</div>
                                    <Input
                                      value={selectedNode.time || ""}
                                      onChange={(event) => setNodePatch(selectedNode.id, { time: event.target.value })}
                                      placeholder="0-3s"
                                      className="h-12 rounded-2xl border-cyan-400/20 bg-[#0a1225]"
                                    />
                                  </div>

                                  <SelectField
                                    label="Tipo do bloco"
                                    value={String(selectedNode.kind || "step")}
                                    options={[
                                      { value: "hook", label: "Hook" },
                                      { value: "step", label: "Passo" },
                                      { value: "support", label: "Prova" },
                                      { value: "timeline", label: "Linha do tempo" },
                                      { value: "cta", label: "CTA" },
                                    ]}
                                    onChange={(value) => setNodePatch(selectedNode.id, { kind: value })}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Conteúdo do bloco</div>
                                  <Textarea
                                    value={selectedNode.content}
                                    onChange={(event) => setNodePatch(selectedNode.id, { content: event.target.value })}
                                    placeholder="Texto, fala, ação ou instrução desse bloco."
                                    className="min-h-[200px] rounded-[1.6rem] border-cyan-400/15 bg-[#0a1225]"
                                  />
                                </div>

                                <div className="rounded-[1.6rem] border border-cyan-400/15 bg-cyan-400/8 px-4 py-4 text-sm leading-6 text-cyan-50/85">
                                  Para conectar, mantenha esse bloco selecionado e clique em outro no canvas. Se a conexão já existir,
                                  ela será removida.
                                </div>
                              </>
                            ) : selectedEdge ? (
                              <>
                                <div className="space-y-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Label da conexão</div>
                                  <Input
                                    value={selectedEdge.label || ""}
                                    onChange={(event) =>
                                      setFlowDraft((current) =>
                                        current
                                          ? {
                                              ...current,
                                              edges: current.edges.map((edge) =>
                                                edge.id === selectedEdge.id ? { ...edge, label: event.target.value } : edge
                                              ),
                                            }
                                          : current
                                      )
                                    }
                                    placeholder="Ex.: valida, aprofunda, próxima etapa"
                                    className="h-12 rounded-2xl border-cyan-400/20 bg-[#0a1225]"
                                  />
                                </div>

                                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] px-4 py-4 text-sm leading-6 text-white/60">
                                  A conexão foi selecionada no canvas. Você pode rotular aqui ou remover com um clique no botão acima.
                                </div>
                              </>
                            ) : (
                              <EmptyState
                                title="Nada selecionado"
                                description="Clique em um bloco para editar. Depois clique em outro bloco para conectar ou desconectar a ligação entre eles."
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Conteúdo do card</div>
                      <Textarea
                        value={cardDraft.content_text}
                        onChange={(event) => setCardDraft((current) => (current ? { ...current, content_text: event.target.value } : current))}
                        placeholder="Cole aqui o roteiro, checklist, ideia ou texto operacional."
                        className="min-h-[380px] rounded-[1.8rem] border-cyan-400/15 bg-[#0a1225]"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                    <div className="text-sm text-white/60">
                      {hasPendingChanges ? "Existem alterações pendentes no card." : "Tudo salvo ou sem alterações pendentes."}
                    </div>
                    <Button className="h-12 rounded-2xl px-6" onClick={() => void handleSaveCard()} disabled={busy || !hasPendingChanges}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar card
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Selecione um card para editar"
                  description="Clique em qualquer card do quadro para abrir o editor e trabalhar o conteúdo, o fluxo ou as conexões."
                />
              )}
            </CardContent>
          </Card>

          <Card variant="glass" className="rounded-[2.2rem] border-cyan-400/10 bg-[#040914]">
            <CardHeader>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Resumo rápido</div>
              <CardTitle className="text-3xl font-black text-white">Foco no que importa</CardTitle>
              <CardDescription className="text-white/55">
                Área lateral mais enxuta para evitar ruído no quadro e no editor principal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <Link2 className="h-4 w-4 text-cyan-200" />
                  Conexões mais intuitivas
                </div>
                <div className="text-sm leading-6 text-white/60">
                  No fluxograma, clique em um bloco e depois em outro. A ligação é criada na hora. Se já existir, sai na hora.
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <GripVertical className="h-4 w-4 text-cyan-200" />
                  Arrasto mais limpo
                </div>
                <div className="text-sm leading-6 text-white/60">
                  Cards entre colunas agora usam só o destaque da coluna destino. Sem barras azuis espalhadas no quadro.
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <LayoutTemplate className="h-4 w-4 text-cyan-200" />
                  Dropdown premium escuro
                </div>
                <div className="text-sm leading-6 text-white/60">
                  Os seletores de tipo e template deixaram de depender do dropdown nativo branco do navegador.
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <Wand2 className="h-4 w-4 text-cyan-200" />
                  Templates continuam operacionais
                </div>
                <div className="text-sm leading-6 text-white/60">
                  Você pode aplicar um template no card selecionado e salvar. Para fluxograma, o template já entra estruturado.
                </div>
              </div>

              {cards.length ? (
                <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-sm font-semibold text-white">Cards disponíveis</div>
                  <div className="mt-3 space-y-2">
                    {cards.slice(0, 6).map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setSelectedCardId(card.id)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-3 text-left transition",
                          selectedCardId === card.id ? "border-cyan-300/50 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                        )}
                      >
                        <div className="text-sm font-medium text-white">{card.title}</div>
                        <div className="mt-1 text-xs text-white/45">{typeLabel(card.card_type)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
