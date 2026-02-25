import * as React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Swords,
  FolderKanban,
  BookOpen,
  Video,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ChevronDown,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants/app";
import logoUrl from "@/casadoads.png";
import { transitions } from "@/lib/motion";
import { AUTHORITY_AGENTS } from "@/constants/authorityAgents";

type Item = {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  subItems?: { to: string; label: string; Icon: React.ComponentType<{ className?: string }> }[];
};

const items: Item[] = [
  { to: "/dashboard", label: "Meus Agentes", Icon: Bot },
  { 
    to: "/authority-agents", 
    label: "Agentes de Autoridade", 
    Icon: Sparkles,
    subItems: [
      { to: "/authority-agents/nucleus", label: "Núcleo da Empresa", Icon: Database },
      ...AUTHORITY_AGENTS.map((agent) => ({
        to: `/authority-agents/run/${agent.key}`,
        label: agent.name,
        Icon: agent.SidebarIcon 
      }))
    ]
  },
  { to: "/competition", label: "Análise da Concorrência", Icon: Swords },
  { to: "/projects", label: "Projetos", Icon: FolderKanban },
  { to: "/materials", label: "Materiais de Apoio", Icon: BookOpen },
  { to: "/video", label: "Video Aula", Icon: Video },
];

const KEY = "arp:sidebar:collapsed:v1";

function loadCollapsed() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
function saveCollapsed(v: boolean) {
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
}

export function Sidebar({ onWidthChange }: { onWidthChange?: (w: number) => void; }) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => (typeof window === "undefined" ? false : loadCollapsed()));
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = React.useState<Record<string, boolean>>({
    "Agentes de Autoridade": location.pathname.includes("/authority-agents")
  });
  
  React.useEffect(() => {
    saveCollapsed(collapsed);
    onWidthChange?.(collapsed ? 84 : 268);
  }, [collapsed, onWidthChange]);

  const toggleSubMenu = (label: string, e: React.MouseEvent) => {
    // REMOVIDO o e.preventDefault() para permitir a navegação da página pai!
    setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const width = collapsed ? 84 : 268;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-dvh border-r bg-background/55 backdrop-blur shadow-[0_0_0_1px_rgba(0,0,0,0.02)] transition-all flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar"
      )}
      style={{ width }}
    >
      <div className="flex flex-col p-3 min-h-full">
        <Link
          to="/"
          className={cn(
            "group flex items-center gap-3 rounded-2xl px-3 py-3 transition",
            "hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <img src={logoUrl} alt="Logo Autoridade" className={cn("h-10 w-auto max-w-[160px] object-contain", collapsed ? "max-w-[44px]" : "")} />
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</div>
              <div className="truncate text-xs text-muted-foreground">painel premium</div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setCollapsed((v) => !v); }}
            className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-background/40 shadow-soft transition hover:bg-foreground/5")}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </Link>

        <div className="mt-4 flex-1 space-y-1">
          {items.map((it) => {
            const hasSub = !!it.subItems?.length;
            const isExpanded = expandedMenus[it.label];
            const isActiveParent = location.pathname === it.to || (hasSub && location.pathname.startsWith(it.to));

            return (
              <div key={it.to} className="flex flex-col">
                <div className="flex items-center">
                  <NavLink
                    to={it.to}
                    onClick={(e) => { if (hasSub && !collapsed) { toggleSubMenu(it.label, e); } }}
                    className={cn(
                      "group flex flex-1 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition relative",
                      "hover:bg-foreground/5",
                      isActiveParent ? "bg-foreground/5 ring-1 ring-border/70" : "ring-1 ring-transparent"
                    )}
                  >
                    <motion.div initial={false} animate={{ scale: isActiveParent ? 1.02 : 1 }} transition={transitions.base} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl border shadow-soft", isActiveParent ? "bg-background/60" : "bg-background/40")}>
                      <it.Icon className={cn("h-5 w-5", isActiveParent ? "text-foreground" : "text-muted-foreground")} />
                    </motion.div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1 flex justify-between items-center">
                        <div className="truncate font-medium">{it.label}</div>
                        {hasSub && (
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                        )}
                      </div>
                    )}
                  </NavLink>
                </div>

                {hasSub && !collapsed && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-12 mt-1 space-y-1 border-l-2 border-border/50 pl-2">
                          {it.subItems!.map((sub) => (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              className={({ isActive }) => cn(
                                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                                isActive ? "bg-google-blue/10 text-google-blue font-medium" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                              )}
                            >
                              <sub.Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border bg-background/40 p-4 shadow-soft">
          {!collapsed ? (
            <>
              <div className="text-xs font-semibold">Cérebro Central</div>
              <div className="mt-1 text-xs text-muted-foreground">Acesse Agentes de Autoridade para rodar scripts e gerar conteúdos.</div>
            </>
          ) : (
            <div className="grid place-items-center text-xs text-muted-foreground">•</div>
          )}
        </div>
      </div>
    </aside>
  );
}