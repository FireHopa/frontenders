import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { BriefingIn } from "@/types/api";
import { cn } from "@/lib/utils";

function pickTone(v: BriefingIn): "blue" | "red" | "yellow" | "green" {
  const s = `${v.niche} ${v.audience} ${v.offer} ${v.goals}`.toLowerCase();
  if (/(m[eé]d|sa[uú]de|cl[ií]nica|hospital)/.test(s)) return "green";
  if (/(vendas|lan[cç]amento|oferta|copy|marketing)/.test(s)) return "red";
  if (/(finance|jur[ií]d|advoc)/.test(s)) return "blue";
  return "yellow";
}

function initials(name: string) {
  return (name || "AR")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export function RobotPreviewPanel({
  values,
  stepIndex,
}: {
  values: BriefingIn;
  stepIndex: number;
}) {
  const tone = pickTone(values);

  const keywords = [
    values.niche,
    values.audience,
    values.offer,
    values.region,
    values.goals,
  ]
    .filter(Boolean)
    .join(" • ");

  const sample = [
    `Vou responder com clareza e foco em ${values.niche || "seu nicho"}.`,
    `Vou adaptar exemplos para ${values.region || "sua região"}.`,
    `Tom: ${values.tone || "profissional e direto"}.`,
  ];

  return (
    <Card variant="glass" className="sticky top-[88px]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 1, 0], scale: [1, 1.02, 1] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          >
            <Avatar tone={tone} className="h-11 w-11">
              <AvatarFallback tone={tone}>{initials(values.company_name)}</AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="min-w-0">
            <CardTitle className="truncate text-base">{values.company_name || "Seu robô"}</CardTitle>
            <CardDescription className="truncate">
              {values.niche ? values.niche : "em construção"} • passo {stepIndex + 1}/8
            </CardDescription>
          </div>

          <div className="ml-auto flex gap-2">
            <Badge variant="secondary">AIO</Badge>
            <Badge variant="secondary">AEO</Badge>
            <Badge variant="secondary">GEO</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-background/40 p-4 text-sm shadow-soft">
          <div className="text-xs text-muted-foreground">Prévia</div>
          <div className="mt-2 space-y-2">
            {sample.map((t) => (
              <div key={t} className="leading-relaxed">
                {t}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-muted-foreground">Sinais capturados</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {keywords
              ? keywords.split(" • ").slice(0, 8).map((k, i) => (
                  <span
                    key={k + i}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs",
                      "bg-background/50 text-foreground/80"
                    )}
                  >
                    {k}
                  </span>
                ))
              : (
                <span className="text-xs text-muted-foreground">Responda as perguntas para gerar palavras‑chave.</span>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
