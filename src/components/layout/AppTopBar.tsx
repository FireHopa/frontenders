import { Link } from "react-router-dom";
import { APP_NAME } from "@/constants/app";
import logoUrl from "@/casadoads.png";
import { Badge } from "@/components/ui/badge";

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Voltar para a tela inicial"
        >
          <img src={logoUrl} alt="Logo Autoridade ORI" className="h-8 w-auto max-w-[140px] object-contain" />
          <div className="font-semibold tracking-tight">{APP_NAME}</div>
          <Badge variant="secondary" className="ml-2">
            alpha
          </Badge>
        </Link>

        <div className="hidden text-sm text-muted-foreground sm:block">Premium UX • progresso real</div>
      </div>
    </header>
  );
}
