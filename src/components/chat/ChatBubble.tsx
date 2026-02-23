import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions } from "@/lib/motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatMessageOut } from "@/types/api";
import { Markdown } from "@/components/markdown/Markdown";

/**
 * ChatBubble (produção)
 * - Sem "editar mensagem" (evita edição fake que não reprocessa o fluxo do chat no backend).
 * - Avatar do robô sempre visível nas mensagens do assistente.
 */
export function ChatBubble({
  msg,
  assistantAvatarSrc,
  assistantLabel = "Robô",
}: {
  msg: ChatMessageOut;
  assistantAvatarSrc?: string | null;
  assistantLabel?: string;
}) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitions.base}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div className={cn("flex max-w-full items-start gap-3", isUser ? "flex-row-reverse ml-auto" : "mr-auto")}>
        {!isUser ? (
          <Avatar className="mt-1 h-9 w-9" tone="blue">
            {assistantAvatarSrc ? <AvatarImage src={assistantAvatarSrc} alt={assistantLabel} /> : null}
            <AvatarFallback tone="blue">{assistantLabel.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : null}

        <div
          className={cn(
            "max-w-[92%] sm:max-w-[75%] rounded-2xl border px-4 py-3 shadow-soft",
            isUser ? "bg-google-blue/10 border-google-blue/20" : "bg-background/55 border-border/70",
            "glass"
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
          ) : (
            <Markdown content={msg.content} />
          )}

          <div className="mt-2 text-[11px] text-muted-foreground">{new Date(msg.created_at).toLocaleString("pt-BR")}</div>
        </div>
      </div>
    </motion.div>
  );
}
