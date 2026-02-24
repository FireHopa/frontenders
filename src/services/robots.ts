import { http } from "@/services/http";
import type {
  HealthResponse,
  RobotOut,
  RobotDetail,
  BriefingIn,
  RobotUpdateIn,
  ChatIn,
  ChatMessageOut,
  MessageUpdateIn,
  AuthorityAssistantIn,
  AuthorityAssistantOut,
  AuthorityEditOut,
  BusinessCoreIn,
  BusinessCoreOut,
  AuthorityAgentRunRequest,
  AuthorityAgentRunResponse,
} from "@/types/api";

// Tipos do backend para agentes pré-programados (history/run)
// O backend atual expõe:
// - GET  /api/authority-agents/history  -> { items: [...] }
// - POST /api/authority-agents/run      -> { id, agent_key, output_text, created_at }
export type AuthorityAgentRunItem = {
  id: number;
  agent_key: string;
  output_text: string;
  created_at: string;
};

export type AuthorityAgentHistoryOut = {
  items: AuthorityAgentRunItem[];
};

export type AuthorityAgentRunGlobalIn = {
  client_id: string;
  agent_key: string;
  nucleus: Record<string, any>;
};

export const api = {
  health: () => http<HealthResponse>("/api/health"),

  robots: {
    list: () => http<RobotOut[]>("/api/robots"),
    create: (brief: BriefingIn) => http<RobotOut>("/api/robots", { method: "POST", json: brief }),
    get: (publicId: string) => http<RobotDetail>(`/api/robots/${publicId}`),
    update: (publicId: string, patch: RobotUpdateIn) =>
      http<RobotDetail>(`/api/robots/${publicId}`, { method: "PATCH", json: patch }),
    remove: (publicId: string) => http<{ ok: true }>(`/api/robots/${publicId}`, { method: "DELETE" }),

    messages: {
      list: (publicId: string) => http<ChatMessageOut[]>(`/api/robots/${publicId}/messages`),
      clear: (publicId: string) => http<{ ok: true }>(`/api/robots/${publicId}/messages`, { method: "DELETE" }),
      update: (publicId: string, messageId: number, body: MessageUpdateIn) =>
        http<ChatMessageOut>(`/api/robots/${publicId}/messages/${messageId}`, { method: "PATCH", json: body }),
    },

    chat: (publicId: string, body: ChatIn) =>
      http<ChatMessageOut>(`/api/robots/${publicId}/chat`, { method: "POST", json: body }),

    authorityAssistant: (publicId: string, body: AuthorityAssistantIn) =>
      http<AuthorityAssistantOut>(`/api/robots/${publicId}/authority-assistant`, { method: "POST", json: body }),

    authorityEdits: (publicId: string) =>
      http<AuthorityEditOut[]>(`/api/robots/${publicId}/authority-edits`),

    // Núcleo do negócio (usado na página AuthorityAgentsRobotPage)
    // Observação: se o backend não tiver esse endpoint no seu build, ele retorna 404.
    businessCore: {
      get: (publicId: string) => http<BusinessCoreOut>(`/api/robots/${publicId}/business-core`),
      patch: (publicId: string, patch: BusinessCoreIn) =>
        http<BusinessCoreOut>(`/api/robots/${publicId}/business-core`, { method: "PATCH", json: patch }),
    },

    // Agentes de autoridade ligados a um robô (página AuthorityAgentsRobotPage)
// Na seção 'authorityAgents' dentro de 'api.robots', altere o método 'run':
    authorityAgents: {
      cooldown: (publicId: string, agentKey: string) =>
        http<{ cooldown_seconds: number }>(
          `/api/robots/${publicId}/authority-agents/cooldown?agent_key=${encodeURIComponent(agentKey)}`
        ),
      // Removido o agentKey da URL, pois o backend espera receber via Body (AuthorityAgentRunIn)
      run: (publicId: string, body: AuthorityAgentRunRequest) =>
        http<AuthorityAgentRunItem>(`/api/robots/${publicId}/authority-agents/run`, {
          method: "POST",
          json: body,
        }),
    },

    audio: async (publicId: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      return http<ChatMessageOut>(`/api/robots/${publicId}/audio`, { method: "POST", body: form });
    },
  },

  // Agentes pré-programados (NÃO dependem de robô)
  authorityAgents: {
    historyGlobal: (clientId: string) =>
      http<AuthorityAgentHistoryOut>(`/api/authority-agents/history?client_id=${encodeURIComponent(clientId)}`),
    runGlobal: (payload: AuthorityAgentRunGlobalIn) =>
      http<AuthorityAgentRunItem>(`/api/authority-agents/run`, { method: "POST", json: payload }),

    // Busca uma execução específica (quando você clica no histórico)
    runById: (clientId: string, runId: number) =>
      http<AuthorityAgentRunItem>(
        `/api/authority-agents/run/${encodeURIComponent(String(runId))}?client_id=${encodeURIComponent(clientId)}`
      ),
  },
} as const;

export function getClientId(): string {
  const key = "ori_authority_client_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem(key, v);
  }
  return v;
}

// Adicione em src/services/robots.ts

export async function uploadRobotKnowledgeFile(publicId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  // Ajuste a base URL conforme o seu setup (ex: import.meta.env.VITE_API_URL ou client http)
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  const response = await fetch(`${baseUrl}/api/robots/${publicId}/upload-knowledge`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Erro ao fazer upload do arquivo para o robô.");
  }
  return response.json();
}

export async function uploadBusinessCoreKnowledgeFile(publicId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const response = await fetch(`${baseUrl}/api/robots/${publicId}/business-core/upload-knowledge`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Erro ao fazer upload do arquivo para o núcleo.");
  }
  return response.json();
}
