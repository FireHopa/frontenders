import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Play,
  Loader2,
  Copy,
  FileText,
  CheckCircle2,
  Coins,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Building2,
  Pencil,
  Save,
  X,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronDown,
} from "lucide-react";
import { api, getClientId } from "@/services/robots";
import { linkedinService } from "@/services/linkedin";
import { instagramService } from "@/services/instagram";
import { facebookService, type FacebookPage } from "@/services/facebook";
import { youtubeService } from "@/services/youtube";
import { tiktokService, type TikTokPrivacyLevel } from "@/services/tiktok";
import { googleBusinessProfileService } from "@/services/googleBusinessProfile";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";
import { tasksByAgentKey, type AuthorityTask } from "@/constants/authorityTasks";
import ResultViewer from "@/components/authority/ResultViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toastSuccess, toastApiError } from "@/lib/toast";
import { useAuthStore } from "@/state/authStore";
import { PublishModal } from "@/components/linkedin/PublishModal";
import { InstagramPublishModal, type InstagramPublishValues } from "@/components/instagram/InstagramPublishModal";
import { FacebookPublishModal, type FacebookPublishValues } from "@/components/facebook/FacebookPublishModal";
import { YouTubePublishModal, type YouTubePublishValues } from "@/components/youtube/YouTubePublishModal";
import { TikTokPublishModal, type TikTokPublishValues } from "@/components/tiktok/TikTokPublishModal";
import { GoogleBusinessApplyModal, parseGoogleBusinessPreview } from "@/components/authority/GoogleBusinessApplyModal";

const STORAGE_KEY = "ori_authority_nucleus_v1";

type ExtraFieldValues = Record<string, string>;
type VideoFormatRecommendation = {
  recommended_format_id: string;
  recommended_format_label: string;
  rationale: string;
} | null;

