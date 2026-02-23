import { useMutation, useQuery } from "@tanstack/react-query";
import { competition } from "@/services/competition";
import type { CompetitionFindIn, CompetitionStartIn } from "@/types/competition";
import { toastApiError, toastSuccess } from "@/lib/toast";

const qk = {
  find: (key: string) => ["competition", "find", key] as const,
  job: (id: string) => ["competition", "job", id] as const,
  report: (id: string) => ["competition", "report", id] as const,
};

export function useCompetitionFind() {
  return useMutation({
    mutationFn: (body: CompetitionFindIn) => competition.findCompetitors(body),
    onError: (e) => toastApiError(e, "Falha ao procurar concorrentes"),
  });
}

export function useCompetitionAnalyze() {
  return useMutation({
    mutationFn: (body: CompetitionStartIn) => competition.analyze(body),
    onError: (e) => toastApiError(e, "Falha ao iniciar análise"),
    onSuccess: () => toastSuccess("Análise iniciada."),
  });
}

export function useCompetitionJob(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: jobId ? qk.job(jobId) : ["competition", "job", "none"],
    queryFn: () => competition.job(jobId!),
    enabled: enabled && !!jobId,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 1500;
      if (data.status === "done" || data.status === "error" || data.status === "partial_data") return false;
      return 1500;
    },
  });
}

export function useCompetitionReport(reportId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: reportId ? qk.report(reportId) : ["competition", "report", "none"],
    queryFn: () => competition.report(reportId!),
    enabled: enabled && !!reportId,
    staleTime: 1000 * 60 * 5,
  });
}
