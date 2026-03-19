import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Gauge,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Maximize2,
  Monitor,
  SendHorizonal,
  Sparkles,
  Square,
  Smartphone,
  Upload,
  Wand2,
  Bot,
  User,
  ScanSearch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/constants/app";
import { appendImageHistory } from "@/lib/imageHistory";

type ImageResult = {
  engine_id: string;
  motor: string;
  url: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  tone?: "default" | "success" | "warning";
};

type FormatOption = {
  value: string;
  label: string;
  shortLabel: string;
  hint: string;
  icon: React.ReactNode;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "quadrado_1_1",
    label: "Quadrado 1:1",
    shortLabel: "1:1",
    hint: "Post estático e criativo versátil.",
    icon: <Square className="w-4 h-4" />,
  },
  {
    value: "vertical_9_16",
    label: "Vertical 9:16",
    shortLabel: "9:16",
    hint: "Stories, reels e shorts.",
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    value: "horizontal_16_9",
    label: "Horizontal 16:9",
    shortLabel: "16:9",
    hint: "Banner, capa e thumbnail.",
    icon: <Monitor className="w-4 h-4" />,
  },
];

const QUALITY_OPTIONS = [
  {
    value: "baixa",
    label: "Rascunho",
    shortLabel: "Rápida",
    hint: "Mais velocidade para testar.",
    icon: <Gauge className="w-4 h-4" />,
  },
  {
    value: "media",
    label: "Equilibrada",
    shortLabel: "Equilíbrio",
    hint: "Melhor custo-benefício.",
    icon: <LayoutTemplate className="w-4 h-4" />,
  },
  {
    value: "alta",
    label: "Premium",
    shortLabel: "Máxima",
    hint: "Mais refinamento visual.",
    icon: <Sparkles className="w-4 h-4" />,
  },
];

