import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Loader2, Copy, FileText, CheckCircle2, Coins, Linkedin, Pencil, Save, X, Sparkles, ArrowRight, Printer, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api, getClientId } from "@/services/robots";
import { linkedinService } from "@/services/linkedin";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";
import { tasksByAgentKey } from "@/constants/authorityTasks";
import ResultViewer from "@/components/authority/ResultViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toastSuccess, toastApiError } from "@/lib/toast";
import { useAuthStore } from "@/state/authStore";
import { PublishModal } from "@/components/linkedin/PublishModal";

const STORAGE_KEY = "ori_authority_nucleus_v1";

// ============================================================================
// MOTOR DE EXPORTAÇÃO INTELIGENTE (HTML, WhatsApp, TXT, MD)
// ============================================================================
export function exportFormat(raw: string, format: "md" | "whatsapp" | "txt" | "html"): string {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.blocos)) throw new Error("Not JSON");

    let out = "";

    // 1. EXPORTAÇÃO RICA (Para PDF e Word)
    if (format === "html") {
      out += `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">`;
      if (data.titulo_da_tela) {
        out += `<h1 style="color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px;">${data.titulo_da_tela}</h1>`;
      }
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          let html = b.conteudo.texto
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
        } else if (b.tipo === "timeline") {
          if (b.conteudo.passos) {
            out += `<ul style="list-style-type: none; padding-left: 0; margin: 20px 0;">`;
            b.conteudo.passos.forEach((p: string) => {
              let html = p.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
              out += `<li style="margin-bottom: 10px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; top: 0; color: #00c8e8;">•</span>${html}</li>`;
            });
            out += `</ul>`;
          }
        } else if (b.tipo === "quote") {
          out += `<blockquote style="font-style: italic; border-left: 4px solid #ccc; padding: 10px 20px; margin: 20px 0; color: #555; background: #f9f9f9;">`;
          out += `"${b.conteudo.texto}"`;
          if (b.conteudo.autor) out += `<br><strong style="display: block; margin-top: 10px; font-style: normal; color: #333;">— ${b.conteudo.autor}</strong>`;
          out += `</blockquote>`;
        } else if (b.tipo === "faq") {
          if (b.conteudo.perguntas) {
            out += `<div style="margin: 20px 0;">`;
            b.conteudo.perguntas.forEach((q: any) => {
              let htmlResp = q.resposta.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
              out += `<div style="margin-bottom: 15px;">`;
              out += `<strong style="display: block; font-size: 15px; margin-bottom: 5px; color: #222;">❓ ${q.pergunta}</strong>`;
              out += `<p style="margin: 0; padding-left: 24px; color: #444;">${htmlResp}</p>`;
              out += `</div>`;
            });
            out += `</div>`;
          }
        }
      });
      out += `</div>`;
      return out;
    }

    // 2. EXPORTAÇÃO WHATSAPP (Usa asteriscos para negrito e limpa as hastags)
    if (format === "whatsapp") {
      if (data.titulo_da_tela) out += `*${data.titulo_da_tela.toUpperCase()}*\n\n`;
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          let text = b.conteudo.texto
            .replace(/^### (.*$)/gim, '*$1*')
            .replace(/^## (.*$)/gim, '*$1*')
            .replace(/^# (.*$)/gim, '*$1*')
            .replace(/\*\*/g, '*');
          out += `${text}\n\n`;
        } else if (b.tipo === "highlight") {
          out += `💡 *${(b.conteudo.titulo || 'Atenção').toUpperCase()}*\n_${b.conteudo.texto}_\n\n`;
        } else if (b.tipo === "timeline") {
          if (b.conteudo.passos) {
            b.conteudo.passos.forEach((p: string) => {
              let text = p.replace(/\*\*/g, '*');
              out += `🔹 ${text}\n`;
            });
            out += "\n";
          }
        } else if (b.tipo === "quote") {
          out += `"${b.conteudo.texto}"\n`;
          if (b.conteudo.autor) out += `— _${b.conteudo.autor}_\n`;
          out += "\n";
        } else if (b.tipo === "faq") {
          if (b.conteudo.perguntas) {
            b.conteudo.perguntas.forEach((q: any) => {
              let text = q.resposta.replace(/\*\*/g, '*');
              out += `❓ *${q.pergunta}*\n${text}\n\n`;
            });
          }
        }
      });
      return out.trim();
    }

    // 3. EXPORTAÇÃO TXT PURO (Sem nenhum símbolo markdown, ideal para ler limpo ou postar no LinkedIn)
    if (format === "txt") {
      if (data.titulo_da_tela) out += `${data.titulo_da_tela.toUpperCase()}\n`;
      if (data.titulo_da_tela) out += `${"=".repeat(data.titulo_da_tela.length)}\n\n`;
      data.blocos.forEach((b: any) => {
        if (b.tipo === "markdown") {
          let text = b.conteudo.texto
            .replace(/^### (.*$)/gim, '$1')
            .replace(/^## (.*$)/gim, '$1')
            .replace(/^# (.*$)/gim, '$1')
            .replace(/\*\*/g, '');
          out += `${text}\n\n`;
        } else if (b.tipo === "highlight") {
          out += `>> DICA: ${b.conteudo.titulo ? b.conteudo.titulo.toUpperCase() : 'ATENÇÃO'}\n${b.conteudo.texto}\n\n`;
        } else if (b.tipo === "timeline") {
          if (b.conteudo.passos) {
            b.conteudo.passos.forEach((p: string) => {
              let text = p.replace(/\*\*/g, '');
              out += `- ${text}\n`;
            });
            out += "\n";
          }
        } else if (b.tipo === "quote") {
          out += `"${b.conteudo.texto}"\n`;
          if (b.conteudo.autor) out += `— ${b.conteudo.autor}\n`;
          out += "\n";
        } else if (b.tipo === "faq") {
          if (b.conteudo.perguntas) {
            b.conteudo.perguntas.forEach((q: any) => {
              let text = q.resposta.replace(/\*\*/g, '');
              out += `P: ${q.pergunta}\nR: ${text}\n\n`;
            });
          }
        }
      });
      return out.trim();
    }

    // 4. EXPORTAÇÃO MARKDOWN (Para a edição da textarea)
    if (data.titulo_da_tela) out += `# ${data.titulo_da_tela}\n\n`;
    data.blocos.forEach((b: any) => {
      if (b.tipo === "markdown") {
        out += `${b.conteudo.texto}\n\n`;
      } else if (b.tipo === "highlight") {
        out += `💡 **${b.conteudo.titulo || 'Atenção'}**\n${b.conteudo.texto}\n\n`;
      } else if (b.tipo === "timeline") {
        if (b.conteudo.passos) {
          b.conteudo.passos.forEach((p: string) => out += `• ${p}\n`);
          out += "\n";
        }
      } else if (b.tipo === "quote") {
        out += `> "${b.conteudo.texto}"\n`;
        if (b.conteudo.autor) out += `> — ${b.conteudo.autor}\n`;
        out += "\n";
      } else if (b.tipo === "faq") {
        if (b.conteudo.perguntas) {
          b.conteudo.perguntas.forEach((q: any) => {
            out += `**P: ${q.pergunta}**\nR: ${q.resposta}\n\n`;
          });
        }
      }
    });
    return out.trim();

  } catch (e) {
    // Fallbacks caso não seja JSON
    if (format === "html") return `<pre style="white-space: pre-wrap; font-family: sans-serif;">${raw}</pre>`;
    if (format === "txt") return raw.replace(/\*\*/g, '').replace(/^#+ /gm, '');
    if (format === "whatsapp") return raw.replace(/\*\*/g, '*').replace(/^#+ /gm, '*');
    return raw;
  }
}

export default function AuthorityAgentRunPage() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [themeModalTask, setThemeModalTask] = useState<string | null>(null);
  const [suggestedThemes, setSuggestedThemes] = useState<string[]>([]);
  const [isFetchingThemes, setIsFetchingThemes] = useState(false);
  const [customTheme, setCustomTheme] = useState("");
  
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const { user, deductCredits } = useAuthStore();
  const agent = AUTHORITY_AGENTS.find((a) => a.key === agentKey);
  const tasks = agentKey ? tasksByAgentKey(agentKey) : [];

  async function handleOpenTask(taskTitle?: string) {
    if (!agentKey) return;
    if (!user || user.credits < 5) {
      toastApiError(new Error("Precisas de pelo menos 5 créditos para executar esta ação."), "Créditos Insuficientes");
      return;
    }

    const taskName = taskTitle || "Estratégia Completa Padrão";
    setThemeModalTask(taskName);
    setSuggestedThemes([]);
    setCustomTheme("");
    setIsFetchingThemes(true);

    try {
      const rawNucleus = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const res = await api.authorityAgents.suggestThemes({
        agent_key: agentKey,
        task: taskName,
        nucleus: rawNucleus
      });
      setSuggestedThemes(res.themes || []);
    } catch (e: any) {
      toastApiError(e, "Falha ao buscar sugestões de temas. Tente escrever o seu próprio.");
      setSuggestedThemes([
        "Os 5 principais mitos do nosso serviço",
        "Como funciona o nosso processo passo a passo",
        "Respondendo as dúvidas mais comuns dos nossos clientes"
      ]);
    } finally {
      setIsFetchingThemes(false);
    }
  }

  async function executeTask(finalTheme: string) {
    if (!agentKey) return;
    
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
          ...(themeModalTask && themeModalTask !== "Estratégia Completa Padrão" ? { requested_task: themeModalTask } : {}),
          selected_theme: finalTheme
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
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Resultado - ${agent.name}</title>
          <meta charset="utf-8">
      </head>
      <body>
          ${htmlContent}
          <script>
              window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); }
              }
          </script>
      </body>
      </html>
    `);
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

    const blob = new Blob([format === "doc" ? '\ufeff' + fileContent : fileContent], { type: mimeType });
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
      setIsModalOpen(true);
    } else {
      try {
        toastSuccess("Redirecionando para o LinkedIn...");
        const data = await linkedinService.getAuthUrl();
        window.location.href = data.url;
      } catch (err) {
        toastApiError(err, "Erro ao iniciar conexão com LinkedIn");
      }
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
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  if (!agent) return <div className="p-8">Agente não encontrado.</div>;
  const hasEnoughCredits = user && user.credits >= 5;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8 relative">
      
      <PublishModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialText={exportFormat(result?.output_text || "", "txt")}
        onPublish={handlePublishPost}
        loading={isPublishing}
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
                  key={idx} variant="outline" disabled={loading || !hasEnoughCredits}
                  className={`h-auto py-4 px-5 justify-start text-left font-normal whitespace-normal leading-snug rounded-2xl shadow-sm transition-all
                    ${!hasEnoughCredits ? 'opacity-50 cursor-not-allowed bg-zinc-100/5' : 'bg-card hover:bg-google-blue/5 hover:border-google-blue/40'}
                  `}
                  onClick={() => handleOpenTask(task.title)}
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
          {!hasEnoughCredits && (
             <p className="text-sm text-red-500 text-center mt-4 bg-red-500/10 py-3 rounded-xl">Não tens créditos suficientes para executar os agentes hoje.</p>
          )}
        </div>
      )}

      {/* MODAL DE TEMAS */}
      <AnimatePresence>
        {themeModalTask && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl bg-card border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              
              <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Sparkles className="h-5 w-5 text-google-blue" /> Escolha o Foco do Conteúdo
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Ação: {themeModalTask}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={() => setThemeModalTask(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] bg-background/30 custom-scrollbar">
                {isFetchingThemes ? (
                   <div className="py-12 flex flex-col items-center justify-center gap-4">
                     <Loader2 className="h-10 w-10 text-google-blue animate-spin" />
                     <p className="text-sm font-medium text-muted-foreground animate-pulse">A IA está a analisar o núcleo e a pensar em temas virais...</p>
                   </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground px-1 uppercase tracking-wider text-muted-foreground">Sugestões Estratégicas</label>
                      <div className="grid gap-2">
                        {suggestedThemes.map((theme, idx) => (
                          <Button key={idx} variant="outline" className="h-auto py-3.5 px-4 justify-start text-left font-medium whitespace-normal bg-card hover:bg-[rgba(0,200,232,0.05)] hover:border-google-blue/30 hover:text-google-blue transition-all rounded-xl shadow-sm" onClick={() => executeTask(theme)}>
                            <ArrowRight className="h-4 w-4 mr-3 shrink-0 opacity-50" />
                            {theme}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-6 border-t border-border/50">
                      <label className="text-sm font-semibold text-foreground px-1 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        Ou escreva o seu próprio tema
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          value={customTheme} 
                          onChange={e => setCustomTheme(e.target.value)} 
                          placeholder="Ex: Por que a nossa solução é melhor que a do concorrente X..." 
                          className="rounded-xl shadow-sm h-11"
                          onKeyDown={e => e.key === 'Enter' && customTheme.trim() && executeTask(customTheme)}
                        />
                        <Button disabled={!customTheme.trim() || loading} variant="accent" className="rounded-xl shrink-0 h-11 px-6 shadow-sm" onClick={() => executeTask(customTheme)}>
                          Gerar
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-card shadow-sm rounded-xl" 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                >
                  <FileText className="h-4 w-4 mr-2" /> 
                  Baixar <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                </Button>
                
                <AnimatePresence>
                  {showDownloadMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-2 w-40 bg-popover border border-border rounded-xl shadow-lg z-50 flex flex-col p-1.5 overflow-hidden"
                      >
                        <button onClick={() => downloadFile("pdf")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📄 PDF</button>
                        <button onClick={() => downloadFile("doc")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📝 Word (.doc)</button>
                        <button onClick={() => downloadFile("txt")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">📃 Texto (.txt)</button>
                        <button onClick={() => downloadFile("md")} className="text-left text-sm px-3 py-2 hover:bg-muted rounded-md transition-colors font-medium">🛠️ Markdown</button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>

              <Button 
                size="sm" 
                className="bg-[#25D366] text-white shadow-sm rounded-xl hover:bg-[#1EBE5D] border-none" 
                onClick={handleWhatsAppShare}
              >
                <svg className="h-4 w-4 mr-2 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </Button>
              
              {agentKey === "linkedin" && (
                <Button 
                  size="sm" 
                  className="bg-[#0A66C2] text-white shadow-sm rounded-xl hover:bg-[#004182]" 
                  onClick={handleLinkedInClick}
                >
                  <Linkedin className="h-4 w-4 mr-2" /> Publicar no LinkedIn
                </Button>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Textarea 
                value={editedText} 
                onChange={(e) => setEditedText(e.target.value)} 
                className="min-h-[400px] font-mono text-sm leading-relaxed p-6 rounded-2xl border border-border bg-card shadow-sm focus-visible:ring-google-blue resize-y"
              />
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
             <Button variant="secondary" className="rounded-xl px-8" onClick={() => setResult(null)}>
               Fazer Nova Tarefa
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}