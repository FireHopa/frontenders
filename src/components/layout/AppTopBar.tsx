import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/state/authStore";

export function AppTopBar() {
  // Puxamos os dados da sessão direto do nosso store
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Limpa o token
    navigate("/"); // Volta para a home
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
          // SE ESTIVER LOGADO: Mostra nome, email e botão de sair
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium text-zinc-200">
                {user.name?.split(" ")[0] || "Usuário"}
              </span>
              <span className="text-xs text-zinc-500">{user.email}</span>
            </div>
            {/* Avatar Círculo com a inicial do nome */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 transition hover:bg-red-500/20"
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