import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/state/authStore";

export function AppTopBar() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout(); 
    navigate("/"); 
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm md:px-6">
      
      {/* Lado Esquerdo: Logo ou Título */}
      <div className="flex items-center gap-4">
        <Link to="/" className="text-lg font-bold text-white transition-colors hover:text-blue-400">
          Painel Authority
        </Link>
      </div>

      {/* Lado Direito: Status da Sessão */}
      <div className="flex items-center gap-4">
        {token && user ? (
          // SE ESTIVER LOGADO: Mostra créditos, perfil e botão de sair
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Tag de Créditos */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 border border-blue-500/20" title="Recarrega 100 créditos diariamente">
              <span>🪙</span>
              <span>{user.credits ?? 0} Créditos</span>
            </div>

            {/* Link clicável para a página "Minha Conta" */}
            <Link to="/conta" className="flex items-center gap-3 border-l border-zinc-700 pl-4 hover:bg-zinc-800/50 p-2 rounded-xl transition cursor-pointer">
              <div className="hidden flex-col items-end sm:flex">
                <span className="text-sm font-medium text-zinc-200">
                  {user.name?.split(" ")[0] || "Usuário"}
                </span>
                <span className="text-xs text-zinc-500">{user.email}</span>
              </div>
              
              {/* Avatar Círculo */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white hover:ring-2 ring-blue-400 transition">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            </Link>
            
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-500/20 ml-2"
            >
              Sair
            </button>
          </div>
        ) : (
          // SE NÃO ESTIVER LOGADO: Mostra botões de login
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Criar Conta
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}