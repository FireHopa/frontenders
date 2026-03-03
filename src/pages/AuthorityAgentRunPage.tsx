import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Loader2, Copy, FileText, CheckCircle2, Coins, Linkedin, Pencil, Save, X } from "lucide-react";
import { api, getClientId } from "@/services/robots";
import { linkedinService } from "@/services/linkedin";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";
import { tasksByAgentKey } from "@/constants/authorityTasks";
import ResultViewer from "@/components/authority/ResultViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toastSuccess, toastApiError } from "@/lib/toast";
import { useAuthStore } from "@/state/authStore";
import { PublishModal } from "@/components/linkedin/PublishModal";

const STORAGE_KEY = "ori_authority_nucleus_v1";

export default function AuthorityAgentRunPage() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { user, deductCredits } = useAuthStore();
  const agent = AUTHORITY_AGENTS.find((a) => a.key === agentKey);
  const tasks = agentKey ? tasksByAgentKey(agentKey) : [];

  async function executeTask(taskTitle?: string) {
    if (!agentKey) return;
    if (!user || user.credits < 5) {
      toastApiError(new Error("Precisas de pelo menos 5 créditos para executar esta ação."), "Créditos Insuficientes");
      return;
    }

    setLoading(true);
    setResult(null);
    setIsEditing(false); // Resetar edição ao fazer nova busca

    try {
      const rawNucleus = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const payload = {
        client_id: getClientId(),
        agent_key: agentKey,
        nucleus: {
          ...rawNucleus,
          ...(taskTitle ? { requested_task: taskTitle } : {})
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

  function downloadFile(ext: "md" | "txt") {
    const txt = String(result?.output_text ?? "");
    if (!txt) return;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentKey}-resultado.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  // Funções de Edição
  function handleEdit() {
    setEditedText(result?.output_text || "");
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

  if (!agent) return <div className="p-8">Agente não encontrado.</div>;
  const hasEnoughCredits = user && user.credits >= 5;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8 relative">
      
      <PublishModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialText={result?.output_text || ""}
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
                    ${!hasEnoughCredits ? 'opacity-50 cursor-not-allowed bg-zinc-100/5' : 'bg-card hover:bg-google-blue/5'}
                  `}
                  onClick={() => executeTask(task.title)}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-3 animate-spin shrink-0" /> : <Play className={`h-4 w-4 mr-3 shrink-0 ${hasEnoughCredits ? 'text-google-blue opacity-70' : 'text-zinc-500'}`} />}
                  {task.title}
                </Button>
              ))
            ) : (
              <div className="sm:col-span-2">
                <Button variant="accent" disabled={loading || !hasEnoughCredits} className="w-full h-auto py-4 rounded-2xl" onClick={() => executeTask()}>
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

      {loading && !result && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 text-google-blue animate-spin" />
          <p className="text-muted-foreground font-medium">A IA está a processar o núcleo e a gerar o resultado...</p>
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
              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={() => { navigator.clipboard.writeText(result.output_text); toastSuccess("Copiado!"); }}>
                <Copy className="h-4 w-4 mr-2" /> Copiar 
              </Button>
              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={() => downloadFile("md")}>
                <FileText className="h-4 w-4 mr-2" /> Baixar
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
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
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