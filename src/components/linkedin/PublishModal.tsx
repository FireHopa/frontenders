import React, { useState, useEffect } from "react";
import { X, Loader2, Linkedin, Globe2, ThumbsUp, MessageSquare, Repeat2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/state/authStore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  onPublish: (text: string) => void;
  loading: boolean;
};

export function PublishModal({ isOpen, onClose, initialText, onPublish, loading }: Props) {
  const [text, setText] = useState("");
  const { user } = useAuthStore();

  // Atualiza o texto sempre que o modal abrir com um texto novo
  useEffect(() => {
    if (isOpen) setText(initialText);
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  // Pega as iniciais e o nome do usuário logado para simular o post
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U";
  const displayName = user?.name || "Usuário do LinkedIn";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container mais largo (max-w-2xl) para dar respiro */}
      <div className="w-full max-w-3x1 overflow-hidden rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-border bg-muted/10 p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2]">
              <Linkedin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Pré-visualização do Post</h3>
              <p className="text-xs text-muted-foreground">Clique no texto abaixo para editar antes de publicar.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (Onde a mágica do Mockup acontece) */}
        <div className="p-4 sm:p-6 sm:px-12 bg-muted/30 overflow-y-auto">
          
          {/* Mockup do Card do LinkedIn */}
          <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
            
            {/* Header do Post Fake */}
            <div className="flex items-center gap-3 p-4">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-inner">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight hover:text-blue-500 cursor-pointer">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                  Especialista em Autoridade • 1º
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <span>Agora</span>
                  <span>•</span>
                  <Globe2 className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Área de Edição Invisível (Parece texto puro, mas é um textarea) */}
            <div className="px-4 pb-2">
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                className="w-full min-h-[250px] bg-transparent resize-none outline-none focus:ring-0 text-foreground text-sm sm:text-base leading-relaxed" 
                placeholder="No que você está pensando?"
              />
            </div>

            {/* Footer do Post Fake (Ações de engajamento) */}
            <div className="border-t border-border px-4 py-2 flex items-center justify-between text-muted-foreground/70">
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                <ThumbsUp className="h-5 w-5" />
                <span className="text-sm font-semibold hidden sm:inline">Gostar</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-semibold hidden sm:inline">Comentar</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                <Repeat2 className="h-5 w-5" />
                <span className="text-sm font-semibold hidden sm:inline">Republicar</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                <Send className="h-5 w-5" />
                <span className="text-sm font-semibold hidden sm:inline">Enviar</span>
              </div>
            </div>
            
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/10 p-4 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
            Voltar a Editar
          </Button>
          <Button 
            onClick={() => onPublish(text)} 
            disabled={loading || !text.trim()} 
            className="rounded-xl bg-[#0A66C2] text-white hover:bg-[#004182] px-6"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Linkedin className="mr-2 h-4 w-4" />}
            {loading ? "Publicando..." : "Publicar no LinkedIn"}
          </Button>
        </div>

      </div>
    </div>
  );
}