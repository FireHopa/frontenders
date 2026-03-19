export type AuthorityTaskInputMode = "theme" | "textarea" | "direct";

export type AuthorityTask = {
  title: string;
  prompt?: string;
  inputMode?: AuthorityTaskInputMode;
  inputLabel?: string;
  inputPlaceholder?: string;
  submitLabel?: string;
  aiSuggestions?: boolean;
};

export const YOUTUBE_TASKS: AuthorityTask[] = [
  { title: "Roteiro de Vídeo Longo (Conteúdo Pilar)", inputMode: "theme", aiSuggestions: true },
  { title: "Roteiro de Shorts / Vídeo Curto", inputMode: "theme", aiSuggestions: true },
  { title: "Títulos e Descrições Otimizadas (SEO/AEO)", inputMode: "theme", aiSuggestions: true },
  { title: "Roteiro Institucional (Sobre a Empresa)", inputMode: "theme", aiSuggestions: true }
];

export const INSTAGRAM_TASKS: AuthorityTask[] = [
  { title: "Roteiro para Reels (Vídeo Curto)", inputMode: "theme", aiSuggestions: true },
  { title: "Carrossel Educativo / Conversão", inputMode: "theme", aiSuggestions: true },
  { title: "Post Estático (Imagem/Posicionamento)", inputMode: "theme", aiSuggestions: true },
  { title: "Roteiro de Sequência para Stories", inputMode: "theme", aiSuggestions: true },
  { title: "Otimização de Bio e Destaques", inputMode: "direct", aiSuggestions: false }
];

export const TIKTOK_TASKS: AuthorityTask[] = [
  { title: "Roteiro de Vídeo Curto (Trend/Dinâmico)", inputMode: "theme", aiSuggestions: true },
  { title: "Roteiro Educativo / Resposta a Dúvida (AEO)", inputMode: "theme", aiSuggestions: true },
  { title: "Otimização de Bio e Identidade do Perfil", inputMode: "direct", aiSuggestions: false }
];

export const LINKEDIN_TASKS: AuthorityTask[] = [
  { title: "Post Educacional / Opinião Técnica", inputMode: "theme", aiSuggestions: true },
  { title: "Estudo de Caso / Resultado B2B", inputMode: "theme", aiSuggestions: true },
  { title: "Otimização de Perfil Pessoal (Headline e Sobre)", inputMode: "direct", aiSuggestions: false },
  { title: "Otimização de LinkedIn Page (Empresa)", inputMode: "direct", aiSuggestions: false }
];

export const GOOGLE_BUSINESS_PROFILE_TASKS: AuthorityTask[] = [
  { title: "Postagem de Atualização / Oferta", inputMode: "theme", aiSuggestions: true },
  { title: "Responder Dúvidas Frequentes (FAQ)", inputMode: "theme", aiSuggestions: true },
  { title: "Otimização de Serviços e Descrição (SEO Local)", inputMode: "direct", aiSuggestions: false },
  {
    title: "SEO Local para Serviços",
    prompt: "Com base no núcleo real da empresa, gere uma lista em tópicos de palavras-chave e frases curtas para cadastro em Editar serviços do Perfil de Empresa no Google. A lista deve fortalecer SEO local, GEO e AEO com máxima clareza semântica. Regras obrigatórias: cada item deve ter no máximo 120 caracteres; incluir o maior número possível de variações naturais, específicas e pesquisáveis; priorizar serviço principal, especialidade, intenção local, modalidade de atendimento e problemas resolvidos quando fizer sentido; evitar duplicações quase idênticas; não inventar serviços, produtos, localidades ou promessas; organizar a saída de forma pronta para copiar.",
    inputMode: "direct",
    aiSuggestions: false
  },
  {
    title: "Serviços + Descrições",
    prompt: "Com base nos serviços e produtos reais da empresa, crie uma lista em tópicos com as principais palavras-chave e suas variações pesquisáveis. Para cada serviço ou produto, entregue: 1) um nome curto com no máximo 56 caracteres; 2) uma descrição curta, natural e profissional usando SEO, GEO e AEO, contendo termos que ajudem humanos e IA a entender com clareza o que a empresa faz. Também encontre palavras similares que as pessoas pesquisam, sem inventar serviços, localidades ou promessas. A saída deve ficar organizada, pronta para cadastro e fácil de copiar.",
    inputMode: "direct",
    aiSuggestions: false
  },
  {
    title: "Responder Avaliação",
    prompt: "Me ajude a criar respostas personalizadas e profissionais para avaliações positivas do Perfil de Empresa no Google. A primeira linha deve agradecer de forma humanizada e natural. O restante da resposta deve contextualizar a experiência mencionada e incluir, de forma orgânica, o nome do produto, serviço ou especialidade relevante da empresa para fortalecer SEO local, AEO e GEO sem parecer estratégia, propaganda ou texto genérico. O tom deve ser humano, elegante e específico. Se eu enviar uma avaliação, responda exatamente a ela. Se eu não enviar, gere modelos prontos adaptáveis.",
    inputMode: "textarea",
    inputLabel: "Cole aqui a avaliação que você quer responder",
    inputPlaceholder: "Ex: Atendimento excelente, equipe muito atenciosa e o serviço foi entregue no prazo. Recomendo!",
    submitLabel: "Gerar Resposta",
    aiSuggestions: false
  }
];

export const EXTERNAL_MENTIONS_TASKS: AuthorityTask[] = [
  { title: "Kit de Menção (Textos Oficiais da Empresa)", inputMode: "direct", aiSuggestions: false },
  { title: "Modelo de Mini Apresentação (Pitch)", inputMode: "direct", aiSuggestions: false },
  { title: "Artigo / Release para Imprensa ou Parceiros", inputMode: "theme", aiSuggestions: true }
];

export const SITE_TASKS: AuthorityTask[] = [
  { title: "Artigo de Blog Otimizado (SEO/AEO/GEO)", inputMode: "theme", aiSuggestions: true },
  { title: "FAQ (Perguntas Frequentes)", inputMode: "theme", aiSuggestions: true },
  { title: "Página de Serviço / Produto", inputMode: "theme", aiSuggestions: true },
  { title: "Página Institucional (Sobre a Empresa)", inputMode: "direct", aiSuggestions: false }
];

export const DECISION_CONTENT_TASKS: AuthorityTask[] = [
  { title: "FAQ Focado em Quebra de Objeções", inputMode: "theme", aiSuggestions: true },
  { title: "Landing Page (Página de Destino de Alta Conversão)", inputMode: "theme", aiSuggestions: true },
  { title: "E-mail Persuasivo de Recuperação/Decisão", inputMode: "theme", aiSuggestions: true },
  { title: "Comparativo: Nossa Solução vs Mercado", inputMode: "direct", aiSuggestions: false }
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
