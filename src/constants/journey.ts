import type { JourneyStep } from "@/types/journey";

export const LEVELS = [
  { level: 1, title: "Robô", subtitle: "Configuração essencial" },
  { level: 2, title: "Núcleo", subtitle: "Aprofundamento estratégico" },
];

export const JOURNEY_STEPS: JourneyStep[] = [
  // FASE 1: Montagem do Robô (O Essencial) - Level 1
  { 
    id: "company_name", 
    label: "Empresa", 
    helper: "Como sua marca é chamada?", 
    placeholder: "Ex: Casa do Ads", 
    level: 1,
    accent: "blue" 
  },
  { 
    id: "niche", 
    label: "Nicho", 
    helper: "Em qual mercado você atua?", 
    placeholder: "Ex: Tráfego Pago para PMEs", 
    level: 1,
    accent: "blue" 
  },
  { 
    id: "audience", 
    label: "Público-alvo", 
    helper: "Quem é o seu cliente ideal?", 
    placeholder: "Ex: Donos de negócios locais", 
    level: 1,
    accent: "blue" 
  },
  { 
    id: "offer", 
    label: "Oferta", 
    helper: "O que você vende?", 
    placeholder: "Ex: Imersão presencial e consultoria", 
    level: 1,
    accent: "blue" 
  },
  { 
    id: "region", 
    label: "Região", 
    helper: "Onde você atua?", 
    placeholder: "Ex: Santos, SP", 
    level: 1,
    accent: "blue" 
  },
  { 
    id: "tone", 
    label: "Tom de voz", 
    helper: "Como o robô deve falar?", 
    placeholder: "Ex: Profissional", 
    level: 1,
    accent: "yellow" 
  },
  { 
    id: "competitors", 
    label: "Referências", 
    helper: "Quais são seus concorrentes ou referências?", 
    placeholder: "Ex: Agência V4", 
    optional: true, 
    level: 1,
    accent: "yellow" 
  },
  { 
    id: "goals", 
    label: "Objetivos", 
    helper: "O que você espera alcançar?", 
    placeholder: "Ex: Mais leads qualificados", 
    level: 1,
    accent: "green" 
  },

  // FASE 2: Aprofundamento (Núcleo da Empresa) - Level 2
  { 
    id: "real_differentials", 
    label: "Diferenciais", 
    helper: "Fase 2: O que só você faz? Qual sua vantagem real?", 
    placeholder: "Ex: 14 anos de mercado, foco em IA", 
    level: 2,
    accent: "red" 
  },
  { 
    id: "restrictions", 
    label: "Restrições", 
    helper: "Fase 2: O que o robô NUNCA deve fazer ou prometer?", 
    placeholder: "Ex: Não prometer ROAS garantido", 
    optional: true, 
    level: 2,
    accent: "red" 
  },
  { 
    id: "site", 
    label: "Site", 
    helper: "Fase 2: Qual o seu site oficial?", 
    placeholder: "https://", 
    optional: true, 
    level: 2,
    accent: "blue" 
  },
  { 
    id: "instagram", 
    label: "Instagram", 
    helper: "Fase 2: Qual o seu @ do Instagram?", 
    placeholder: "@", 
    optional: true, 
    level: 2,
    accent: "blue" 
  }
];

export const DEFAULT_VALUES: Record<string, string> = {
  company_name: "",
  niche: "",
  audience: "",
  offer: "",
  region: "",
  tone: "",
  competitors: "",
  goals: "",
  real_differentials: "",
  restrictions: "",
  site: "",
  instagram: ""
};