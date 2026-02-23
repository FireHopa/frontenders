import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Particles } from "@/components/effects/Particles";
import { NucleusMindmapForm, type Nucleus } from "@/components/authority/NucleusMindmapForm";
import { api, getClientId } from "@/services/robots";
import type { AuthorityAgentRunItem } from "@/services/robots";
import { Markdown } from "@/components/markdown/Markdown";
import { authorityAgentByKey } from "@/constants/authorityAgents";
import { Copy, Loader2, Save, Sparkles } from "lucide-react";

const STORAGE_KEY = "ori_authority_nucleus_v1";

function loadStoredNucleus(): Nucleus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredNucleus(n: Nucleus) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
  } catch {
    // ignore
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

export default function AuthorityAgentsPage() {
  const clientId = React.useMemo(() => getClientId(), []);

  const [nucleus, setNucleus] = React.useState<Nucleus>(() =>
    typeof window === "undefined" ? {} : loadStoredNucleus()
  );

  const [history, setHistory] = React.useState<AuthorityAgentRunItem[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [selectedRun, setSelectedRun] = React.useState<AuthorityAgentRunItem | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  async function refreshHistory() {
    setLoadingHistory(true);
    setErr(null);
    try {
      const out = await api.authorityAgents.historyGlobal(clientId);
      setHistory(out.items ?? []);
      if (selectedRun) {
        const still = out.items?.find((x) => x.id === selectedRun.id) ?? null;
        setSelectedRun(still);
      }
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar histórico.");
    } finally {
      setLoadingHistory(false);
    }
  }

  React.useEffect(() => {
    refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const filled = React.useMemo(() => {
    const keys = Object.keys(nucleus ?? {});
    if (!keys.length) return 0;
    let good = 0;
    for (const k of keys) {
      const v = String((nucleus as any)[k] ?? "").trim();
      if (v && v !== "não informado") good++;
    }
    return Math.min(1, good / 10);
  }, [nucleus]);

  const resultText = selectedRun?.output_text ?? "";
  const agent = authorityAgentByKey(selectedRun?.agent_key);

  async function saveNucleusNow() {
    setSaving(true);
    try {
      saveStoredNucleus(nucleus ?? {});
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-1px)]">
      <Particles className="pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-background/40 shadow-soft">
            <Sparkles className="h-5 w-5 text-google-blue" />
          </div>

          <div className="min-w-0">
            <div className="text-xl font-semibold tracking-tight">Agentes de Autoridade</div>
            <div className="text-sm text-muted-foreground">
              Preencha o núcleo uma vez. Ele é usado por todos os agentes pré-programados.
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={refreshHistory} disabled={loadingHistory} className="h-9">
              {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar histórico"}
            </Button>
          </div>
        </div>

        {/* Núcleo ocupa o retângulo inteiro */}
        <Card className="overflow-hidden shadow-card">
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Núcleo da Empresa</CardTitle>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">{Math.round(filled * 100)}%</Badge>

                <Button
                  onClick={saveNucleusNow}
                  disabled={saving}
                  className="h-9"
                  variant="secondary"
                  title="Salvar núcleo no dispositivo"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savedAt ? "Salvo" : "Salvar núcleo"}
                </Button>
              </div>
            </div>

            {savedAt ? (
              <div className="text-xs text-muted-foreground">
                Último salvamento: {new Date(savedAt).toLocaleString()}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Clique em “Salvar núcleo” quando terminar de preencher.</div>
            )}
          </CardHeader>

          <CardContent className="p-4">
            <NucleusMindmapForm
              value={nucleus}
              onChange={setNucleus}
              progress={filled}
              coreState={filled > 0.35 ? "ready" : "idle"}
              className="min-h-[640px]"
            />
          </CardContent>
        </Card>

        {/* Histórico e Resultado vão para baixo (ganha largura pro mapa) */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Histórico</CardTitle>
              <div className="text-xs text-muted-foreground">Clique em uma execução para ver o resultado.</div>
            </CardHeader>
            <CardContent className="space-y-2">
              {err ? <div className="text-sm text-destructive">{err}</div> : null}

              {loadingHistory ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> carregando...
                </div>
              ) : null}

              {!loadingHistory && history.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sem execuções ainda.</div>
              ) : null}

              <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                {history.map((h) => {
                  const a = authorityAgentByKey(h.agent_key);
                  const active = selectedRun?.id === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setSelectedRun(h)}
                      className={[
                        "w-full rounded-2xl border px-3 py-2 text-left shadow-soft transition",
                        "hover:bg-foreground/5",
                        active ? "bg-foreground/5 ring-1 ring-border/70" : "bg-background/40",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-medium">{a?.name ?? h.agent_key}</div>
                        <div className="text-[11px] text-muted-foreground">#{h.id}</div>
                      </div>
                      <div className="mt-1 truncate text-[11px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Resultado</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {agent ? agent.label : "Selecione uma execução no histórico."}
                  </div>
                </div>

                {resultText ? (
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(resultText)} className="h-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </CardHeader>

            <CardContent>
              {!resultText ? <div className="text-sm text-muted-foreground">Sem resultado selecionado.</div> : <Markdown content={resultText} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
