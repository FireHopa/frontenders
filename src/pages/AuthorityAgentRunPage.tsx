import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Loader2, Copy, FileText, CheckCircle2 } from "lucide-react";
import { api, getClientId } from "@/services/robots";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";
import { tasksByAgentKey } from "@/constants/authorityTasks";
import ResultViewer from "@/components/authority/ResultViewer";
import { Button } from "@/components/ui/button";
import { toastSuccess, toastApiError } from "@/lib/toast";

const STORAGE_KEY = "ori_authority_nucleus_v1";
const COOLDOWNS_KEY = "ori_authority_cooldowns_v1";

function saveCooldown(agentKey: string, seconds: number) {
  try {
    const stored = JSON.parse(localStorage.getItem(COOLDOWNS_KEY) || "{}");
    stored[agentKey] = Date.now() + seconds * 1000;
    localStorage.setItem(COOLDOWNS_KEY, JSON.stringify(stored));
  } catch {}
}

export default function AuthorityAgentRunPage() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const agent = AUTHORITY_AGENTS.find((a) => a.key === agentKey);
  const tasks = agentKey ? tasksByAgentKey(agentKey) : [];

  async function executeTask(taskTitle?: string) {
    if (!agentKey) return;
    setLoading(true);
    setResult(null);

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
      
      // Salva o cooldown no localStorage para a página principal enxergar
      const cooldown = (data as any).cooldown_seconds || 3600;
      saveCooldown(agentKey, cooldown);

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

  if (!agent) return <div className="p-8">Agente não encontrado.</div>;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
      {/* HEADER DO AGENTE */}
      <div className="flex items-center gap-4 bg-card border rounded-3xl p-6 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-[rgba(0,200,232,0.08)] text-google-blue flex items-center justify-center border border-google-blue/20">
          <agent.Icon className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
          <p className="text-muted-foreground mt-1">{agent.desc}</p>
        </div>
      </div>

      {/* TAREFAS (QUEBRA-GELOS) */}
      {!result && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold px-1">Escolha uma ação para executar:</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tasks.length > 0 ? (
              tasks.map((task: any, idx: number) => (
                <Button 
                  key={idx} 
                  variant="outline" 
                  disabled={loading}
                  className="h-auto py-4 px-5 justify-start text-left font-normal bg-card hover:border-google-blue/50 hover:bg-google-blue/5 whitespace-normal leading-snug rounded-2xl shadow-sm text-sm"
                  onClick={() => executeTask(task.title)}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-3 animate-spin shrink-0" /> : <Play className="h-4 w-4 text-google-blue mr-3 shrink-0 opacity-70" />}
                  {task.title}
                </Button>
              ))
            ) : (
              <div className="sm:col-span-2">
                <Button 
                  variant="accent" 
                  disabled={loading}
                  className="w-full h-auto py-4 rounded-2xl"
                  onClick={() => executeTask()}
                >
                  {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : "Gerar Estratégia Completa Padrão"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESTADO DE CARREGAMENTO */}
      {loading && !result && (
        <div className="py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 text-google-blue animate-spin" />
          <p className="text-muted-foreground font-medium">A IA está processando o núcleo e gerando o resultado...</p>
        </div>
      )}

      {/* RESULTADO GERADO */}
      {result && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-[rgba(0,210,120,0.15)] border border-[rgba(0,210,120,0.22)] p-4 rounded-2xl ">
            <div className="flex items-center gap-2 text-[#00D278] font-medium">
              <CheckCircle2 className="h-5 w-5" /> Resultado gerado com sucesso
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={() => { navigator.clipboard.writeText(result.output_text); toastSuccess("Copiado!"); }}>
                <Copy className="h-4 w-4 mr-2" /> Copiar Texto
              </Button>
              <Button size="sm" variant="outline" className="bg-card shadow-sm rounded-xl" onClick={() => downloadFile("md")}>
                <FileText className="h-4 w-4 mr-2" /> Baixar MD
              </Button>
            </div>
          </div>
          
          <ResultViewer title={agent.name} text={result.output_text} />

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