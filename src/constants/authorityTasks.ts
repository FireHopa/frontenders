export type AuthorityTask = {
  title: string;
};

export const YOUTUBE_TASKS: AuthorityTask[] = [
  { title: 'Roteiro de Vídeo Longo (Conteúdo Pilar)' },
  { title: 'Roteiro de Shorts / Vídeo Curto' },
  { title: 'Títulos e Descrições Otimizadas (SEO/AEO)' },
  { title: 'Roteiro Institucional (Sobre a Empresa)' }
];

export const INSTAGRAM_TASKS: AuthorityTask[] = [
  { title: 'Roteiro para Reels (Vídeo Curto)' },
  { title: 'Carrossel Educativo / Conversão' },
  { title: 'Post Estático (Imagem/Posicionamento)' },
  { title: 'Roteiro de Sequência para Stories' },
  { title: 'Otimização de Bio e Destaques' }
];

export const TIKTOK_TASKS: AuthorityTask[] = [
  { title: 'Roteiro de Vídeo Curto (Trend/Dinâmico)' },
  { title: 'Roteiro Educativo / Resposta a Dúvida (AEO)' },
  { title: 'Otimização de Bio e Identidade do Perfil' }
];

export const LINKEDIN_TASKS: AuthorityTask[] = [
  { title: 'Post Educacional / Opinião Técnica' },
  { title: 'Estudo de Caso / Resultado B2B' },
  { title: 'Otimização de Perfil Pessoal (Headline e Sobre)' },
  { title: 'Otimização de LinkedIn Page (Empresa)' }
];

export const GOOGLE_BUSINESS_PROFILE_TASKS: AuthorityTask[] = [
  { title: 'Postagem de Atualização / Oferta' },
  { title: 'Responder Dúvidas Frequentes (FAQ)' },
  { title: 'Otimização de Serviços e Descrição (SEO Local)' }
];

export const EXTERNAL_MENTIONS_TASKS: AuthorityTask[] = [
  { title: 'Kit de Menção (Textos Oficiais da Empresa)' },
  { title: 'Modelo de Mini Apresentação (Pitch)' },
  { title: 'Artigo / Release para Imprensa ou Parceiros' }
];

export const SITE_TASKS: AuthorityTask[] = [
  { title: 'Artigo de Blog Otimizado (SEO/AEO/GEO)' },
  { title: 'FAQ (Perguntas Frequentes)' },
  { title: 'Página de Serviço / Produto' },
  { title: 'Página Institucional (Sobre a Empresa)' }
];

export const DECISION_CONTENT_TASKS: AuthorityTask[] = [
  { title: 'FAQ Focado em Quebra de Objeções' },
  { title: 'Landing Page (Página de Destino de Alta Conversão)' },
  { title: 'E-mail Persuasivo de Recuperação/Decisão' },
  { title: 'Comparativo: Nossa Solução vs Mercado' }
];

export function tasksByAgentKey(agentKey?: string | null): AuthorityTask[] {
  if (!agentKey) return [];
  switch (agentKey) {
    case "youtube":
      return YOUTUBE_TASKS;
    case "instagram":
      return INSTAGRAM_TASKS;
    case "tiktok":
      return TIKTOK_TASKS;
    case "linkedin":
      return LINKEDIN_TASKS;
    case "google_business_profile":
      return GOOGLE_BUSINESS_PROFILE_TASKS;
    case "external_mentions":
      return EXTERNAL_MENTIONS_TASKS;
    case "site":
      return SITE_TASKS;
    case "decision_content": 
      return DECISION_CONTENT_TASKS;
    default:
      return [];
  }
}