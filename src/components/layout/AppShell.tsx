import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell() {
  const location = useLocation();
  const [sidebarW, setSidebarW] = React.useState(268);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-background focus:px-4 focus:py-2 focus:shadow-card"
      >
        Pular para o conteúdo
      </a>

      <Sidebar onWidthChange={setSidebarW} />

      <div style={{ paddingLeft: sidebarW }} className="min-h-dvh">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            id="main-content"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(8px)" }}
            transition={{ duration: 0.22 }}
            className="container py-10"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
