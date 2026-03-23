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
  const taskTitleLower = taskTitle.toLowerCase();
  const inputMode = task.inputMode || "theme";
  const inputLabel =
    task.inputLabel ||
    (inputMode === "textarea" ? "Cole o conteúdo que será usado pela IA" : "Escreva o foco/tema do conteúdo");
  const inputPlaceholder =
    task.inputPlaceholder ||
    (inputMode === "textarea"
      ? "Cole aqui o texto que a IA deve usar como base."
      : "Ex: Por que a nossa solução é melhor...");
  const submitLabel = task.submitLabel || "Gerar Conteúdo";
  const showAiSuggestions = inputMode === "theme" && task.aiSuggestions !== false;
  const requiredFields = (task.extraFields || []).filter((field) => field.required);
  const missingFields = requiredFields.filter((field) => !(extraFieldValues[field.key] || "").trim());
  const isInstagramScriptTask = taskTitleLower === "roteiros";
  const isInstagramCaptionTask = taskTitleLower.includes("legendas estratégicas");
  const isTextareaMode = inputMode === "textarea";
  const canSubmit = (!!customTheme.trim() || inputMode === "direct") && missingFields.length === 0 && !loading && !isAnalyzingVideoFormat;

  const stepItems = isInstagramCaptionTask
    ? [
        { number: "1", title: "Tema", detail: "Qual é o assunto central desse conteúdo?" },
        { number: "2", title: "Formato", detail: "Escolha se é reels, carrossel, post, vídeo educativo, opinião ou react." },
        { number: "3", title: "Objetivo", detail: "Defina se a legenda quer alcance, autoridade, conversão ou debate." },
      ]
    : isInstagramScriptTask
      ? [
          { number: "1", title: "Tema", detail: "Defina o assunto principal do vídeo." },
          { number: "2", title: "Formato", detail: "A IA pode recomendar o formato mais forte ou você pode escolher manualmente." },
          { number: "3", title: "Execução", detail: "Só depois disso o roteiro é realmente gerado." },
        ]
      : [
          { number: "1", title: "Contexto", detail: "Informe o foco para a IA trabalhar em cima do núcleo da empresa." },
          { number: "2", title: "Ajustes", detail: "Preencha os campos extras, se houver." },
          { number: "3", title: "Geração", detail: "A IA entrega o material já estruturado." },
        ];

  function renderOptionField(field: NonNullable<AuthorityTask["extraFields"]>[number]) {
    const currentValue = extraFieldValues[field.key] || "";

    return (
      <div key={field.key} className="space-y-3 rounded-[1.75rem] border border-border/70 bg-background/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground">{field.label}</label>
            {field.required ? (
              <p className="mt-1 text-xs text-muted-foreground">Campo obrigatório para gerar o resultado.</p>
            ) : null}
          </div>

          {field.aiRecommended ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!customTheme.trim() || isAnalyzingVideoFormat}
              onClick={onAnalyzeVideoFormat}
            >
              {isAnalyzingVideoFormat ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-google-blue" />
              )}
              Analisar melhor formato
            </Button>
          ) : null}
        </div>

        {field.aiRecommended && videoFormatRecommendation ? (
          <div className="rounded-2xl border border-google-blue/25 bg-google-blue/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-google-blue">Melhor formato indicado pela IA</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {videoFormatRecommendation.recommended_format_label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {videoFormatRecommendation.rationale}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-google-blue/30 bg-background"
                onClick={() => setExtraFieldValue(field.key, videoFormatRecommendation.recommended_format_id)}
              >
                Usar recomendação
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {field.options.map((option) => {
            const isActive = currentValue === option.value;
            const isRecommended = field.aiRecommended && videoFormatRecommendation?.recommended_format_id === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setExtraFieldValue(field.key, option.value)}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-google-blue bg-google-blue/8 shadow-sm"
                    : "border-border/70 bg-card hover:border-google-blue/30 hover:bg-google-blue/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{option.label}</div>
                    {isRecommended ? (
                      <div className="mt-2 inline-flex items-center rounded-full border border-google-blue/20 bg-google-blue/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-google-blue">
                        Recomendado pela IA
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                      isActive
                        ? "border-google-blue bg-google-blue text-white"
                        : "border-border bg-background text-transparent group-hover:border-google-blue/40"
                    }`}
                  >
                    ✓
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-background/80 px-4 pb-6 pt-[4vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/60 bg-gradient-to-br from-google-blue/[0.08] via-transparent to-transparent p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-google-blue/15 bg-google-blue/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-google-blue">
                Fluxo guiado
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {taskTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {task.description ||
                  "A IA vai usar o núcleo da empresa, o contexto informado e as instruções estratégicas para montar a entrega final."}
              </p>
            </div>

            <Button variant="ghost" size="icon" className="rounded-full hover:bg-background/80" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {stepItems.map((step) => (
              <div key={step.number} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-google-blue/10 text-xs font-bold text-google-blue">
                    {step.number}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{step.title}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-background/30 p-6 sm:p-8">
          <div className="space-y-3 rounded-[1.75rem] border border-border/70 bg-background/60 p-5">
            <label className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {inputLabel}
            </label>

            {isTextareaMode ? (
              <Textarea
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder={inputPlaceholder}
                className="min-h-[180px] rounded-2xl shadow-sm"
              />
            ) : (
              <Input
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder={inputPlaceholder}
                className="h-12 rounded-2xl shadow-sm"
              />
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              {isInstagramCaptionTask
                ? "A legenda será montada cruzando tema, formato do conteúdo, objetivo da peça e o núcleo da empresa."
                : isInstagramScriptTask
                  ? "O roteiro só começa a ser gerado quando você clicar em gerar roteiro. Antes disso, você pode escolher ou deixar a IA sugerir o melhor formato."
                  : "Tudo o que você preencher aqui entra no contexto da geração final."}
            </p>
          </div>

          {task.extraFields && task.extraFields.length > 0 ? (
            <div className="space-y-4">
              {task.extraFields.map((field) => renderOptionField(field))}
            </div>
          ) : null}

          {showAiSuggestions ? (
            <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-background/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Sugestões estratégicas de tema</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Clique para preencher o campo. O tema escolhido não executa nada sozinho.
                  </p>
                </div>

                {suggestedThemes.length === 0 && !isFetchingThemes ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-dashed"
                    onClick={onGenerateThemes}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-google-blue" />
                    Gerar 5 temas com IA
                  </Button>
                ) : null}
              </div>

              {isFetchingThemes ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <Loader2 className="h-10 w-10 animate-spin text-google-blue" />
                  <p className="text-sm font-medium text-muted-foreground">
                    A IA está analisando o núcleo e montando temas mais fortes para esse contexto...
                  </p>
                </div>
              ) : suggestedThemes.length > 0 ? (
                <div className="grid gap-3">
                  {suggestedThemes.map((theme, idx) => {
                    const isSelected = customTheme.trim() === theme.trim();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomTheme(theme)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-google-blue bg-google-blue/8 shadow-sm"
                            : "border-border/70 bg-card hover:border-google-blue/30 hover:bg-google-blue/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <ArrowRight className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? "text-google-blue" : "text-muted-foreground"}`} />
                            <div>
                              <p className="text-sm font-medium leading-relaxed text-foreground">{theme}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                {isSelected ? "Tema selecionado" : "Clique para usar este tema"}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                              isSelected ? "border-google-blue bg-google-blue text-white" : "border-border bg-background text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/60 bg-card/95 p-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Resumo da execução</p>
              <div className="flex flex-wrap gap-2">
                {customTheme.trim() ? (
                  <span className="rounded-full border border-google-blue/20 bg-google-blue/10 px-3 py-1.5 text-xs font-medium text-foreground">
                    Tema: {customTheme.trim()}
                  </span>
                ) : null}

                {task.extraFields?.map((field) => {
                  const selectedOption = field.options.find((option) => option.value === extraFieldValues[field.key]);
                  if (!selectedOption) return null;
                  return (
                    <span
                      key={field.key}
                      className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground/90"
                    >
                      {field.label}: {selectedOption.label}
                    </span>
                  );
                })}
              </div>

              {missingFields.length > 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Falta preencher: {missingFields.map((field) => field.label).join(", ")}.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="rounded-xl" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="accent"
                className="rounded-xl px-6"
                disabled={!canSubmit}
                onClick={() => onExecute(customTheme)}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            </div>
          </div>
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

  function updateCustomTheme(value: string) {
    const nextTheme = value || "";
    const themeChanged = nextTheme.trim() !== customTheme.trim();

    setCustomTheme(nextTheme);

    if (!themeChanged) return;

    if (
      videoFormatRecommendation &&
      extraFieldValues.video_format === videoFormatRecommendation.recommended_format_id
    ) {
      setExtraFieldValues((prev) => {
        const next = { ...prev };
        delete next.video_format;
        return next;
      });
    }

    setVideoFormatRecommendation(null);
  }

  function setExtraFieldValue(key: string, value: string) {
    setExtraFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  async function requestVideoFormatRecommendation(theme: string) {
    if (!agentKey || !theme.trim()) return null;

    setIsAnalyzingVideoFormat(true);
    try {
      const rawNucleus = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const res = await api.authorityAgents.suggestVideoFormat({
        agent_key: agentKey,
        theme,
        nucleus: rawNucleus,
      });
      setVideoFormatRecommendation(res);
      return res;
    } catch (e: any) {
      toastApiError(e, "Falha ao analisar o melhor formato");
      return null;
    } finally {
      setIsAnalyzingVideoFormat(false);
    }
  }

  async function handleAnalyzeVideoFormat() {
    if (!themeModalTask || !customTheme.trim()) return;
    const recommendation = await requestVideoFormatRecommendation(customTheme.trim());
    if (!recommendation) return;
    setExtraFieldValue("video_format", recommendation.recommended_format_id);
    toastSuccess("Melhor formato recomendado pela IA!");
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
    const isInstagramScriptTask = agentKey === "instagram" && activeTask?.title === "Roteiros";
    const trimmedTheme = finalTheme.trim();

    let resolvedExtraFieldValues = { ...extraFieldValues };
    let resolvedRecommendation = videoFormatRecommendation;

    if (
      isInstagramScriptTask &&
      trimmedTheme &&
      !resolvedExtraFieldValues.video_format
    ) {
      const recommendation = await requestVideoFormatRecommendation(trimmedTheme);
      if (!recommendation) return;

      resolvedRecommendation = recommendation;
      resolvedExtraFieldValues.video_format = recommendation.recommended_format_id;
      setExtraFieldValues((prev) => ({ ...prev, video_format: recommendation.recommended_format_id }));
      toastSuccess("Formato recomendado definido. Gerando roteiro...");
    }

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
          ...(activeTask && activeTask.title !== "Estratégia Completa Padrão"
            ? { requested_task: activeTask.prompt || activeTask.title }
            : {}),
          ...(trimmedTheme ? { selected_theme: trimmedTheme } : {}),
          ...(activeTask?.inputMode === "textarea" && trimmedTheme ? { review_to_reply: trimmedTheme } : {}),
          ...(Object.keys(resolvedExtraFieldValues).length ? resolvedExtraFieldValues : {}),
          ...(resolvedRecommendation
            ? {
                recommended_video_format: resolvedRecommendation.recommended_format_label,
                recommended_video_format_id: resolvedRecommendation.recommended_format_id,
                recommended_video_format_reason: resolvedRecommendation.rationale,
              }
            : {}),
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
        setCustomTheme={updateCustomTheme}
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
                <button
                  key={idx}
                  type="button"
                  disabled={loading || !hasEnoughCredits}
                  className={`group h-full rounded-[1.75rem] border p-5 text-left shadow-sm transition-all ${
                    !hasEnoughCredits
                      ? "cursor-not-allowed border-border/50 bg-zinc-100/5 opacity-50"
                      : "border-border/70 bg-card hover:-translate-y-0.5 hover:border-google-blue/35 hover:bg-google-blue/5"
                  }`}
                  onClick={() => handleOpenTask(task)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${hasEnoughCredits ? "bg-google-blue/10 text-google-blue" : "bg-muted text-zinc-500"}`}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold leading-snug text-foreground">{task.title}</h3>
                        {task.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.description}</p>
                        ) : null}
                      </div>
                    </div>

                    <ArrowRight className={`mt-1 h-4 w-4 shrink-0 transition-transform ${hasEnoughCredits ? "text-muted-foreground group-hover:translate-x-1 group-hover:text-google-blue" : "text-zinc-500"}`} />
                  </div>
                </button>
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
