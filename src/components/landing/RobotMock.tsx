import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Creator = {
  name: string;
  role: string;
  tone?: "blue" | "red" | "yellow" | "green";
};

type RobotMockProps = {
  title: string;
  niche: string;
  vibe: string;
  description: string;
  icon: LucideIcon;
  creator: Creator;
  tone?: "blue" | "red" | "yellow" | "green";
  className?: string;
};

export function RobotMock({
  title,
  niche,
  vibe,
  description,
  icon: Icon,
  creator,
  tone = "blue",
  className,
}: RobotMockProps) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }} className={cn(className)}>
      <Card variant="glass" className="glass-hover overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <Avatar tone={tone} className="h-10 w-10">
              <AvatarFallback tone={tone}>
                <Icon className="h-5 w-5" aria-hidden />
                <span className="sr-only">{title}</span>
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-semibold">{title}</div>
                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-google-green" aria-hidden />
                <span className="text-xs text-muted-foreground">online</span>
              </div>

              <div className="truncate text-xs text-muted-foreground">{niche}</div>

              <div className="mt-2 text-xs text-muted-foreground">
                Criado por <span className="font-medium text-foreground">{creator.name}</span> • {creator.role}
              </div>
            </div>

            <div className="ml-auto">
              <Badge variant={tone === "blue" ? "blue" : tone === "red" ? "red" : tone === "green" ? "green" : "yellow"}>
                ativo
              </Badge>
            </div>
          </div>

          <div className="mt-4 text-sm leading-snug text-foreground/90 [display:-webkit-box] [-webkit-line-clamp:24] [-webkit-box-orient:vertical] overflow-hidden">
            {description}
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <Badge variant="secondary">AIO</Badge>
            <Badge variant="secondary">AEO</Badge>
            <Badge variant="secondary">GEO</Badge>
            <Badge variant="outline">{vibe}</Badge>
          </div>
        </div>

        <div className="h-10 w-full bg-surface opacity-80" />
      </Card>
    </motion.div>
  );
}