const QUICK_PROMPTS = [
  'Troque "Goiânia" por "Brasília" no botão azul e preserve o brilho.',
  'Apenas altere o preço principal e mantenha o restante da peça intacto.',
  'Limpe o texto pequeno do canto superior e preserve logo, produto e composição.',
  'Troque somente a headline central e mantenha fundo, identidade visual e CTA.',
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getAspectClass(formato: string) {
  if (formato === "vertical_9_16") return "aspect-[9/16]";
  if (formato === "horizontal_16_9") return "aspect-video";
  return "aspect-square";
}

function getPreviewAspectRatio(formato: string, width?: number | null, height?: number | null) {
  if (width && height) return `${width} / ${height}`;
  if (formato === "vertical_9_16") return "9 / 16";
  if (formato === "horizontal_16_9") return "16 / 9";
  return "1 / 1";
}

function getAuthToken() {
  try {
    return JSON.parse(localStorage.getItem("auth-store") || "{}")?.state?.token || "";
  } catch {
    return "";
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Props = {
  onBack: () => void;
};

export default function ImageEditReferenceView({ onBack }: Props) {
  const [formato, setFormato] = useState<string>("quadrado_1_1");
  const [qualidade, setQualidade] = useState<string>("media");
  const [resolutionMode, setResolutionMode] = useState<"preset" | "custom">("preset");
  const [customWidth, setCustomWidth] = useState<string>("1024");
  const [customHeight, setCustomHeight] = useState<string>("1280");
  const [promptInput, setPromptInput] = useState<string>("");
  const [lastInstruction, setLastInstruction] = useState<string>("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");
  const [localizedMode, setLocalizedMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: "assistant",
      content:
        "Envie uma imagem e me diga exatamente o que deve mudar. Quando eu identificar uma troca localizada, vou priorizar a edição só daquela área para preservar o restante da peça.",
    },
  ]);

  const chatViewportRef = useRef<HTMLDivElement | null>(null);

  const currentFormat = useMemo(
    () => FORMAT_OPTIONS.find((item) => item.value === formato),
    [formato]
  );

  const currentQuality = useMemo(
    () => QUALITY_OPTIONS.find((item) => item.value === qualidade),
    [qualidade]
  );

  const parsedCustomWidth = useMemo(() => Number(customWidth), [customWidth]);
  const parsedCustomHeight = useMemo(() => Number(customHeight), [customHeight]);
  const hasValidCustomDimensions =
    Number.isInteger(parsedCustomWidth) &&
    Number.isInteger(parsedCustomHeight) &&
    parsedCustomWidth >= 256 &&
    parsedCustomWidth <= 4096 &&
    parsedCustomHeight >= 256 &&
    parsedCustomHeight <= 4096;
  const previewAspectRatio = getPreviewAspectRatio(
    formato,
    resolutionMode === "custom" && hasValidCustomDimensions ? parsedCustomWidth : undefined,
    resolutionMode === "custom" && hasValidCustomDimensions ? parsedCustomHeight : undefined
  );

  useEffect(() => {
    if (!referenceFile) {
      setReferencePreview("");
      return;
    }

    const url = URL.createObjectURL(referenceFile);
    setReferencePreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [referenceFile]);

  useEffect(() => {
    if (!chatViewportRef.current) return;
    chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
  }, [messages]);

  const pushAssistantMessage = (content: string, tone: ChatMessage["tone"] = "default") => {
    setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content, tone }]);
  };

  const handleSelectFile = (file?: File | null) => {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setStatusText("Envie uma imagem PNG, JPG, JPEG ou WEBP.");
      pushAssistantMessage("Não consegui aceitar esse arquivo. Envie PNG, JPG, JPEG ou WEBP.", "warning");
      return;
    }

    setReferenceFile(file);
    setStatusText("");
    pushAssistantMessage(`Imagem carregada: ${file.name}. Agora me diga a alteração que você quer fazer.`, "success");
  };

  const handleGenerate = async (instruction?: string) => {
    const finalInstruction = (instruction ?? promptInput).trim();

    if (!referenceFile) {
      const text = "Envie uma imagem de referência antes de pedir a edição.";
      setStatusText(text);
      pushAssistantMessage(text, "warning");
      return;
    }

    if (!finalInstruction) {
      const text = "Escreva a alteração que deve ser feita na imagem.";
      setStatusText(text);
      pushAssistantMessage(text, "warning");
      return;
    }

    if (resolutionMode === "custom" && !hasValidCustomDimensions) {
      const text = "Informe width e height válidos entre 256 e 4096 pixels.";
      setStatusText(text);
      pushAssistantMessage(text, "warning");
      return;
    }

    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: finalInstruction }]);
    setLastInstruction(finalInstruction);
    setPromptInput("");
    setIsGenerating(true);
    setProgress(0);
    setResults([]);
    setImprovedPrompt("");
    setFinalPrompt("");
    setLocalizedMode(false);
    setStatusText("Preparando a referência e refinando a estratégia de edição...");

    const token = getAuthToken();
    const formData = new FormData();
    formData.append("reference_image", referenceFile);
    formData.append("formato", formato);
    formData.append("qualidade", qualidade);
    formData.append("instrucoes_edicao", finalInstruction);
    if (resolutionMode === "custom") {
      formData.append("width", String(parsedCustomWidth));
      formData.append("height", String(parsedCustomHeight));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/image-engine/edit/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(response.status === 401 ? "Sessão expirada." : `Erro ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let lastStatus = "";
      let streamLocalizedMode = false;

      if (!reader) throw new Error("Falha ao inicializar o leitor do stream.");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const line = rawEvent.split("\n").find((item) => item.startsWith("data:"));
          if (!line) continue;

          const payload = JSON.parse(line.replace(/^data:\s*/, ""));

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (typeof payload.progress === "number") {
            setProgress(payload.progress);
          }

          if (typeof payload.localized_mode === "boolean") {
            streamLocalizedMode = payload.localized_mode;
            setLocalizedMode(payload.localized_mode);
          }

          if (payload.status) {
            setStatusText(payload.status);
            if (payload.status !== lastStatus) {
              lastStatus = payload.status;
              setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: payload.status }]);
            }
          }

          if (payload.warning) {
            pushAssistantMessage(payload.warning, "warning");
          }

          if (payload.improved_prompt) {
            setImprovedPrompt(payload.improved_prompt);
          }

          if (payload.final_prompt) {
            setFinalPrompt(payload.final_prompt);
          }

          if (payload.partial_result?.url) {
            setResults((prev) => {
              const exists = prev.some((item) => item.engine_id === payload.partial_result.engine_id);
              return exists ? prev : [...prev, payload.partial_result];
            });
          }

          if (Array.isArray(payload.final_results)) {
            setResults(payload.final_results);
            appendImageHistory(
              payload.final_results.map((item: ImageResult) => ({
                type: "edited",
                url: item.url,
                motor: item.motor,
                engine_id: item.engine_id,
                format: formato,
                quality: qualidade,
                width: resolutionMode === "custom" ? parsedCustomWidth : undefined,
                height: resolutionMode === "custom" ? parsedCustomHeight : undefined,
                prompt: finalInstruction,
                improvedPrompt: payload.improved_prompt || undefined,
              }))
            );
          }
        }
      }

      pushAssistantMessage(
        streamLocalizedMode
          ? "Finalizado. A edição priorizou uma área localizada para preservar o restante da imagem."
          : "Finalizado. A edição foi concluída com o modo de fallback seguro."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao editar a imagem.";
      setStatusText(message);
      pushAssistantMessage(message, "warning");
    } finally {
      setIsGenerating(false);
    }
  };

  const latestResult = results[0];
  const previewImage = latestResult?.url || referencePreview;

  const applyResultAsBase = async (result: ImageResult) => {
    try {
      const response = await fetch(result.url);
      const blob = await response.blob();
      const extension = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const file = new File([blob], `edicao-base-${Date.now()}.${extension}`, { type: blob.type || "image/png" });
      setReferenceFile(file);
      setResults([]);
      setImprovedPrompt("");
      setFinalPrompt("");
      setStatusText("Base ativa atualizada para a última versão editada.");
      pushAssistantMessage("Agora a nova base ativa é a imagem editada mais recente. Pode pedir a próxima alteração.", "success");
    } catch {
      setStatusText("Não consegui transformar o resultado em nova base ativa.");
      pushAssistantMessage("Não consegui reutilizar essa versão como base. Tente abrir ou salvar a imagem e reenviar manualmente.", "warning");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-6 md:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2 rounded-xl border-blue-400/30 bg-transparent text-white hover:bg-blue-500/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Editor de imagem por referência</h1>
              <p className="mt-2 max-w-4xl text-slate-400 leading-relaxed">
                A imagem continua dominante no centro, mas o assistente agora fica em uma coluna lateral fixa à direita. Assim você mantém a visualização da peça ampla, sem o chat roubar espaço da arte.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Formato</div>
              <div className="mt-1 text-sm font-medium text-white">{resolutionMode === "custom" ? "Automático pelo tamanho" : currentFormat?.label}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Qualidade</div>
              <div className="mt-1 text-sm font-medium text-white">{currentQuality?.label}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Base ativa</div>
              <div className="mt-1 text-sm font-medium text-white">{latestResult ? "Última imagem editada" : referenceFile ? "Imagem original" : "Nenhuma"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tamanho final</div>
              <div className="mt-1 text-sm font-medium text-white">
                {resolutionMode === "custom" && hasValidCustomDimensions
                  ? `${parsedCustomWidth}x${parsedCustomHeight}`
                  : "Padrão"}
              </div>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.98)_0%,rgba(4,8,15,1)_100%)] shadow-[0_16px_50px_rgba(0,0,0,0.28)] overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  Área principal de edição
                </CardTitle>
                <CardDescription className="text-slate-400 mt-2 max-w-2xl">
                  A imagem segue como protagonista. O assistente fica em uma coluna lateral compacta para orientar a edição sem tampar a peça.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <label
                  htmlFor="image-reference-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-200 hover:bg-blue-500/15"
                >
                  <Upload className="w-4 h-4" />
                  {referenceFile ? "Trocar imagem" : "Enviar imagem"}
                </label>
                <input
                  id="image-reference-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => handleSelectFile(e.target.files?.[0] || null)}
                  disabled={isGenerating}
                />
                {latestResult && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                    onClick={() => applyResultAsBase(latestResult)}
                  >
                    Usar última versão como base
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-white">Tamanho final da edição</div>
                  <p className="text-xs text-slate-400">
                    Você pode manter o canvas padrão do formato ou definir width e height exatos para o resultado final.
                  </p>
                </div>
                <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setResolutionMode("preset")}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
                      resolutionMode === "preset" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
                    )}
                  >
                    Padrão
                  </button>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setResolutionMode("custom")}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm transition-colors",
                      resolutionMode === "custom" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
                    )}
                  >
                    Customizado
                  </button>
                </div>
              </div>

              {resolutionMode === "custom" ? (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 rounded-xl border border-blue-400/15 bg-blue-500/10 p-3 text-sm text-blue-100">
                    Ao usar tamanho customizado, o formato deixa de ser fixo. O resultado passa a seguir o width e o height informados.
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Width</label>
                    <Input
                      type="number"
                      min={256}
                      max={4096}
                      step={1}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      disabled={isGenerating}
                      className="h-11 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Height</label>
                    <Input
                      type="number"
                      min={256}
                      max={4096}
                      step={1}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      disabled={isGenerating}
                      className="h-11 border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-amber-400/15 bg-amber-500/10 p-3 text-sm text-amber-100">
                    O sistema gera no canvas suportado mais próximo e depois aplica crop e resize para te devolver exatamente o tamanho pedido.
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                  O resultado final vai seguir o canvas padrão do formato selecionado.
                </div>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleSelectFile(e.dataTransfer.files?.[0] || null);
              }}
              className={cn(
                "relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top,rgba(45,103,255,0.16),transparent_35%),linear-gradient(180deg,rgba(3,7,14,0.96),rgba(3,6,12,1))]",
                dragActive ? "border-blue-400/50 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]" : "border-white/10"
              )}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.18))] pointer-events-none" />

              <div className="relative p-4 md:p-6 xl:p-8">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                  <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                        Base ativa: {latestResult ? "última imagem editada" : referenceFile ? "imagem original" : "aguardando upload"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                        {localizedMode ? "Modo localizado" : "Modo padrão"}
                      </span>
                    </div>

                    <div className="mx-auto flex h-full w-full items-center justify-center">
                      <div
                        className={cn("w-full max-w-[1100px] overflow-hidden rounded-[30px] border border-white/10 bg-black/35 shadow-[0_30px_90px_rgba(0,0,0,0.38)]", resolutionMode === "custom" ? undefined : getAspectClass(formato))}
                        style={{ aspectRatio: previewAspectRatio }}
                      >
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt={latestResult ? "Resultado da edição" : "Imagem de referência"}
                            className="h-full w-full object-contain bg-black/60"
                          />
                        ) : (
                          <label
                            htmlFor="image-reference-upload"
                            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 p-10 text-center"
                          >
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
                              <Upload className="h-7 w-7" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-white">Arraste a imagem aqui ou clique para enviar</p>
                              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                                A arte fica grande no centro. O assistente entra na lateral para orientar a próxima alteração sem cobrir a visualização principal.
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="xl:sticky xl:top-6">
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(7,12,22,0.92)] shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
                      <div className="border-b border-white/10 px-4 py-4 md:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-white font-semibold">
                              <Bot className="w-4 h-4 text-blue-300" />
                              Assistente de edição
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">
                              Coluna compacta para pedir ajustes sem tirar o foco da peça.
                            </p>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
                            {isGenerating ? "Processando" : "Pronto"}
                          </div>
                        </div>
                      </div>

                      <div ref={chatViewportRef} className="max-h-[34vh] overflow-y-auto px-4 py-4 space-y-3 md:px-5">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2.5",
                              message.role === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {message.role === "assistant" && (
                              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
                                <Bot className="w-3.5 h-3.5" />
                              </div>
                            )}

                            <div
                              className={cn(
                                "max-w-[88%] rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed border",
                                message.role === "user"
                                  ? "border-blue-500/20 bg-blue-500/12 text-white"
                                  : message.tone === "warning"
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-50"
                                  : message.tone === "success"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-50"
                                  : "border-white/10 bg-white/[0.04] text-slate-200"
                              )}
                            >
                              {message.content}
                            </div>

                            {message.role === "user" && (
                              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                                <User className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-white/10 px-4 py-4 space-y-3 md:px-5">
                        <div className="grid grid-cols-1 gap-2">
                          {QUICK_PROMPTS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              disabled={isGenerating || !referenceFile}
                              onClick={() => setPromptInput(item)}
                              className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-[11px] leading-relaxed text-slate-300 transition hover:border-blue-400/30 hover:text-white disabled:opacity-50"
                            >
                              {item}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <Textarea
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            disabled={isGenerating}
                            className="min-h-[128px] resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-white placeholder:text-slate-500 focus-visible:ring-0"
                            placeholder="Ex: troque apenas o texto do botão azul de Goiânia para Brasília, preserve fonte, brilho, cor e alinhamento."
                          />

                          <div className="mt-3 space-y-3">
                            <div className="text-[11px] leading-relaxed text-slate-500">
                              {lastInstruction ? `Último pedido: ${lastInstruction}` : "Seja específico sobre o que deve mudar e o que deve permanecer igual."}
                            </div>

                            <Button
                              size="sm"
                              className="w-full gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                              onClick={() => handleGenerate()}
                              disabled={isGenerating || !referenceFile || !promptInput.trim()}
                            >
                              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
                              Enviar para edição
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">Status da geração</div>
                    <div className="mt-1 text-xs text-slate-400">{statusText || "Aguardando instrução"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Progresso</div>
                    <div className="mt-1 text-sm font-semibold text-white">{progress}%</div>
                  </div>
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
                <div className="flex items-center gap-2 text-white font-medium">
                  <Check className="w-4 h-4 text-emerald-300" />
                  Melhor prática
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Quando for trocar texto, cite o texto atual e o novo texto de forma explícita. Exemplo: <span className="font-medium text-white">troque “Goiânia” por “Brasília”</span>. Isso aumenta a chance do fluxo localizado acertar só a área necessária.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Configurações da próxima geração</CardTitle>
            <CardDescription className="text-slate-400">
              Ajustes mais leves, horizontais e diretos. Sem blocos pesados competindo com a área principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_minmax(0,1fr)] lg:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <LayoutTemplate className="w-4 h-4 text-blue-300" />
                  Formato
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {FORMAT_OPTIONS.map((option) => {
                    const isSelected = resolutionMode === "preset" && formato === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => {
                          setResolutionMode("preset");
                          setFormato(option.value);
                        }}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                            : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-blue-400/40"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {option.icon}
                            {option.label}
                          </div>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{option.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_minmax(0,1fr)] lg:items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  Qualidade
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {QUALITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setQualidade(option.value)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left transition",
                        qualidade === option.value
                          ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.2)]"
                          : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-blue-400/40"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {option.icon}
                          {option.label}
                        </div>
                        {qualidade === option.value && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{option.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {(improvedPrompt || finalPrompt) && (
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Camada técnica da edição</CardTitle>
              <CardDescription className="text-slate-400">
                Visão resumida do refinamento usado pela engine antes da imagem ser editada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {improvedPrompt && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">Prompt otimizado</div>
                  <p className="text-sm text-slate-200 leading-relaxed italic">“{improvedPrompt}”</p>
                </div>
              )}

              {finalPrompt && (
                <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-white">Ver prompt final enviado ao editor</summary>
                  <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400">{finalPrompt}</p>
                </details>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-white">Resultados da edição</CardTitle>
                <CardDescription className="text-slate-400">
                  As novas versões ficam aqui embaixo. Você pode abrir, salvar ou continuar editando a partir da imagem já alterada.
                </CardDescription>
              </div>
              {latestResult && (
                <a
                  href={latestResult.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/15"
                >
                  <Download className="w-4 h-4" />
                  Salvar última imagem
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center text-slate-400">
                {isGenerating ? "Gerando resultados... eles aparecerão aqui assim que a engine devolver a imagem." : "Ainda não há resultados. Envie uma instrução no mini chat para gerar a primeira versão."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {results.map((result, index) => (
                  <div key={`${result.engine_id}-${index}`} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Versão {index + 1}</div>
                        <div className="text-xs text-slate-400">Motor: {result.motor}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applyResultAsBase(result)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white hover:bg-white/[0.08]"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Editar a partir desta
                        </button>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white hover:bg-white/[0.08]"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Abrir
                        </a>
                        <a
                          href={result.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200 hover:bg-blue-500/15"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Salvar
                        </a>
                      </div>
                    </div>

                    <div className={cn("overflow-hidden bg-black/40", getAspectClass(formato))}>
                      <img src={result.url} alt={result.motor} className="h-full w-full object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
