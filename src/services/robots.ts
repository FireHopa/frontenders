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

export type AuthorityAgentRunItem = {
  id: number;
  agent_key: string;
  output_text: string;
  created_at: string;
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

    businessCore: {
      get: (publicId: string) => http<BusinessCoreOut>(`/api/robots/${publicId}/business-core`),
      patch: (publicId: string, patch: BusinessCoreIn) =>
        http<BusinessCoreOut>(`/api/robots/${publicId}/business-core`, { method: "PATCH", json: patch }),
    },

    authorityAgents: {
      cooldown: (publicId: string, agentKey: string) =>
        http<{ cooldown_seconds: number }>(
          `/api/robots/${publicId}/authority-agents/cooldown?agent_key=${encodeURIComponent(agentKey)}`
        ),
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

  authorityAgents: {
    historyGlobal: (clientId: string) =>
      http(`/api/authority-agents/history?client_id=${encodeURIComponent(clientId)}`),
    runGlobal: (payload: any) =>
      http<AuthorityAgentRunItem>(`/api/authority-agents/run`, { method: "POST", json: payload }),

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

export async function uploadRobotKnowledgeFile(publicId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
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

// NOVAS FUNÇÕES PARA DELETAR
export async function deleteRobotKnowledgeFile(publicId: string, filename: string) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const response = await fetch(`${baseUrl}/api/robots/${publicId}/knowledge-files/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Erro ao excluir o arquivo do robô.");
  }
  return response.json();
}

export async function deleteBusinessCoreKnowledgeFile(publicId: string, filename: string) {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const response = await fetch(`${baseUrl}/api/robots/${publicId}/business-core/files/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Erro ao excluir o arquivo do núcleo.");
  }
  return response.json();
}