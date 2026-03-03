import React, { useState } from "react";
import { User, Mail, Coins, ShieldCheck, Linkedin, Loader2 } from "lucide-react";
import { useAuthStore } from "@/state/authStore";
import { linkedinService } from "@/services/linkedin";

export default function AccountPage() {
  const { user } = useAuthStore();
  const [isLinking, setIsLinking] = useState(false);

  if (!user) return <div className="p-8">Não autenticado.</div>;

  const handleConnectLinkedIn = async () => {
    try {
      setIsLinking(true);
      localStorage.setItem("linkedin_redirect", "/conta"); // Marca a origem
      const res = await linkedinService.getAuthUrl();
      window.location.href = res.url;
    } catch (error) {
      console.error("Erro ao gerar a URL do LinkedIn", error);
      setIsLinking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
        <p className="text-muted-foreground mt-2">Gere o teu perfil e verifica o teu saldo de créditos diários.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cartão de Perfil */}
        <div className="bg-card border border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          
          <div className="relative mt-8 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white shadow-xl ring-4 ring-background">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-foreground">{user.name || "Sem Nome"}</h2>
            <div className="flex items-center justify-center gap-2 text-zinc-400 mt-1">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-sm font-medium border border-green-500/20">
              <ShieldCheck className="h-4 w-4" /> Conta Ativa
            </div>

            {/* NOVO: Botão de Vincular LinkedIn */}
            {user.has_linkedin ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-full text-sm font-medium border border-[#0A66C2]/20">
                <Linkedin className="h-4 w-4" /> LinkedIn Conectado
              </div>
            ) : (
              <button 
                onClick={handleConnectLinkedIn} 
                disabled={isLinking}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-sm font-medium border border-zinc-700 transition-colors disabled:opacity-50"
              >
                {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
                Vincular LinkedIn
              </button>
            )}
          </div>
        </div>

        {/* Cartão de Créditos */}
        <div className="bg-card border border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-blue-400 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Créditos de IA</h3>
            </div>
            
            <p className="text-muted-foreground text-sm">
              Os teus créditos são usados para executar agentes de autoridade. Recebes <strong>100 novos créditos</strong> automaticamente todos os dias.
            </p>
          </div>

          <div className="mt-8 bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">Saldo Atual</p>
              <p className="text-4xl font-black text-white mt-1">{user.credits}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-400">Custo por Ação</p>
              <p className="text-lg font-bold text-zinc-300 mt-1">5 Créditos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}