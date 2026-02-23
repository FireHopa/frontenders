import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/services/robots";
import type { AuthorityAgentRunRequest, AuthorityAgentRunResponse } from "@/types/api";

/**
 * Hooks para agentes de autoridade ligados a um robô (endpoints /api/robots/:publicId/authority-agents/*)
 * OBS: este arquivo estava desatualizado (referenciava history/historyItem e tipos inexistentes).
 */

export function useAuthorityAgentCooldown(publicId: string, agentKey: string) {
  return useQuery({
    queryKey: ["robots", publicId, "authorityAgents", "cooldown", agentKey],
    queryFn: () => api.robots.authorityAgents.cooldown(publicId, agentKey),
    enabled: Boolean(publicId) && Boolean(agentKey),
    staleTime: 10_000,
  });
}

export function useRunAuthorityAgent(publicId: string, agentKey: string) {
  return useMutation<AuthorityAgentRunResponse, unknown, AuthorityAgentRunRequest>({
    mutationFn: (body) => api.robots.authorityAgents.run(publicId, agentKey, body),
  });
}
