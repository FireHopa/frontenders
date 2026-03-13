import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  Gauge,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Monitor,
  Sparkles,
  Square,
  Smartphone,
  Upload,
  Wand2,
} from "lucide-react";
import { API_BASE_URL } from "@/constants/app";

type ImageResult = {
  engine_id: string;
  motor: string;
  url: string;
};

type FormatOption = {
  value: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "quadrado_1_1",
    label: "Quadrado 1:1",
    hint: "Para posts estáticos, capas e criativos versáteis.",
    icon: <Square className="w-5 h-5" />,
  },
  {
    value: "vertical_9_16",
    label: "Vertical 9:16",
    hint: "Para peças verticais, stories, reels e shorts.",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: "horizontal_16_9",
    label: "Horizontal 16:9",
    hint: "Para banners, thumbnails e layouts mais amplos.",
    icon: <Monitor className="w-5 h-5" />,
  },
];

const QUALITY_OPTIONS = [
  {
    value: "baixa",
    label: "Rascunho",
    hint: "Mais econômico para testes rápidos.",
    icon: <Gauge className="w-5 h-5" />,
  },
  {
    value: "media",
    label: "Equilibrada",
    hint: "Boa qualidade com custo controlado.",
    icon: <LayoutTemplate className="w-5 h-5" />,
  },
  {
    value: "alta",
    label: "Premium",
    hint: "Mais detalhe e maior refinamento visual.",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getAspectClass(formato: string) {
  if (formato === "vertical_9_16") return "aspect-[9/16]";
  if (formato === "horizontal_16_9") return "aspect-video";
  return "aspect-square";
}

function getAuthToken() {
  try {
    return JSON.parse(localStorage.getItem("auth-store") || "{}")?.state?.token || "";
  } catch {
    return "";
  }
}

type Props = {
  onBack: () => void;
};

export default function ImageEditReferenceView({ onBack }: Props) {
  const [formato, setFormato] = useState<string>("quadrado_1_1");
  const [qualidade, setQualidade] = useState<string>("media");
  const [instrucoesEdicao, setInstrucoesEdicao] = useState<string>("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");

  const currentFormat = useMemo(
    () => FORMAT_OPTIONS.find((item) => item.value === formato),
    [formato]
  );

  const currentQuality = useMemo(
    () => QUALITY_OPTIONS.find((item) => item.value === qualidade),
    [qualidade]
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

  const handleSelectFile = (file?: File | null) => {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setStatusText("⚠ Envie uma imagem PNG, JPG, JPEG ou WEBP.");
      return;
    }

    setReferenceFile(file);
    setStatusText("");
  };

  const handleGenerate = async () => {
    if (!referenceFile) {
      setStatusText("⚠ Envie uma imagem de referência antes de continuar.");
      return;
    }

    if (!instrucoesEdicao.trim()) {
      setStatusText("⚠ Escreva o que a IA deve editar na imagem.");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults([]);
    setImprovedPrompt("");
    setFinalPrompt("");
    setStatusText("Preparando a referência e refinando o prompt de edição...");

    const token = getAuthToken();
    const formData = new FormData();
    formData.append("reference_image", referenceFile);
    formData.append("formato", formato);
    formData.append("qualidade", qualidade);
    formData.append("instrucoes_edicao", instrucoesEdicao);

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

      if (!reader) throw new Error("Falha ao inicializar o leitor do stream.");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const line = rawEvent
            .split("\n")
            .find((item) => item.startsWith("data:"));

          if (!line) continue;

          const payload = JSON.parse(line.replace(/^data:\s*/, ""));

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (typeof payload.progress === "number") {
            setProgress(payload.progress);
          }

          if (payload.status) {
            setStatusText(payload.status);
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
          }
        }
      }
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Erro inesperado ao editar a imagem.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="gap-2 px-0 text-slate-300 hover:text-white hover:bg-transparent"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Editor de imagem por referência
              </h1>
              <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
                Edite uma imagem já existente com instruções mais precisas. A lógica de edição agora está focada em preservar o original e mudar só o necessário.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] gap-6 items-start">
          <div className="space-y-6">
            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  1. Imagem de referência
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Envie a imagem original que será usada como base da edição.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <label
                  htmlFor="image-reference-upload"
                  className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-blue-500/30 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),rgba(15,23,42,0.18))] px-6 py-8 text-center transition hover:border-blue-400/50 hover:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),rgba(15,23,42,0.22))]"
                >
                  {referencePreview ? (
                    <div className="w-full space-y-4">
                      <div className={cn("mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-black/30", getAspectClass(formato))}>
                        <img src={referencePreview} alt="Imagem de referência" className="h-full w-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-white">{referenceFile?.name}</p>
                        <p className="text-sm text-slate-400">Clique para substituir a imagem.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-xl">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">Clique para enviar sua imagem</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          Use PNG, JPG, JPEG ou WEBP. Quanto melhor a imagem original, maior a chance da edição respeitar logos, detalhes pequenos e composição.
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="image-reference-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => handleSelectFile(e.target.files?.[0] || null)}
                    disabled={isGenerating}
                  />
                </label>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-blue-400" />
                  2. Formato e qualidade
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Escolha apenas o formato final e o nível de renderização. O restante da edição vem das suas instruções.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white">Formato de saída</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {FORMAT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setFormato(option.value)}
                        className={cn(
                          "relative rounded-2xl border p-4 text-left transition-all",
                          formato === option.value
                            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]"
                            : "border-white/10 bg-white/[0.03] hover:border-blue-400/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white font-medium">
                              {option.icon}
                              {option.label}
                            </div>
                            <p className="text-sm leading-relaxed text-slate-400">{option.hint}</p>
                          </div>
                          {formato === option.value && (
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white">Qualidade da renderização</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {QUALITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => setQualidade(option.value)}
                        className={cn(
                          "relative rounded-2xl border p-4 text-left transition-all",
                          qualidade === option.value
                            ? "border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]"
                            : "border-white/10 bg-white/[0.03] hover:border-blue-400/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white font-medium">
                              {option.icon}
                              {option.label}
                            </div>
                            <p className="text-sm leading-relaxed text-slate-400">{option.hint}</p>
                          </div>
                          {qualidade === option.value && (
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-blue-400" />
                  3. Instruções da edição
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Escreva exatamente o que deve mudar e o que deve ser preservado. Quanto mais objetivo, melhor.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Instruções de edição</label>
                  <Textarea
                    className="min-h-[220px] resize-none text-base leading-relaxed border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500"
                    placeholder={
                      "Ex: mantenha a logo exatamente como está, preserve o produto central, limpe o fundo, aumente o contraste, melhore a iluminação, troque apenas o fundo por algo mais premium, sem recriar a marca nem redesenhar elementos pequenos."
                    }
                    value={instrucoesEdicao}
                    onChange={(e) => setInstrucoesEdicao(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-relaxed text-slate-300">
                  Dica prática: quando houver elementos delicados, escreva explicitamente para <span className="font-semibold text-white">preservar exatamente</span> logos, selos, ícones, identidade da embalagem e detalhes pequenos. Isso ajuda o editor a evitar reconstruções desnecessárias.
                </div>
              </CardContent>

              <CardFooter className="bg-white/[0.02] pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-white/10">
                <div className="text-sm text-slate-400">
                  {referenceFile ? (
                    <span>
                      Arquivo atual: <span className="font-medium text-white">{referenceFile.name}</span>
                    </span>
                  ) : (
                    <span>Envie uma imagem para liberar a edição.</span>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full sm:w-auto font-semibold gap-2 rounded-xl h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={handleGenerate}
                  disabled={isGenerating || !referenceFile || !instrucoesEdicao.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando {progress}%
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      Editar imagem
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            {(isGenerating || improvedPrompt || finalPrompt || statusText) && (
              <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-blue-300 flex items-center gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {statusText || (isGenerating ? "Editando imagem..." : "Pronto")}
                      </span>
                      <span className="font-mono text-slate-400">{progress}%</span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Formato</div>
                        <div className="text-sm font-medium text-white">{currentFormat?.label}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Qualidade</div>
                        <div className="text-sm font-medium text-white">{currentQuality?.label}</div>
                      </div>
                    </div>
                  </div>

                  {improvedPrompt && (
                    <div className="space-y-2 animate-in fade-in">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Prompt otimizado pela IA</h3>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-sm text-slate-200 leading-relaxed italic">“{improvedPrompt}”</p>
                      </div>
                    </div>
                  )}

                  {finalPrompt && (
                    <details className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <summary className="cursor-pointer text-sm font-medium flex items-center gap-2 text-white">
                        Ver prompt final enviado ao editor
                      </summary>
                      <p className="mt-3 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap break-words">
                        {finalPrompt}
                      </p>
                    </details>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(7,12,22,0.96)_0%,rgba(6,10,18,0.98)_100%)] shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-semibold text-white">Resultados</CardTitle>
                <CardDescription className="text-slate-400">
                  A imagem editada aparece aqui assim que a engine concluir o processamento.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {results.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-slate-400">
                    Nenhum resultado ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div key={result.engine_id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{result.motor}</p>
                            <p className="text-xs text-slate-400">{result.engine_id}</p>
                          </div>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-300 hover:text-blue-200"
                          >
                            Abrir
                          </a>
                        </div>

                        <div className={cn("overflow-hidden rounded-xl border border-white/10 bg-black/20", getAspectClass(formato))}>
                          <img src={result.url} alt={result.motor} className="h-full w-full object-cover" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
