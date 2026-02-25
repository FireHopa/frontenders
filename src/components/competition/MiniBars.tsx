import { cn } from "@/lib/utils";
import type { DimensionKey } from "@/types/api";

const DIM_LABEL: Record<DimensionKey, string> = {
  presenca_digital: "Presença",
  clareza_oferta: "Oferta",
  comunicacao: "Comunicação",
  frequencia_conteudo: "Frequência",
  posicionamento: "Posicionamento",
  autoridade_percebida: "Autoridade",
};

export function MiniBars({
  label,
  values,
}: {
  label: string;
  values: Partial<Record<DimensionKey, number>>;
}) {
  const dims = Object.keys(DIM_LABEL) as DimensionKey[];
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{label}</div>
      <div className="grid gap-2">
        {dims.map((k) => {
          const v = Math.max(0, Math.min(100, values[k] ?? 0));
          return (
            <div key={k} className="grid grid-cols-[110px_1fr_44px] items-center gap-3">
              <div className="text-xs text-muted-foreground">{DIM_LABEL[k]}</div>
              <div className="h-2 overflow-hidden rounded-full bg-[rgba(0,200,232,0.08)]">
                <div
                  className={cn("h-full rounded-full bg-google-blue/60")}
                  style={{ width: `${v}%` }}
                />
              </div>
              <div className="text-right text-xs text-muted-foreground">{Math.round(v)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
