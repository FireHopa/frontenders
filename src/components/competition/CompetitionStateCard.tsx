import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { transitions } from "@/lib/motion";
import { TypingDots } from "@/components/chat/TypingDots";
import { cn } from "@/lib/utils";

export function CompetitionStateCard({
  state,
  stage,
  progress,
  note,
}: {
  state: "empty" | "loading" | "analyzing" | "result" | "error" | "partial";
  stage?: string;
  progress?: number;
  note?: string;
}) {
  const label =
    state === "empty"
      ? "pronto"
      : state === "loading"
      ? "carregando"
      : state === "analyzing"
      ? "analisando"
      : state === "partial"
      ? "dados incompletos"
      : state === "error"
      ? "não foi possível concluir"
      : "análise pronta";

  const variant = state === "error" ? "red" : state === "partial" ? "yellow" : state === "result" ? "green" : "blue";
  state === "error" ? "red" : state === "result" ? "green" : "blue";

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Andamento</CardTitle>
            <CardDescription>A análise acontece em etapas. Você acompanha tudo aqui.</CardDescription>
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={state + (stage ?? "")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={transitions.base}
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background/40 p-4 shadow-soft">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{stage ?? (state === "empty" ? "Aguardando" : state === "partial" ? "Dados incompletos" : "Processando")}</div>
                <div className="text-xs text-muted-foreground">
                  {note ??
                    (state === "empty"
                      ? "Adicione concorrentes e inicie a análise."
                      : state === "loading"
                      ? "Carregando informações públicas."
                      : state === "analyzing"
                      ? "Analisando e comparando os concorrentes."
                      : state === "result"
                      ? "Análise pronta para você agir."
                      : "Não foi possível concluir. Tente novamente.")}
                </div>
              </div>

              {(state === "loading" || state === "analyzing") && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TypingDots />
                  <span>Processando</span>
                </div>
              )}
            </div>

            {(state === "loading" || state === "analyzing") && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(0,200,232,0.08)]">
                <div
                  className={cn("h-full rounded-full bg-google-blue/60 transition-all")}
                  style={{ width: `${Math.round(((progress ?? 0.15) * 100) || 15)}%` }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
