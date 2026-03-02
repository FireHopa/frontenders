import React, { useState, useEffect } from "react";
import { X, Loader2, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  onPublish: (text: string) => void;
  loading: boolean;
};

export function PublishModal({ isOpen, onClose, initialText, onPublish, loading }: Props) {
  const [text, setText] = useState("");

  // Atualiza o texto sempre que o modal abrir com um texto novo
  useEffect(() => {
    if (isOpen) setText(initialText);
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2]">
              <Linkedin className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Preview do Post</h3>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Revise e edite o seu conteúdo gerado antes de publicá-lo diretamente no seu perfil.
          </p>
          <Textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            rows={10} 
            className="resize-none text-sm leading-relaxed rounded-xl bg-background" 
            placeholder="O que você quer compartilhar?"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/10 p-4">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
            Cancelar
          </Button>
          <Button 
            onClick={() => onPublish(text)} 
            disabled={loading || !text.trim()} 
            className="rounded-xl bg-[#0A66C2] text-white hover:bg-[#004182]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publicar Agora
          </Button>
        </div>

      </div>
    </div>
  );
}