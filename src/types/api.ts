export type ISODateString = string;

export interface HealthResponse {
  ok: boolean;
  ts: string;
}

export interface RobotOut {
  public_id: string;
  title: string;
  description: string;
  avatar_data?: string | null;
  created_at: ISODateString;
}

export interface RobotDetail {
  public_id: string;
  title: string;
  description: string;
  avatar_data?: string | null;
  system_instructions: string;
  created_at: ISODateString;
  knowledge_files_json?: string; // NOVO CAMPO
}

export interface BriefingIn {
  company_name: string;
  niche: string;
  audience: string;
  offer: string;
  region?: string;
  tone?: string;
  competitors?: string;
  goals: string;
}

export interface RobotUpdateIn {
  title?: string;
  description?: string;
  avatar_data?: string | null;
  system_instructions?: string;
}

export interface ChatIn {
  message: string;
  /** habilita busca na web no backend (Serper/WebSearch) */
  use_web?: boolean;
  /** limite de resultados (opcional) */
  web_max_results?: number;
  /** domínios permitidos (opcional) */
  web_allowed_domains?: string[];
}

export interface ChatMessageOut {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: ISODateString;
}

export interface MessageUpdateIn {
  content: string;
}


export interface AuthorityAssistantIn {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AuthorityAssistantOut {
  apply_change: boolean;
  before_score: number;
  after_score: number;
  criteria: { id: string; label: string; hit_before: boolean; hit_after: boolean }[];
  changes_made: { what: string; why: string }[];
  suggestions: { title: string; detail: string }[];
  updated_system_instructions: string | null;
  assistant_reply: string;
}

export interface AuthorityEditOut {
  id: number;
  created_at: string;
  user_message: string;
  summary: string;
  changes_made: Record<string, any>[];
  before_score: number;
  after_score: number;
}


export interface BusinessCoreOut {
  company_name: string;
  city_state: string;
  service_area: string;
  main_audience: string;
  services_products: string;
  real_differentials: string;
  restrictions: string;

  reviews: string;
  testimonials: string;
  usable_links_texts: string;
  forbidden_content: string;

  site: string;
  google_business_profile: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;

  updated_at: ISODateString;
  knowledge_text?: string;
  knowledge_files_json?: string;
}

export interface BusinessCoreIn {
  company_name?: string | null;
  city_state?: string | null;
  service_area?: string | null;
  main_audience?: string | null;
  services_products?: string | null;
  real_differentials?: string | null;
  restrictions?: string | null;

  reviews?: string | null;
  testimonials?: string | null;
  usable_links_texts?: string | null;
  forbidden_content?: string | null;

  site?: string | null;
  google_business_profile?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  knowledge_text?: string;
  knowledge_files_json?: string;
}

export interface AuthorityAgentRunRequest {
  client_id: string;
  agent_key: string;
  nucleus: BusinessCoreIn | Record<string, any>;
}

export interface AuthorityAgentRunGlobalRequest {
  client_id: string;
  agent_key: string;
  nucleus: BusinessCoreIn;
}

export interface AuthorityAgentRunResponse {
  agent_key: string;
  agent_name: string;
  cooldown_seconds: number;
  output: string;
}
