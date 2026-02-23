import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Play, Instagram, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

function clampList(list: string[], n: number) {
  return list.slice(0, n);
}

export function CompetitionForm({
  instagrams,
  sites,
  onChangeInstagrams,
  onChangeSites,
  onFind,
  onStart,
  canStart,
  busy,
}: {
  instagrams: string[];
  sites: string[];
  onChangeInstagrams: (v: string[]) => void;
  onChangeSites: (v: string[]) => void;
  onFind: () => void;
  onStart: () => void;
  canStart: boolean;
  busy?: boolean;
}) {
  const ig = clampList(instagrams, 3);
  const ws = clampList(sites, 3);

  const setIgAt = (idx: number, v: string) => {
    const next = [...ig];
    next[idx] = v;
    onChangeInstagrams(next);
  };

  const setWsAt = (idx: number, v: string) => {
    const next = [...ws];
    next[idx] = v;
    onChangeSites(next);
  };

  const addIg = () => onChangeInstagrams([...ig, ""]);
  const addWs = () => onChangeSites([...ws, ""]);

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">Concorrentes</CardTitle>
            <CardDescription>Adicione até 3 Instagrams e 3 sites. Você pode pedir sugestões para encontrar concorrentes parecidos com você.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onFind} disabled={busy} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Procurar concorrentes com IA
            </Button>
            <Button variant="accent" onClick={onStart} disabled={!canStart || busy} className="gap-2">
              <Play className="h-4 w-4" />
              Iniciar análise
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background/40 shadow-soft">
              <Instagram className="h-4 w-4 text-foreground/80" />
            </div>
            <div className="text-sm font-semibold">Instagram</div>
            <Badge variant="secondary" className="ml-auto">
              até 3
            </Badge>
          </div>

          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Input
                key={i}
                value={ig[i] ?? ""}
                onChange={(e) => setIgAt(i, e.target.value)}
                placeholder={i === 0 ? "@concorrente1" : i === 1 ? "@concorrente2" : "@concorrente3"}
                className={cn("bg-background/40")}
              />
            ))}
          </div>

          <Button variant="ghost" size="sm" className="gap-2" onClick={addIg} disabled={ig.length >= 3}>
            <Plus className="h-4 w-4" /> adicionar
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background/40 shadow-soft">
              <Globe className="h-4 w-4 text-foreground/80" />
            </div>
            <div className="text-sm font-semibold">Sites</div>
            <Badge variant="secondary" className="ml-auto">
              até 3
            </Badge>
          </div>

          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Input
                key={i}
                value={ws[i] ?? ""}
                onChange={(e) => setWsAt(i, e.target.value)}
                placeholder={i === 0 ? "https://site1.com" : i === 1 ? "https://site2.com" : "https://site3.com"}
                className={cn("bg-background/40")}
              />
            ))}
          </div>

          <Button variant="ghost" size="sm" className="gap-2" onClick={addWs} disabled={ws.length >= 3}>
            <Plus className="h-4 w-4" /> adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
