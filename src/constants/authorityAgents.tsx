import * as React from "react";
import {
  Globe,
  MapPin,
  Star,
  FileText,
  Instagram,
  Linkedin,
  Youtube,
  Sparkles,
  ExternalLink,
  Merge,
} from "lucide-react";

export type AuthorityAgentDef = {
  key: string;
  name: string;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export const AUTHORITY_AGENTS: AuthorityAgentDef[] = [
  { key: "site", name: "Caio Web", label: "Agente Site", desc: "Kit de autoridade para site (páginas, FAQ, prova social).", Icon: Globe },
  { key: "google_business_profile", name: "Gabi Maps", label: "Agente Perfil de Empresa no Google", desc: "Otimização total do GBP (descrições, posts, avaliações).", Icon: MapPin },
  { key: "reputation", name: "Rafa Reputação", label: "Agente Prova social e reputação", desc: "Scripts e ativos para coletar e publicar prova social.", Icon: Star },
  { key: "decision_content", name: "Duda Decisão", label: "Agente Conteúdos de decisão", desc: "Conteúdos de fundo de funil que fecham sem prometer o impossível.", Icon: FileText },
  { key: "instagram", name: "Bia Insta", label: "Agente Instagram", desc: "Plano de 30 dias + bio + Reels + carrosséis + stories.", Icon: Instagram },
  { key: "linkedin", name: "Leo B2B", label: "Agente LinkedIn", desc: "Perfil + posts + prospecção + cases (sem inventar números).", Icon: Linkedin },
  { key: "youtube", name: "Yuri Vídeos", label: "Agente YouTube", desc: "Ideias, roteiros e SEO para autoridade em vídeo.", Icon: Youtube },
  { key: "tiktok", name: "Tati Trend", label: "Agente TikTok", desc: "30 ideias de vídeos curtos (autoridade, prova, decisão).", Icon: Sparkles },
  { key: "consistency", name: "Nina Consistência", label: "Agente Consistência entre plataformas", desc: "Padronização de mensagens e identidade entre canais.", Icon: Merge },
  { key: "external_mentions", name: "Enzo Menções", label: "Agente Menções externas", desc: "Plano de PR e citações externas (portais, parcerias, releases).", Icon: ExternalLink },
];

export function authorityAgentByKey(key?: string | null) {
  return AUTHORITY_AGENTS.find((a) => a.key === key);
}
