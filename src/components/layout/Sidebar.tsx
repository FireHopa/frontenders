import * as React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot,
  Swords,
  FolderKanban,
  BookOpen,
  Video,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants/app";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";
import logoUrl from "@/casadoads.png";
import { transitions } from "@/lib/motion";

type Item = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { to: "/dashboard", label: "Meus Agentes", Icon: Bot },
  { to: "/authority-agents", label: "Agentes de Autoridade", Icon: Sparkles },
  { to: "/competition", label: "Análise da Concorrência", Icon: Swords },
  { to: "/projects", label: "Projetos", Icon: FolderKanban },
  { to: "/materials", label: "Materiais de Apoio", Icon: BookOpen },
  { to: "/video", label: "Video Aula", Icon: Video },
];

const KEY = "arp:sidebar:collapsed:v1";

function loadCollapsed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function saveCollapsed(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    // ignore
  }
}

export function Sidebar({
  onWidthChange,
}: {
  onWidthChange?: (w: number) => void;
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState<boolean>(() => (typeof window === "undefined" ? false : loadCollapsed()));
  React.useEffect(() => {
    saveCollapsed(collapsed);
    onWidthChange?.(collapsed ? 84 : 268);
  }, [collapsed, onWidthChange]);

  const width = collapsed ? 84 : 268;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-dvh border-r bg-background/55 backdrop-blur",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.02)]"
      )}
      style={{ width }}
    >
      <div className="flex h-full flex-col p-3">
        <Link
          to="/"
          className={cn(
            "group flex items-center gap-3 rounded-2xl px-3 py-3 transition",
            "hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          aria-label="Voltar para a tela inicial"
        >
          <img src={logoUrl} alt="Logo Autoridade ORI" className={cn("h-10 w-auto max-w-[160px] object-contain", collapsed ? "max-w-[44px]" : "")} />
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</div>
              <div className="truncate text-xs text-muted-foreground">painel premium</div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setCollapsed((v) => !v);
            }}
            className={cn(
              "ml-auto grid h-9 w-9 place-items-center rounded-xl border bg-background/40 shadow-soft transition",
              "hover:bg-foreground/5"
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </Link>

        <div className="mt-4 space-y-1">
          {items.map((it) => (
            <React.Fragment key={it.to}>
            <NavLink
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                  "hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive ? "bg-foreground/5 ring-1 ring-border/70" : "ring-1 ring-transparent"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    initial={false}
                    animate={{ scale: isActive ? 1.02 : 1 }}
                    transition={transitions.base}
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-2xl border shadow-soft",
                      isActive ? "bg-background/60" : "bg-background/40"
                    )}
                  >
                    <it.Icon className={cn("h-5 w-5", isActive ? "text-foreground" : "text-muted-foreground")} />
                  </motion.div>

                  {!collapsed ? (
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{it.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {it.label === "Meus Agentes" ? "crie e converse" : "em breve"}
                      </div>
                    </div>
                  ) : null}

                  {!collapsed && isActive ? (
                    <span className="h-2 w-2 rounded-full bg-google-blue/70" aria-hidden />
                  ) : null}
                </>
              )}
            
            </NavLink>

            {!collapsed && it.to === "/authority-agents" && location.pathname.startsWith("/authority-agents") ? (
              <div className="mt-1 space-y-1 pl-[54px]">
                <div className="flex items-center justify-between rounded-xl px-2 py-2 text-xs">
                  <span className="text-muted-foreground">Robôs</span>
                </div>

                <div className="space-y-1">
                  {AUTHORITY_AGENTS.map((a) => (
                    <NavLink
                      key={a.key}
                      to={`/authority-agents/chat/${encodeURIComponent(a.key)}`}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2 rounded-xl px-2 py-2 text-xs transition",
                          "hover:bg-foreground/5",
                          isActive ? "bg-foreground/5 ring-1 ring-border/70" : "ring-1 ring-transparent"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-xl border bg-background/40 shadow-soft",
                              isActive ? "ring-1 ring-border/70" : ""
                            )}
                          >
                            <a.Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{a.name}</div>
                            <div className="truncate text-[10px] text-muted-foreground">executar</div>
                          </div>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null}

            </React.Fragment>

          ))}
        </div>

        <div className="mt-auto rounded-2xl border bg-background/40 p-4 shadow-soft">
          {!collapsed ? (
            <>
              <div className="text-xs font-semibold">Dica</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Use “Meus Agentes” para criar, editar e conversar com seus robôs.
              </div>
            </>
          ) : (
            <div className="grid place-items-center text-xs text-muted-foreground">•</div>
          )}
        </div>
      </div>
    </aside>
  );
}