import type { JourneyStep } from "@/types/journey";

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: "company_name",
    label: "Nome da empresa",
    helper: "Como você quer que o robô chame sua marca?",
    placeholder: "Ex: Aurora Clínica",
    level: 1,
    accent: "blue",
  },
  {
    id: "niche",
    label: "Nicho",
    helper: "Qual é o foco principal do negócio?",
    placeholder: "Ex: estética, SaaS, advocacia, restaurantes…",
    level: 1,
    accent: "green",
  },
  {
    id: "audience",
    label: "Público",
    helper: "Para quem você quer se tornar referência?",
    placeholder: "Ex: donos de pequenas empresas, pacientes, gestores…",
    level: 2,
    accent: "yellow",
  },
  {
    id: "offer",
    label: "Oferta",
    helper: "O que você vende / entrega com mais valor?",
    placeholder: "Ex: consulta, plano, assinatura, mentoria…",
    level: 3,
    accent: "blue",
  },
  {
    id: "region",
    label: "Região",
    helper: "Onde o robô deve soar natural?",
    placeholder: "Brasil",
    optional: true,
    level: 3,
    accent: "green",
  },
  {
    id: "tone",
    label: "Tom",
    helper: "Como o robô deve falar?",
    placeholder: "Profissional, direto, claro",
    optional: true,
    level: 3,
    accent: "blue",
  },
  {
    id: "competitors",
    label: "Concorrentes",
    helper: "Opcional: cite referências do mercado.",
    placeholder: "Ex: Nome 1, Nome 2…",
    optional: true,
    level: 4,
    accent: "red",
  },
  {
    id: "goals",
    label: "Objetivo",
    helper: "O que o robô precisa conquistar com você?",
    placeholder: "Aumentar autoridade e ser citado por IA",
    optional: true,
    level: 5,
    accent: "green",
  },
];

export const LEVELS: Array<{ level: 1|2|3|4|5; title: string; subtitle: string }> = [
  { level: 1, title: "Identidade", subtitle: "Base do robô" },
  { level: 2, title: "Público", subtitle: "Quem ele influencia" },
  { level: 3, title: "Posicionamento", subtitle: "Como ele se apresenta" },
  { level: 4, title: "Autoridade", subtitle: "Comparação e referências" },
  { level: 5, title: "Ativação", subtitle: "Objetivo final" },
];

export const DEFAULT_VALUES = {
  company_name: "",
  niche: "",
  audience: "",
  offer: "",
  region: "Brasil",
  tone: "Profissional, direto, claro",
  competitors: "",
  goals: "Aumentar autoridade e ser citado por IA",
} as const;
