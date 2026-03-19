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
  ScanSearch, // <-- ADICIONE AQUI
  SendHorizonal,
  Sparkles,
  Square,
  Smartphone,
  Upload,
  Wand2,
  Bot,
  User,
  Settings2,
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
    hint: "Post estático e criativo.",
    icon: <Square className="w-5 h-5" />,
  },
  {
    value: "vertical_9_16",
    label: "Vertical 9:16",
    shortLabel: "9:16",
    hint: "Stories, reels e shorts.",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: "horizontal_16_9",
    label: "Horizontal 16:9",
    shortLabel: "16:9",
    hint: "Banner, capa e thumbnail.",
    icon: <Monitor className="w-5 h-5" />,
  },
];

const QUALITY_OPTIONS = [
  {
    value: "baixa",
    label: "Rascunho",
    shortLabel: "Rápida",
    hint: "Mais velocidade para testar.",
    icon: <Gauge className="w-5 h-5" />,
  },
  {
    value: "media",
    label: "Equilibrada",
    shortLabel: "Equilíbrio",
    hint: "Melhor custo-benefício.",
    icon: <LayoutTemplate className="w-5 h-5" />,
  },
  {
    value: "alta",
    label: "Premium",
    shortLabel: "Máxima",
    hint: "Mais refinamento visual.",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

const QUICK_PROMPTS = [
  'Troque "Goiânia" por "Brasília" no botão azul.',
  'Altere o preço principal e mantenha o resto.',
  'Limpe o texto do canto superior direito.',
  'Mude a headline central preservando o fundo.',
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
        "Olá! Envie uma imagem de base e me diga exatamente o que deve mudar. Preservarei o restante da peça sempre que possível.",
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
    return () => URL.revokeObjectURL(url);
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
      pushAssistantMessage("Formato inválido. Por favor, envie uma imagem PNG, JPG, JPEG ou WEBP.", "warning");
      return;
    }
    setReferenceFile(file);
    setStatusText("");
    pushAssistantMessage(`Imagem carregada: ${file.name}. O que vamos alterar nela?`, "success");
  };

  const handleGenerate = async (instruction?: string) => {
    const finalInstruction = (instruction ?? promptInput).trim();

    if (!referenceFile) {
      setStatusText("Envie uma imagem de referência.");
      pushAssistantMessage("Preciso de uma imagem de base antes de começar a edição.", "warning");
      return;
    }
    if (!finalInstruction) {
      setStatusText("Escreva a alteração.");
      pushAssistantMessage("Me diga o que você quer alterar na imagem.", "warning");
      return;
    }
    if (resolutionMode === "custom" && !hasValidCustomDimensions) {
      setStatusText("Dimensões inválidas.");
      pushAssistantMessage("As dimensões customizadas devem estar entre 256 e 4096 pixels.", "warning");
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
    setStatusText("Analisando imagem e preparando prompt...");

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

      if (!reader) throw new Error("Falha ao inicializar leitura de dados.");

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

          if (payload.error) throw new Error(payload.error);
          if (typeof payload.progress === "number") setProgress(payload.progress);
          if (typeof payload.localized_mode === "boolean") {
            streamLocalizedMode = payload.localized_mode;
            setLocalizedMode(payload.localized_mode);
          }
          if (payload.status) {
            setStatusText(payload.status);
            if (payload.status !== lastStatus) {
              lastStatus = payload.status;
              pushAssistantMessage(payload.status);
            }
          }
          if (payload.warning) pushAssistantMessage(payload.warning, "warning");
          if (payload.improved_prompt) setImprovedPrompt(payload.improved_prompt);
          if (payload.final_prompt) setFinalPrompt(payload.final_prompt);
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
          ? "Prontinho! Focamos em uma edição localizada para não descaracterizar sua arte original."
          : "Prontinho! A imagem foi recriada aplicando sua alteração com sucesso.",
        "success"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado na geração.";
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
      setStatusText("Base atualizada. Pronta para nova edição.");
      pushAssistantMessage("Imagem atualizada! Agora esta é nossa nova base. Qual o próximo ajuste?", "success");
    } catch {
      setStatusText("Erro ao atualizar base ativa.");
      pushAssistantMessage("Poxa, não consegui definir essa como base. Tente salvar a imagem e fazer o upload novamente.", "warning");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-8 md:px-6 lg:px-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="group gap-2 rounded-xl border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Voltar à Galeria
            </Button>

            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent pb-1">
                Edição Inteligente
              </h1>
              <p className="mt-2 max-w-2xl text-slate-400 leading-relaxed text-sm md:text-base">
                Carregue uma imagem base e descreva o que deseja alterar. A IA tentará isolar a modificação, mantendo o estilo visual da peça intacto.
              </p>
            </div>
          </div>

          {/* Quick Stats Top Bar */}
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {[
              { label: "Formato", value: resolutionMode === "custom" ? "Auto" : currentFormat?.shortLabel },
              { label: "Qualidade", value: currentQuality?.shortLabel },
              { label: "Base Ativa", value: latestResult ? "Edição" : referenceFile ? "Original" : "Vazia" },
              { label: "Resolução", value: resolutionMode === "custom" && hasValidCustomDimensions ? `${parsedCustomWidth}x${parsedCustomHeight}` : "Nativa" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col justify-center rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2.5 backdrop-blur-sm shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{stat.label}</span>
                <span className="mt-0.5 text-sm font-medium text-slate-200">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Workspace Card */}
        <Card className="border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
          <CardHeader className="border-b border-white/5 pb-5 px-6 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-white">Canvas de Edição</CardTitle>
                  <CardDescription className="text-slate-400">Área de preview e chat assistido</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label
                  htmlFor="image-reference-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  {referenceFile ? "Trocar Imagem" : "Carregar Imagem"}
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
                    className="rounded-xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                    onClick={() => applyResultAsBase(latestResult)}
                  >
                    Tornar Nova Base
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px]">
              
              {/* Left Column: Image Area */}
              <div className="relative flex flex-col border-b xl:border-b-0 xl:border-r border-white/5 bg-black/20 p-6 md:p-8">
                {/* Drag Overlay */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleSelectFile(e.dataTransfer.files?.[0] || null);
                  }}
                  className={cn(
                    "absolute inset-4 z-10 rounded-[28px] border-2 border-dashed transition-colors duration-200",
                    dragActive ? "border-blue-500 bg-blue-500/10" : "border-transparent pointer-events-none"
                  )}
                />

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                   <div className="flex items-center gap-2">
                     {latestResult && (
                       <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                         <Wand2 className="w-3.5 h-3.5" /> Edição Recente
                       </span>
                     )}
                     {localizedMode && (
                       <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                         <ScanSearch className="w-3.5 h-3.5" /> Modo Localizado
                       </span>
                     )}
                   </div>
                   
                   {/* Progress Indicator */}
                   {isGenerating && (
                     <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <div className="text-xs font-medium text-slate-300">Processando...</div>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-2">
                           <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                     </div>
                   )}
                </div>

                {/* The Image Canvas */}
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[24px] ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-500",
                      resolutionMode === "custom" ? undefined : getAspectClass(formato),
                      !previewImage && "border border-dashed border-white/20 bg-white/[0.02]"
                    )}
                    style={{
                      aspectRatio: previewAspectRatio,
                      width: "100%",
                      maxWidth: "800px",
                      // Checkerboard pattern for transparent images
                      backgroundImage: previewImage ? `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03)), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 25%, rgba(0,0,0,0.4) 25%, rgba(0,0,0,0.4) 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03))` : 'none',
                      backgroundPosition: '0 0, 10px 10px',
                      backgroundSize: '20px 20px'
                    }}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <label
                        htmlFor="image-reference-upload"
                        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 text-slate-400 group-hover:text-blue-400 transition-colors">
                          <ImageIcon className="h-8 w-8 opacity-50" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-slate-200">Nenhuma imagem carregada</p>
                          <p className="mt-1 text-sm text-slate-500">Clique ou arraste um arquivo (PNG, JPG, WEBP)</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Chat Assistant */}
              <div className="flex flex-col h-[600px] xl:h-auto bg-[rgba(10,15,30,0.6)] backdrop-blur-md">
                <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-5 py-4">
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                    <Bot className="w-5 h-5 text-white" />
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 ring-2 ring-slate-900">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">IA Assistente</h3>
                    <p className="text-[11px] text-slate-400">Pronta para editar sua arte</p>
                  </div>
                </div>

                <div ref={chatViewportRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                          <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-1 ring-blue-500/30">
                          <User className="w-4 h-4 text-blue-200" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                          message.role === "user"
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm"
                            : message.tone === "warning"
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-200 rounded-tl-sm"
                            : message.tone === "success"
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 rounded-tl-sm"
                            : "border border-white/5 bg-white/5 text-slate-200 rounded-tl-sm"
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 bg-white/[0.02] p-4">
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
                    {QUICK_PROMPTS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        disabled={isGenerating || !referenceFile}
                        onClick={() => setPromptInput(item)}
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative flex flex-col rounded-2xl border border-white/10 bg-slate-950/50 shadow-inner focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow">
                    <Textarea
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      disabled={isGenerating || !referenceFile}
                      className="min-h-[80px] resize-none border-0 bg-transparent px-4 py-3 text-sm text-white placeholder:text-slate-600 focus-visible:ring-0"
                      placeholder={referenceFile ? "O que devo alterar nesta imagem?" : "Envie uma imagem primeiro..."}
                    />
                    <div className="flex items-center justify-between p-2 pt-0">
                      <span className="pl-2 text-[10px] text-slate-500">
                        Seja claro para melhor precisão.
                      </span>
                      <Button
                        size="sm"
                        className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:bg-slate-800 disabled:text-slate-500"
                        onClick={() => handleGenerate()}
                        disabled={isGenerating || !referenceFile || !promptInput.trim()}
                      >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4 mr-1.5" />}
                        {isGenerating ? "Enviando" : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Cards Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg ring-1 ring-white/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <CardTitle className="text-lg font-medium text-white">Formato & Dimensões</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex bg-white/5 rounded-lg p-1 w-max ring-1 ring-white/10">
                <button
                  onClick={() => setResolutionMode("preset")}
                  className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", resolutionMode === "preset" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                >
                  Padrões Sociais
                </button>
                <button
                  onClick={() => setResolutionMode("custom")}
                  className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", resolutionMode === "custom" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                >
                  Tamanho Exato
                </button>
              </div>

              {resolutionMode === "preset" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map((option) => {
                    const isSelected = formato === option.value;
                    return (
                      <div
                        key={option.value}
                        onClick={() => !isGenerating && setFormato(option.value)}
                        className={cn(
                          "relative cursor-pointer rounded-2xl border p-4 transition-all duration-200",
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        )}
                      >
                        {isSelected && <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]" />}
                        <div className={cn("mb-3 text-slate-400", isSelected && "text-blue-400")}>{option.icon}</div>
                        <div className="text-sm font-semibold text-white">{option.label}</div>
                        <div className="mt-1 text-xs text-slate-500">{option.hint}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="col-span-2 text-xs text-amber-300/80 mb-2">A IA fará o crop/resize para encaixar nas medidas abaixo.</div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Largura (px)</label>
                    <Input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      disabled={isGenerating}
                      className="bg-black/40 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Altura (px)</label>
                    <Input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      disabled={isGenerating}
                      className="bg-black/40 border-white/10 text-white focus-visible:ring-1 focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/40 backdrop-blur-md shadow-lg ring-1 ring-white/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-lg font-medium text-white">Qualidade do Processamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {QUALITY_OPTIONS.map((option) => {
                  const isSelected = qualidade === option.value;
                  return (
                    <div
                      key={option.value}
                      onClick={() => !isGenerating && setQualidade(option.value)}
                      className={cn(
                        "relative cursor-pointer rounded-2xl border p-4 transition-all duration-200",
                        isSelected
                          ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      )}
                    >
                      {isSelected && <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]" />}
                      <div className={cn("mb-3 text-slate-400", isSelected && "text-amber-400")}>{option.icon}</div>
                      <div className="text-sm font-semibold text-white">{option.label}</div>
                      <div className="mt-1 text-xs text-slate-500">{option.hint}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 rounded-xl bg-white/5 p-4 flex items-start gap-3 border border-white/5">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="font-medium text-white">Dica:</span> Para trocar textos, especifique o texto exato. Ex: <span className="text-emerald-300">"troque 'Preço' por 'Promoção'"</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Specs (Prompts) */}
        {(improvedPrompt || finalPrompt) && (
          <div className="rounded-[24px] border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-sm animate-in fade-in">
            <h4 className="text-sm font-semibold text-indigo-300 mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Detalhes Técnicos da Geração
            </h4>
            <div className="space-y-4">
              {improvedPrompt && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Prompt Otimizado pela IA</div>
                  <div className="text-sm text-slate-300 bg-black/40 rounded-lg p-3 border border-white/5 font-mono italic">
                    "{improvedPrompt}"
                  </div>
                </div>
              )}
              {finalPrompt && (
                <details className="group">
                  <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors flex items-center gap-1">
                    <span>Ver prompt enviado ao motor visual</span>
                  </summary>
                  <div className="mt-2 text-xs text-slate-500 bg-black/40 rounded-lg p-3 border border-white/5 font-mono whitespace-pre-wrap">
                    {finalPrompt}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-6 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Galeria de Resultados</h2>
              <p className="text-slate-400 text-sm mt-1">Imagens geradas com base nas suas instruções</p>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-white/[0.01] py-20 px-4 text-center">
              <ImageIcon className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-400 font-medium max-w-sm">
                {isGenerating 
                  ? "A mágica está acontecendo... seus resultados aparecerão aqui em breve." 
                  : "As edições concluídas serão listadas aqui. Faça seu primeiro pedido no chat acima."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result, index) => (
                <Card key={`${result.engine_id}-${index}`} className="group overflow-hidden border-white/10 bg-slate-900/40 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 ring-1 ring-white/5">
                  <div className="relative">
                    <div className={cn("overflow-hidden bg-black/50", getAspectClass(formato))}>
                      <img 
                        src={result.url} 
                        alt={result.motor} 
                        className="h-full w-full object-contain group-hover:scale-[1.02] transition-transform duration-700 ease-out" 
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03)), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 25%, rgba(0,0,0,0.4) 25%, rgba(0,0,0,0.4) 75%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.03))` ,
                          backgroundPosition: '0 0, 10px 10px',
                          backgroundSize: '20px 20px'
                        }}
                      />
                    </div>
                    {/* Hover Overlay Action */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                       <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all"
                          title="Visualizar Tela Cheia"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </a>
                        <a
                          href={result.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 hover:scale-110 transition-all shadow-lg shadow-blue-500/30"
                          title="Baixar Imagem"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between border-t border-white/5">
                    <div>
                      <div className="text-sm font-semibold text-white">Variação {index + 1}</div>
                      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{result.motor}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => applyResultAsBase(result)}
                      className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 -mr-2"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Continuar Editando
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}