export function exportFormat(raw: string, format: "md" | "whatsapp" | "txt" | "html"): string {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.blocos)) throw new Error("Not JSON");

    let out = "";

    if (format === "html") {
      out += `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">`;
      if (data.titulo_da_tela) {
        out += `<h1 style="color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px;">${data.titulo_da_tela}</h1>`;
      }
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          const html = b.conteudo.texto
            .replace(/^### (.*$)/gim, '<h4 style="color: #444; margin-top: 16px;">$1</h4>')
            .replace(/^## (.*$)/gim, '<h3 style="color: #333; margin-top: 20px;">$1</h3>')
            .replace(/^# (.*$)/gim, '<h2 style="color: #222; margin-top: 24px;">$1</h2>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\n\n/gim, '</p><p style="margin-bottom: 12px;">')
            .replace(/\n/gim, '<br>');
          out += `<p style="margin-bottom: 12px;">${html}</p>`;
        } else if (b.tipo === "highlight") {
          out += `<div style="background-color: #f8f9fa; border-left: 4px solid #00c8e8; padding: 15px; margin: 20px 0; border-radius: 4px;">`;
          if (b.conteudo.titulo) out += `<strong style="display: block; font-size: 16px; margin-bottom: 8px; color: #009eb8;">💡 ${b.conteudo.titulo}</strong>`;
          out += `<span style="color: #333;">${b.conteudo.texto}</span></div>`;
        } else if (b.tipo === "timeline" && b.conteudo.passos) {
          out += `<ul style="list-style-type: none; padding-left: 0; margin: 20px 0;">`;
          b.conteudo.passos.forEach((p: string) => {
            const html = p.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
            out += `<li style="margin-bottom: 10px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; top: 0; color: #00c8e8;">•</span>${html}</li>`;
          });
          out += `</ul>`;
        } else if (b.tipo === "quote") {
          out += `<blockquote style="font-style: italic; border-left: 4px solid #ccc; padding: 10px 20px; margin: 20px 0; color: #555; background: #f9f9f9;">`;
          out += `"${b.conteudo.texto}"`;
          if (b.conteudo.autor) out += `<br><strong style="display: block; margin-top: 10px; font-style: normal; color: #333;">— ${b.conteudo.autor}</strong>`;
          out += `</blockquote>`;
        } else if (b.tipo === "faq" && b.conteudo.perguntas) {
          out += `<div style="margin: 20px 0;">`;
          b.conteudo.perguntas.forEach((q: any) => {
            const htmlResp = q.resposta.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
            out += `<div style="margin-bottom: 15px;">`;
            out += `<strong style="display: block; font-size: 15px; margin-bottom: 5px; color: #222;">❓ ${q.pergunta}</strong>`;
            out += `<p style="margin: 0; padding-left: 24px; color: #444;">${htmlResp}</p>`;
            out += `</div>`;
          });
          out += `</div>`;
        } else if (b.tipo === "keyword_list" && b.conteudo.items) {
          out += `<div style="margin: 20px 0;">`;
          if (b.conteudo.titulo) out += `<h3 style="color:#222; margin-bottom: 8px;">${b.conteudo.titulo}</h3>`;
          if (b.conteudo.limite_por_item) out += `<p style="margin:0 0 12px; color:#666; font-size:13px;">Limite: ${b.conteudo.limite_por_item}</p>`;
          out += `<div style="display:grid; gap:8px;">`;
          b.conteudo.items.forEach((item: string) => {
            out += `<div style="padding:10px 12px; border:1px solid #e5e7eb; border-radius:12px; background:#fafafa;">${item}</div>`;
          });
          out += `</div></div>`;
        } else if (b.tipo === "service_cards" && b.conteudo.items) {
          out += `<div style="margin: 20px 0;">`;
          if (b.conteudo.titulo) out += `<h3 style="color:#222; margin-bottom: 12px;">${b.conteudo.titulo}</h3>`;
          out += `<div style="display:grid; gap:12px;">`;
          b.conteudo.items.forEach((item: any) => {
            out += `<div style="padding:14px; border:1px solid #e5e7eb; border-radius:16px; background:#fff;">`;
            out += `<strong style="display:block; font-size:16px; margin-bottom:6px;">${item.nome}</strong>`;
            out += `<p style="margin:0 0 10px; color:#444;">${item.descricao}</p>`;
            if (Array.isArray(item.palavras_chave) && item.palavras_chave.length) {
              out += `<p style="margin:0; color:#666; font-size:13px;"><strong>Palavras-chave:</strong> ${item.palavras_chave.join(' • ')}</p>`;
            }
            out += `</div>`;
          });
          out += `</div></div>`;
        } else if (b.tipo === "response_variations" && b.conteudo.items) {
          out += `<div style="margin: 20px 0;">`;
          if (b.conteudo.titulo) out += `<h3 style="color:#222; margin-bottom: 12px;">${b.conteudo.titulo}</h3>`;
          out += `<div style="display:grid; gap:10px;">`;
          b.conteudo.items.forEach((item: string) => {
            out += `<div style="padding:12px 14px; border:1px solid #e5e7eb; border-radius:14px; background:#fafafa;">${item}</div>`;
          });
          out += `</div></div>`;
        }
      });
      out += `</div>`;
      return out;
    }

    if (format === "whatsapp") {
      if (data.titulo_da_tela) out += `*${data.titulo_da_tela.toUpperCase()}*\n\n`;
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          const text = b.conteudo.texto
            .replace(/^### (.*$)/gim, '*$1*')
            .replace(/^## (.*$)/gim, '*$1*')
            .replace(/^# (.*$)/gim, '*$1*')
            .replace(/\*\*/g, '*');
          out += `${text}\n\n`;
        } else if (b.tipo === "highlight") {
          out += `💡 *${(b.conteudo.titulo || 'Atenção').toUpperCase()}*\n_${b.conteudo.texto}_\n\n`;
        } else if (b.tipo === "timeline" && b.conteudo.passos) {
          b.conteudo.passos.forEach((p: string) => {
            const text = p.replace(/\*\*/g, '*');
            out += `🔹 ${text}\n`;
          });
          out += "\n";
        } else if (b.tipo === "quote") {
          out += `"${b.conteudo.texto}"\n`;
          if (b.conteudo.autor) out += `— _${b.conteudo.autor}_\n`;
          out += "\n";
        } else if (b.tipo === "faq" && b.conteudo.perguntas) {
          b.conteudo.perguntas.forEach((q: any) => {
            const text = q.resposta.replace(/\*\*/g, '*');
            out += `❓ *${q.pergunta}*\n${text}\n\n`;
          });
        } else if (b.tipo === "keyword_list" && b.conteudo.items) {
          if (b.conteudo.titulo) out += `*${b.conteudo.titulo}*\n`;
          b.conteudo.items.forEach((item: string) => { out += `• ${item}\n`; });
          out += `\n`;
        } else if (b.tipo === "service_cards" && b.conteudo.items) {
          if (b.conteudo.titulo) out += `*${b.conteudo.titulo}*\n\n`;
          b.conteudo.items.forEach((item: any) => {
            out += `*${item.nome}*\n${item.descricao}\n`;
            if (Array.isArray(item.palavras_chave) && item.palavras_chave.length) out += `_Palavras-chave:_ ${item.palavras_chave.join(' • ')}\n`;
            out += `\n`;
          });
        } else if (b.tipo === "response_variations" && b.conteudo.items) {
          if (b.conteudo.titulo) out += `*${b.conteudo.titulo}*\n\n`;
          b.conteudo.items.forEach((item: string, idx: number) => { out += `*Resposta ${idx + 1}*\n${item}\n\n`; });
        }
      });
      return out.trim();
    }

    if (format === "txt") {
      if (data.titulo_da_tela) out += `${data.titulo_da_tela.toUpperCase()}\n`;
      if (data.titulo_da_tela) out += `${"=".repeat(data.titulo_da_tela.length)}\n\n`;
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          const text = b.conteudo.texto
            .replace(/^### (.*$)/gim, '$1')
            .replace(/^## (.*$)/gim, '$1')
            .replace(/^# (.*$)/gim, '$1')
            .replace(/\*\*/g, '');
          out += `${text}\n\n`;
        } else if (b.tipo === "highlight") {
          out += `>> DICA: ${b.conteudo.titulo ? b.conteudo.titulo.toUpperCase() : 'ATENÇÃO'}\n${b.conteudo.texto}\n\n`;
        } else if (b.tipo === "timeline" && b.conteudo.passos) {
          b.conteudo.passos.forEach((p: string) => {
            const text = p.replace(/\*\*/g, '');
            out += `- ${text}\n`;
          });
          out += "\n";
        } else if (b.tipo === "quote") {
          out += `"${b.conteudo.texto}"\n`;
          if (b.conteudo.autor) out += `— ${b.conteudo.autor}\n`;
          out += "\n";
        } else if (b.tipo === "faq" && b.conteudo.perguntas) {
          b.conteudo.perguntas.forEach((q: any) => {
            const text = q.resposta.replace(/\*\*/g, '');
            out += `P: ${q.pergunta}\nR: ${text}\n\n`;
          });
        } else if (b.tipo === "keyword_list" && b.conteudo.items) {
          if (b.conteudo.titulo) out += `${b.conteudo.titulo}\n`;
          b.conteudo.items.forEach((item: string) => { out += `- ${item}\n`; });
          out += `\n`;
        } else if (b.tipo === "service_cards" && b.conteudo.items) {
          if (b.conteudo.titulo) out += `${b.conteudo.titulo}\n\n`;
          b.conteudo.items.forEach((item: any) => {
            out += `${item.nome}\n${item.descricao}\n`;
            if (Array.isArray(item.palavras_chave) && item.palavras_chave.length) out += `Palavras-chave: ${item.palavras_chave.join(' | ')}\n`;
            out += `\n`;
          });
        } else if (b.tipo === "response_variations" && b.conteudo.items) {
          if (b.conteudo.titulo) out += `${b.conteudo.titulo}\n\n`;
          b.conteudo.items.forEach((item: string, idx: number) => { out += `Resposta ${idx + 1}:\n${item}\n\n`; });
        }
      });
      return out.trim();
    }

    if (data.titulo_da_tela) out += `# ${data.titulo_da_tela}\n\n`;
    data.blocos.forEach((b: any) => {
      if (b.tipo === "markdown") {
        out += `${b.conteudo.texto}\n\n`;
      } else if (b.tipo === "highlight") {
        out += `💡 **${b.conteudo.titulo || 'Atenção'}**\n${b.conteudo.texto}\n\n`;
      } else if (b.tipo === "timeline" && b.conteudo.passos) {
        b.conteudo.passos.forEach((p: string) => (out += `• ${p}\n`));
        out += "\n";
      } else if (b.tipo === "quote") {
        out += `> "${b.conteudo.texto}"\n`;
        if (b.conteudo.autor) out += `> — ${b.conteudo.autor}\n`;
        out += "\n";
      } else if (b.tipo === "faq" && b.conteudo.perguntas) {
        b.conteudo.perguntas.forEach((q: any) => {
          out += `**P: ${q.pergunta}**\nR: ${q.resposta}\n\n`;
        });
      } else if (b.tipo === "keyword_list" && b.conteudo.items) {
        if (b.conteudo.titulo) out += `## ${b.conteudo.titulo}\n\n`;
        b.conteudo.items.forEach((item: string) => { out += `- ${item}\n`; });
        out += `\n`;
      } else if (b.tipo === "service_cards" && b.conteudo.items) {
        if (b.conteudo.titulo) out += `## ${b.conteudo.titulo}\n\n`;
        b.conteudo.items.forEach((item: any) => {
          out += `### ${item.nome}\n${item.descricao}\n\n`;
          if (Array.isArray(item.palavras_chave) && item.palavras_chave.length) out += `**Palavras-chave:** ${item.palavras_chave.join(' • ')}\n\n`;
        });
      } else if (b.tipo === "response_variations" && b.conteudo.items) {
        if (b.conteudo.titulo) out += `## ${b.conteudo.titulo}\n\n`;
        b.conteudo.items.forEach((item: string, idx: number) => {
          out += `### Resposta ${idx + 1}\n${item}\n\n`;
        });
      }
    });
    return out.trim();
  } catch {
    if (format === "html") return `<pre style="white-space: pre-wrap; font-family: sans-serif;">${raw}</pre>`;
    if (format === "txt") return raw.replace(/\*\*/g, "").replace(/^#+ /gm, "");
    if (format === "whatsapp") return raw.replace(/\*\*/g, "*").replace(/^#+ /gm, "*");
    return raw;
  }
}

function ThemeModal({
  open,
  task,
  customTheme,
  setCustomTheme,
  suggestedThemes,
  isFetchingThemes,
  loading,
  onClose,
  onGenerateThemes,
  onExecute,
  extraFieldValues,
  setExtraFieldValue,
  videoFormatRecommendation,
  isAnalyzingVideoFormat,
  onAnalyzeVideoFormat,
}: {
  open: boolean;
  task: AuthorityTask | null;
  customTheme: string;
  setCustomTheme: (value: string) => void;
  suggestedThemes: string[];
  isFetchingThemes: boolean;
  loading: boolean;
  onClose: () => void;
  onGenerateThemes: () => void;
  onExecute: (theme: string) => void;
  extraFieldValues: ExtraFieldValues;
  setExtraFieldValue: (key: string, value: string) => void;
  videoFormatRecommendation: VideoFormatRecommendation;
  isAnalyzingVideoFormat: boolean;
  onAnalyzeVideoFormat: () => void;
}) {
  if (!open || !task) return null;

  const taskTitle = task.title;
  const inputMode = task.inputMode || "theme";
  const inputLabel = task.inputLabel || (inputMode === "textarea" ? "Cole o conteúdo que será usado pela IA" : "Escreva o foco/tema do conteúdo");
  const inputPlaceholder = task.inputPlaceholder || (inputMode === "textarea" ? "Cole aqui o texto que a IA deve usar como base." : "Ex: Por que a nossa solução é melhor...");
  const submitLabel = task.submitLabel || "Gerar Conteúdo";
  const showAiSuggestions = inputMode === "theme" && task.aiSuggestions !== false;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-background/80 backdrop-blur-sm px-4 pt-[10vh] pb-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50 shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-google-blue" /> {inputMode === "textarea" ? "Enviar conteúdo para a IA" : "Escolha o Foco do Conteúdo"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Ação: {taskTitle}</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-background/30 custom-scrollbar">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground px-1 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {inputLabel}
            </label>
            <div className={inputMode === "textarea" ? "flex flex-col gap-3" : "flex gap-2"}>
              {inputMode === "textarea" ? (
                <Textarea
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="rounded-xl shadow-sm min-h-[180px]"
                />
              ) : (
                <Input
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="rounded-xl shadow-sm h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customTheme.trim()) onExecute(customTheme);
                  }}
                />
              )}
              <Button
                disabled={!customTheme.trim() || loading}
                variant="accent"
                className={inputMode === "textarea" ? "rounded-xl self-end h-11 px-6 shadow-sm" : "rounded-xl shrink-0 h-11 px-6 shadow-sm"}
                onClick={() => onExecute(customTheme)}
              >
                {submitLabel}
              </Button>
            </div>
          </div>

          {task.extraFields && task.extraFields.length > 0 ? (
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background/60 p-4">
              {task.extraFields.map((field) => {
                const value = extraFieldValues[field.key] || "";
                return (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">{field.label}</label>
                    <select
                      value={value}
                      onChange={(e) => setExtraFieldValue(field.key, e.target.value)}
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    >
                      <option value="">{field.placeholder || "Selecione"}</option>
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>

                    {field.aiRecommended ? (
                      <div className="rounded-2xl border border-dashed border-google-blue/30 bg-google-blue/5 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-google-blue">Recomendação da IA</p>
                            <p className="text-sm text-muted-foreground mt-1">A IA analisa o tema e sugere o melhor formato para gravar.</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            disabled={!customTheme.trim() || isAnalyzingVideoFormat}
                            onClick={onAnalyzeVideoFormat}
                          >
                            {isAnalyzingVideoFormat ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-google-blue" />}
                            Analisar melhor formato
                          </Button>
                        </div>

                        {videoFormatRecommendation ? (
                          <div className="mt-3 rounded-xl border border-google-blue/20 bg-background/80 p-3">
                            <p className="text-sm font-semibold text-foreground">Formato recomendado: <span className="text-google-blue">{videoFormatRecommendation.recommended_format_label}</span></p>
                            <p className="text-sm text-muted-foreground mt-1">{videoFormatRecommendation.rationale}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {showAiSuggestions && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground rounded-full border border-border/50">Ou peça ajuda à IA</span>
                </div>
              </div>

              {isFetchingThemes ? (
                <div className="py-8 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 text-google-blue animate-spin" />
                  <p className="text-sm font-medium text-muted-foreground animate-pulse">A IA está a analisar o núcleo e a pensar em temas estratégicos...</p>
                </div>
              ) : suggestedThemes.length > 0 ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="text-sm font-semibold text-foreground px-1 uppercase tracking-wider text-muted-foreground">Sugestões Estratégicas (IA)</label>
                  <div className="grid gap-2">
                    {suggestedThemes.map((theme, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="h-auto py-3.5 px-4 justify-start text-left font-medium whitespace-normal bg-card hover:bg-[rgba(0,200,232,0.05)] hover:border-google-blue/30 hover:text-google-blue transition-all rounded-xl shadow-sm"
                        onClick={() => onExecute(theme)}
                      >
                        <ArrowRight className="h-4 w-4 mr-3 shrink-0 opacity-50" />
                        {theme}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button variant="outline" className="rounded-xl shadow-sm hover:text-google-blue hover:bg-google-blue/5 border-dashed w-full py-6 transition-all" onClick={onGenerateThemes}>
                    <Sparkles className="h-5 w-5 mr-2 text-google-blue" />
                    Gerar 5 Temas com IA (Custa 2 Créditos)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthorityAgentRunPage() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isTikTokModalOpen, setIsTikTokModalOpen] = useState(false);
  const [isGoogleBusinessModalOpen, setIsGoogleBusinessModalOpen] = useState(false);
  const [isLinkingGoogleBusiness, setIsLinkingGoogleBusiness] = useState(false);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [facebookSelectedPageId, setFacebookSelectedPageId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [tiktokPrivacyOptions, setTikTokPrivacyOptions] = useState<TikTokPrivacyLevel[]>([]);
  const [tiktokPrivacyLabels, setTikTokPrivacyLabels] = useState<Record<string, string>>({});
  const [tiktokMaxDurationSeconds, setTikTokMaxDurationSeconds] = useState<number | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [themeModalTask, setThemeModalTask] = useState<AuthorityTask | null>(null);
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([]);
  const [isFetchingThemes, setIsFetchingThemes] = useState(false);
  const [customTheme, setCustomTheme] = useState("");
  const [extraFieldValues, setExtraFieldValues] = useState<ExtraFieldValues>({});
  const [videoFormatRecommendation, setVideoFormatRecommendation] = useState<VideoFormatRecommendation>(null);
  const [isAnalyzingVideoFormat, setIsAnalyzingVideoFormat] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const { user, deductCredits } = useAuthStore();
  const agent = AUTHORITY_AGENTS.find((a) => a.key === agentKey);
  const tasks = agentKey ? tasksByAgentKey(agentKey) : [];

  useEffect(() => {
    if (!themeModalTask) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setThemeModalTask(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [themeModalTask]);

  useEffect(() => {
    if (!isModalOpen && !isInstagramModalOpen && !isFacebookModalOpen && !isYouTubeModalOpen && !isTikTokModalOpen && !themeModalTask && !showDownloadMenu) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isInstagramModalOpen, isFacebookModalOpen, isYouTubeModalOpen, isTikTokModalOpen, themeModalTask, showDownloadMenu]);

  useEffect(() => {
    if (result) {
      setThemeModalTask(null);
      setShowDownloadMenu(false);
    }
  }, [result]);

  async function handleOpenTask(task?: AuthorityTask) {
    if (!agentKey) return;
    if (!user || user.credits < 5) {
      toastApiError(new Error("Precisas de pelo menos 5 créditos para executar esta ação."), "Créditos Insuficientes");
      return;
    }

    const resolvedTask: AuthorityTask = task || { title: "Estratégia Completa Padrão", inputMode: "direct", aiSuggestions: false };
    setSuggestedThemes([]);
    setCustomTheme("");
    setExtraFieldValues({});
    setVideoFormatRecommendation(null);

    if (resolvedTask.inputMode === "direct") {
      await executeTask("", resolvedTask);
      return;
    }

    setThemeModalTask(resolvedTask);
  }

  function setExtraFieldValue(key: string, value: string) {
    setExtraFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAnalyzeVideoFormat() {
    if (!agentKey || !themeModalTask || !customTheme.trim()) return;
    setIsAnalyzingVideoFormat(true);
    try {
      const rawNucleus = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const res = await api.authorityAgents.suggestVideoFormat({
        agent_key: agentKey,
        theme: customTheme,
        nucleus: rawNucleus,
      });
      setVideoFormatRecommendation(res);
      setExtraFieldValue("video_format", res.recommended_format_id);
      toastSuccess("Melhor formato recomendado pela IA!");
    } catch (e: any) {
      toastApiError(e, "Falha ao analisar o melhor formato");
    } finally {
      setIsAnalyzingVideoFormat(false);
    }
  }

  async function handleGenerateThemesWithIA() {
    if (!agentKey || !themeModalTask) return;
    if (!user || user.credits < 2) {
      toastApiError(new Error("Precisas de pelo menos 2 créditos para gerar sugestões de temas."), "Créditos Insuficientes");
      return;
    }

    setIsFetchingThemes(true);
    try {
      const rawNucleus = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const res = await api.authorityAgents.suggestThemes({
        agent_key: agentKey,
        task: themeModalTask?.prompt || themeModalTask?.title || "",
        nucleus: rawNucleus,
      });
      deductCredits(2);
      setSuggestedThemes(res.themes || []);
      toastSuccess("Temas gerados com sucesso!");
    } catch (e: any) {
      toastApiError(e, "Falha ao buscar sugestões de temas. Tente escrever o seu próprio.");
    } finally {
      setIsFetchingThemes(false);
    }
  }

  async function executeTask(finalTheme: string, taskOverride?: AuthorityTask) {
    if (!agentKey) return;
    const activeTask = taskOverride || themeModalTask || undefined;
    setThemeModalTask(null);
    setLoading(true);
    setResult(null);
    setIsEditing(false);

    try {
      const rawNucleus = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const payload = {
        client_id: getClientId(),
        agent_key: agentKey,
        nucleus: {
          ...rawNucleus,
          ...(activeTask && activeTask.title !== "Estratégia Completa Padrão" ? { requested_task: activeTask.prompt || activeTask.title } : {}),
          ...(finalTheme ? { selected_theme: finalTheme } : {}),
          ...(activeTask?.inputMode === "textarea" && finalTheme ? { review_to_reply: finalTheme } : {}),
          ...(Object.keys(extraFieldValues).length ? extraFieldValues : {}),
          ...(videoFormatRecommendation ? {
            recommended_video_format: videoFormatRecommendation.recommended_format_label,
            recommended_video_format_id: videoFormatRecommendation.recommended_format_id,
            recommended_video_format_reason: videoFormatRecommendation.rationale,
          } : {}),
        },
      };

      const data = await api.authorityAgents.runGlobal(payload);
      deductCredits(5);
      setResult(data);
      toastSuccess("Tarefa concluída com sucesso!");
    } catch (e: any) {
      toastApiError(e, "Falha ao executar agente");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    if (!result?.output_text || !agent) return;
    const htmlContent = exportFormat(result.output_text, "html");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toastApiError(new Error("Por favor, permita pop-ups neste site para imprimir/salvar PDF."), "Erro");
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Resultado - ${agent.name}</title><meta charset="utf-8"></head><body>${htmlContent}<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script></body></html>`);
    printWindow.document.close();
  }

  function downloadFile(format: "md" | "txt" | "doc" | "pdf") {
    if (format === "pdf") {
      handlePrint();
      setShowDownloadMenu(false);
      return;
    }

    const rawText = String(result?.output_text ?? "");
    if (!rawText) return;

    let mimeType = "text/plain;charset=utf-8";
    let fileContent = "";

    if (format === "doc") {
      mimeType = "application/msword";
      const htmlContent = exportFormat(rawText, "html");
      fileContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${htmlContent}</body></html>`;
    } else {
      fileContent = exportFormat(rawText, format as any);
    }

    const blob = new Blob([format === "doc" ? "\ufeff" + fileContent : fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentKey}-resultado.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  }

  async function handleLinkedInClick() {
    if (user?.has_linkedin) {
      setShowDownloadMenu(false);
      setIsModalOpen(true);
      return;
    }
    try {
      toastSuccess("Redirecionando para o LinkedIn...");
      const data = await linkedinService.getAuthUrl();
      window.location.href = data.url;
    } catch (err) {
      toastApiError(err, "Erro ao iniciar conexão com LinkedIn");
    }
  }

  async function handlePublishPost(finalText: string) {
    setIsPublishing(true);
    try {
      await linkedinService.publish(finalText);
      toastSuccess("Post publicado no seu LinkedIn com sucesso! 🎉");
      setIsModalOpen(false);
    } catch (err) {
      toastApiError(err, "Erro ao publicar no LinkedIn");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleInstagramClick() {
    if (isPublishing) return;
    if (user?.has_instagram) {
      setShowDownloadMenu(false);
      setThemeModalTask(null);
      setIsInstagramModalOpen(true);
      return;
    }
    try {
      toastSuccess("Redirecionando para o Instagram...");
      instagramService.startAuth(window.location.pathname);
    } catch (err) {
      toastApiError(err, "Erro ao iniciar conexão com Instagram");
    }
  }

  async function handlePublishInstagram(values: InstagramPublishValues) {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      const payload = {
        caption: values.caption,
        image_url: values.imageUrl || undefined,
        carousel_images: values.carouselImages || [],
        collaborators: values.collaborators || [],
        location_id: values.locationId || undefined,
        first_comment: values.firstComment || undefined,
      };
      const res = await instagramService.publish(payload);
      toastSuccess(res?.warning ? "Post publicado, mas houve aviso no comentário." : "Post publicado no seu Instagram com sucesso! 🎉");
      setIsInstagramModalOpen(false);
    } catch (err) {
      toastApiError(err, "Erro ao publicar no Instagram");
    } finally {
      setIsPublishing(false);
    }
  }


  async function loadFacebookStatus() {
    const status = await facebookService.status();
    let parsedPages: FacebookPage[] = [];
    try {
      parsedPages = JSON.parse(status.pages || "[]");
    } catch {
      parsedPages = [];
    }
    setFacebookPages(parsedPages);
    setFacebookSelectedPageId((current) => current || status.page_id || parsedPages[0]?.id || "");
    return { status, pages: parsedPages };
  }

  async function handleFacebookClick() {
    if (isPublishing) return;
    if (user?.has_facebook) {
      try {
        await loadFacebookStatus();
        setShowDownloadMenu(false);
        setThemeModalTask(null);
        setIsFacebookModalOpen(true);
        return;
      } catch (err) {
        toastApiError(err, "Erro ao carregar páginas do Facebook");
        return;
      }
    }
    try {
      toastSuccess("Redirecionando para o Facebook...");
      facebookService.startAuth(window.location.pathname);
    } catch (err) {
      toastApiError(err, "Erro ao iniciar conexão com Facebook");
    }
  }

  async function handleSelectFacebookPage(pageId: string) {
    setFacebookSelectedPageId(pageId);
    try {
      await facebookService.selectPage(pageId);
    } catch (err) {
      toastApiError(err, "Erro ao trocar a página do Facebook");
    }
  }

  async function handlePublishFacebook(values: FacebookPublishValues) {
    if (isPublishing) return;
    setIsPublishing(true);
    try {
      if (values.selectedPageId && values.selectedPageId !== facebookSelectedPageId) {
        await facebookService.selectPage(values.selectedPageId);
        setFacebookSelectedPageId(values.selectedPageId);
      }
      const scheduled_publish_time = values.published || !values.scheduledPublishTime ? undefined : Math.floor(new Date(values.scheduledPublishTime).getTime() / 1000);
      const payload = {
        message: values.message,
        link: values.link || undefined,
        image_url: values.imageUrl || undefined,
        carousel_images: values.carouselImages || [],
        published: values.published,
        scheduled_publish_time,
        backdated_time: values.backdatedTime ? new Date(values.backdatedTime).toISOString() : undefined,
        place: values.place || undefined,
        tags: values.tags || [],
      };
      await facebookService.publish(payload);
      toastSuccess(values.published ? "Post publicado no Facebook com sucesso! 🎉" : "Publicação salva/agendada no Facebook com sucesso!");
      setIsFacebookModalOpen(false);
    } catch (err) {
      toastApiError(err, "Erro ao publicar no Facebook");
    } finally {
      setIsPublishing(false);
    }
  }


  async function handleYouTubeClick() {
    if (isPublishing) return;
    if (user?.has_youtube) {
      setShowDownloadMenu(false);
      setIsYouTubeModalOpen(true);
      return;
    }
    try {
      const state = `youtube::${window.location.pathname}::${Date.now()}`;
      localStorage.setItem("youtube_oauth_state", state);
      localStorage.setItem("youtube_redirect", window.location.pathname);
      toastSuccess("Redirecionando para o YouTube...");
      const data = await youtubeService.getAuthUrl(state);
      window.location.href = data.url;
    } catch (err) {
      toastApiError(err, "Erro ao iniciar conexão com YouTube");
    }
  }

  async function handlePublishYouTube(values: YouTubePublishValues) {
    if (isPublishing || !values.videoFile) return;
    setIsPublishing(true);
    try {
      const res = await youtubeService.publish({
        title: values.title,
        description: values.description,
        privacy_status: values.privacyStatus,
        made_for_kids: values.madeForKids,
        tags: values.tags,
        category_id: values.categoryId,
        video_file: values.videoFile,
        thumbnail_file: values.thumbnailFile,
      });
      toastSuccess(res.thumbnail_warning ? "Vídeo enviado ao YouTube. A thumbnail não foi aplicada." : "Vídeo publicado no YouTube com sucesso! 🎉");
      setIsYouTubeModalOpen(false);
    } catch (err) {
      toastApiError(err, "Erro ao publicar no YouTube");
    } finally {
      setIsPublishing(false);
    }
  }


  async function handleTikTokClick() {
    if (isPublishing) return;
    if (user?.has_tiktok) {
      try {
        const status = await tiktokService.status();
        setTikTokPrivacyOptions(status.privacy_level_options ?? []);
        setTikTokPrivacyLabels(status.privacy_level_labels ?? {});
        setTikTokMaxDurationSeconds(status.max_video_post_duration_sec);
        setShowDownloadMenu(false);
        setIsTikTokModalOpen(true);
        return;
      } catch (err) {
        toastApiError(err, "Erro ao carregar status do TikTok");
        return;
      }
    }
    try {
      const state = `tiktok::${window.location.pathname}::${Date.now()}`;
      localStorage.setItem("tiktok_oauth_state", state);
      localStorage.setItem("tiktok_redirect", window.location.pathname);
      toastSuccess("Redirecionando para o TikTok...");
      const data = await tiktokService.getAuthUrl(state);
      window.location.href = data.url;
    } catch (err) {
      toastApiError(err, "Erro ao iniciar conexão com TikTok");
    }
  }

  async function handlePublishTikTok(values: TikTokPublishValues) {
    if (isPublishing || !values.videoFile) return;
    setIsPublishing(true);
    try {
      await tiktokService.publish({
        privacy_level: values.privacyLevel,
        disable_duet: values.disableDuet,
        disable_comment: values.disableComment,
        disable_stitch: values.disableStitch,
        brand_content_toggle: values.brandContentToggle,
        brand_organic_toggle: values.brandOrganicToggle,
        is_aigc: values.isAigc,
        caption: values.caption,
        video_cover_timestamp_ms: values.videoCoverTimestampMs,
        video_file: values.videoFile,
      });
      toastSuccess("Vídeo publicado no TikTok com sucesso! 🎉");
      setIsTikTokModalOpen(false);
    } catch (err) {
      toastApiError(err, "Erro ao publicar no TikTok");
    } finally {
      setIsPublishing(false);
    }
  }


  async function handleGoogleBusinessClick() {
    if (isPublishing) return;

    const preview = parseGoogleBusinessPreview(result?.output_text || "");
    if (!preview) {
      toastApiError(new Error("Formato incompatível"), "Gere novamente usando uma ação de serviços compatível do Perfil Google");
      return;
    }

    if (user?.has_google_business_profile) {
      setShowDownloadMenu(false);
      setIsGoogleBusinessModalOpen(true);
      return;
    }

    try {
      setIsLinkingGoogleBusiness(true);
      localStorage.setItem("google_business_redirect", window.location.pathname);
      toastSuccess("Redirecionando para o Perfil de Empresa Google...");
      const data = await googleBusinessProfileService.getAuthUrl();
      localStorage.setItem("google_business_oauth_state", data.state);
      window.location.href = data.url;
    } catch (err) {
      toastApiError(err, "Erro ao iniciar conexão com Perfil de Empresa Google");
      setIsLinkingGoogleBusiness(false);
    }
  }

  function handleEdit() {
    setEditedText(exportFormat(result?.output_text || "", "md"));
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!result?.id) return;
    setIsSaving(true);
    try {
      const updated = await api.authorityAgents.updateRunGlobal(result.id, { output_text: editedText });
      setResult(updated);
      setIsEditing(false);
      toastSuccess("Texto atualizado e salvo com sucesso!");
    } catch (err) {
      toastApiError(err, "Erro ao salvar edição");
    } finally {
      setIsSaving(false);
    }
  }

  function handleWhatsAppShare() {
    if (!result?.output_text) return;
    const whatsAppText = exportFormat(result.output_text, "whatsapp");
    const encodedText = encodeURIComponent(whatsAppText);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
  }

  if (!agent) return <div className="p-8">Agente não encontrado.</div>;
  const hasEnoughCredits = !!user && user.credits >= 5;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8 relative">
      <PublishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialText={exportFormat(result?.output_text || "", "txt")}
        onPublish={handlePublishPost}
        loading={isPublishing}
      />

      <InstagramPublishModal
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        initialCaption={exportFormat(result?.output_text || "", "txt")}
        onPublish={handlePublishInstagram}
        loading={isPublishing}
      />

      <FacebookPublishModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
        initialText={exportFormat(result?.output_text || "", "txt")}
        onPublish={handlePublishFacebook}
        onSelectPage={handleSelectFacebookPage}
        loading={isPublishing}
        pages={facebookPages}
        selectedPageId={facebookSelectedPageId}
      />


      <GoogleBusinessApplyModal
        isOpen={isGoogleBusinessModalOpen}
        onClose={() => setIsGoogleBusinessModalOpen(false)}
        rawOutput={result?.output_text || ""}
        loading={isPublishing}
        onApplied={() => toastSuccess("Serviços atualizados no Perfil de Empresa Google com sucesso!")}
      />

      <YouTubePublishModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        initialTitle={agent?.name ? `${agent.name} | ${new Date().toLocaleDateString()}` : "Novo vídeo"}
        initialDescription={exportFormat(result?.output_text || "", "txt")}
        onPublish={handlePublishYouTube}
        loading={isPublishing}
      />

      <TikTokPublishModal
        isOpen={isTikTokModalOpen}
        onClose={() => setIsTikTokModalOpen(false)}
        initialCaption={exportFormat(result?.output_text || "", "txt")}
        onPublish={handlePublishTikTok}
        loading={isPublishing}
        privacyOptions={tiktokPrivacyOptions}
        privacyLabels={tiktokPrivacyLabels}
        maxDurationSeconds={tiktokMaxDurationSeconds}
      />

      <ThemeModal
        open={!!themeModalTask}
        task={themeModalTask}
        customTheme={customTheme}
        setCustomTheme={setCustomTheme}
        suggestedThemes={suggestedThemes}
        isFetchingThemes={isFetchingThemes}
        loading={loading}
        onClose={() => setThemeModalTask(null)}
        onGenerateThemes={handleGenerateThemesWithIA}
        onExecute={executeTask}
        extraFieldValues={extraFieldValues}
        setExtraFieldValue={setExtraFieldValue}
        videoFormatRecommendation={videoFormatRecommendation}
        isAnalyzingVideoFormat={isAnalyzingVideoFormat}
        onAnalyzeVideoFormat={handleAnalyzeVideoFormat}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[rgba(0,200,232,0.08)] text-google-blue flex items-center justify-center border border-google-blue/20 shrink-0">
            <agent.Icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
            <p className="text-muted-foreground mt-1">{agent.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 font-medium px-4 py-2 rounded-xl shrink-0 border border-blue-500/20">
          <Coins className="h-4 w-4" />
          <span className="text-sm">Custo: 5 Créditos</span>
        </div>
      </div>

      {!result && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">Escolha uma ação para executar:</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tasks.length > 0 ? (
              tasks.map((task, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  disabled={loading || !hasEnoughCredits}
                  className={`h-auto py-4 px-5 justify-start text-left font-normal whitespace-normal leading-snug rounded-2xl shadow-sm transition-all ${!hasEnoughCredits ? 'opacity-50 cursor-not-allowed bg-zinc-100/5' : 'bg-card hover:bg-google-blue/5 hover:border-google-blue/40'}`}
                  onClick={() => handleOpenTask(task)}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-3 animate-spin shrink-0" /> : <Play className={`h-4 w-4 mr-3 shrink-0 ${hasEnoughCredits ? 'text-google-blue opacity-70' : 'text-zinc-500'}`} />}
                  {task.title}
                </Button>
              ))
            ) : (
              <div className="sm:col-span-2">
                <Button variant="accent" disabled={loading || !hasEnoughCredits} className="w-full h-auto py-4 rounded-2xl" onClick={() => handleOpenTask()}>
                  {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : "Gerar Estratégia Completa Padrão"}
                </Button>
              </div>
            )}
          </div>
          {!hasEnoughCredits && <p className="text-sm text-red-500 text-center mt-4 bg-red-500/10 py-3 rounded-xl">Não tens créditos suficientes para executar os agentes hoje.</p>}
        </div>
      )}

      {loading && !themeModalTask && !result && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 text-google-blue animate-spin" />
          <p className="text-muted-foreground font-medium">A IA está a processar o núcleo e a gerar o resultado final...</p>
        </div>
      )}

      {result && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-[rgba(0,210,120,0.15)] border border-[rgba(0,210,120,0.22)] p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-[#00D278] font-medium">
              <CheckCircle2 className="h-5 w-5" /> Resultado gerado com sucesso
            </div>
            <div className="flex flex-wrap gap-2">
              {!isEditing && (
                <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl hover:text-google-blue" onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
              )}
              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={() => { navigator.clipboard.writeText(exportFormat(result.output_text, "txt")); toastSuccess("Copiado!"); }}>
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>

              <div className="relative">
                <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={() => setShowDownloadMenu((prev) => !prev)}>
                  <FileText className="h-4 w-4 mr-2" /> Baixar <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                </Button>

                {showDownloadMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                    <div className="absolute top-full left-0 mt-2 w-40 bg-popover border border-border rounded-xl shadow-lg z-50 flex flex-col p-1.5 overflow-hidden">
                      <button onClick={() => downloadFile("pdf")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📄 PDF</button>
                      <button onClick={() => downloadFile("doc")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📝 Word (.doc)</button>
                      <button onClick={() => downloadFile("txt")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📃 Texto (.txt)</button>
                      <button onClick={() => downloadFile("md")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">🛠️ Markdown</button>
                    </div>
                  </>
                )}
              </div>

              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>

              <Button size="sm" className="bg-[#25D366] text-white shadow-sm rounded-xl hover:bg-[#1EBE5D] border-none" onClick={handleWhatsAppShare}>
                <svg className="h-4 w-4 mr-2 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                WhatsApp
              </Button>

              <Button size="sm" className="bg-[#0A66C2] text-white shadow-sm rounded-xl hover:bg-[#004182]" onClick={handleLinkedInClick}>
                <Linkedin className="h-4 w-4 mr-2" /> Publicar no LinkedIn
              </Button>

              <Button size="sm" className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 text-white shadow-sm rounded-xl hover:opacity-95 border-none" onClick={handleInstagramClick}>
                <Instagram className="h-4 w-4 mr-2" /> Publicar no Instagram
              </Button>

              <Button size="sm" className="bg-[#1877F2] text-white shadow-sm rounded-xl hover:bg-[#1664d9] border-none" onClick={handleFacebookClick}>
                <Facebook className="h-4 w-4 mr-2" /> Publicar no Facebook
              </Button>
              <Button size="sm" className="bg-[#FF0033] text-white shadow-sm rounded-xl hover:bg-[#e0002d] border-none" onClick={handleYouTubeClick}>
                <Youtube className="h-4 w-4 mr-2" /> Publicar no YouTube
              </Button>

              <Button size="sm" className="bg-black text-white shadow-sm rounded-xl hover:bg-neutral-800 border-none" onClick={handleTikTokClick}>
                <Sparkles className="h-4 w-4 mr-2" /> Publicar no TikTok
              </Button>

              {agentKey === "google_business_profile" && parseGoogleBusinessPreview(result.output_text) ? (
                <Button size="sm" className="bg-google-blue text-white shadow-sm rounded-xl hover:opacity-95 border-none" onClick={handleGoogleBusinessClick}>
                  {isLinkingGoogleBusiness ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Building2 className="h-4 w-4 mr-2" />}
                  Aplicar no Perfil Google
                </Button>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="min-h-[400px] font-mono text-sm leading-relaxed p-6 rounded-2xl border border-border bg-card shadow-sm focus-visible:ring-google-blue resize-y" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button variant="accent" className="rounded-xl" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
                </Button>
              </div>
            </div>
          ) : (
            <ResultViewer title={agent.name} text={result.output_text} />
          )}

          <div className="mt-8 flex justify-center">
            <Button variant="secondary" className="rounded-xl px-8" onClick={() => { setResult(null); setShowDownloadMenu(false); setThemeModalTask(null); }}>
              Fazer Nova Tarefa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
