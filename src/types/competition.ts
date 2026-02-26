export type CompetitionBriefing = {
  company_name?: string;
  city_state?: string; // "Cidade - UF"
  neighborhood?: string;
  niche?: string;
  services?: string;
  audience?: string;
  service_region?: string;
  differentiator?: string;
  price_level?: "popular" | "medio" | "premium";
  business_goal?: string;
  instagram?: string;
  website?: string;
  brand_words?: string[];
};

export type CompetitionFindIn = {
  company_name?: string;
  city_state?: string;
  neighborhood?: string;
  niche: string;
  services?: string;
  audience?: string;
  service_region?: string;
  differentiator?: string;
  price_level?: "popular" | "medio" | "premium";
  business_goal?: string;
  instagram?: string;
  website?: string;
  brand_words?: string[];
};

export type CompetitionFindRequest = {
  briefing: CompetitionFindIn;
};

export type CompetitorSuggestion = {
  name: string;
  website_url: string;
  instagram?: string | null;
  reason: string;
  confidence: number;
};

export type CompetitionFindOut = {
  suggestions: CompetitorSuggestion[];
  sources?: { title: string; url: string; snippet?: string }[];
  note?: string;
  data_quality?: "ok" | "incomplete";
};

export type CompetitionStartIn = {
  instagrams: string[];
  sites: string[];
  company?: CompetitionBriefing;
};

export type CompetitionJobOut = {
  job_id: string;
  report_id?: string | null;
  status: "queued" | "running" | "done" | "error" | "partial_data";
  stage?: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  error?: string | null;
  warning?: string | null;
};

export type CompetitionStatusOut = CompetitionJobOut;

export type CompetitionResult = {
  company: {
    name?: string;
    niche?: string;
    region?: string;
    services?: string;
    audience?: string;
    offer?: string;
    signals: {
      presence: number;
      offer_clarity: number;
      communication: number;
      content_frequency: number;
      positioning: number;
      perceived_authority: number;
    };
    notes?: string[];
  };
  competitors: Array<{
    name: string;
    website_url?: string;
    instagram?: string | null;
    signals: CompetitionResult["company"]["signals"];
    highlights?: string[];
    gaps?: string[];
  }>;
  comparisons: {
    bar: Array<{ label: string; authority: number; clarity: number; presence: number }>;
    radar: Array<{
      metric:
        | "presence"
        | "offer_clarity"
        | "communication"
        | "content_frequency"
        | "positioning"
        | "perceived_authority";
      company: number;
      best_competitor: number;
    }>;
  };
  insights: Array<{
    title: string;
    type: "strength" | "weakness" | "opportunity" | "recommendation";
    text: string;
    priority: "low" | "medium" | "high";
  }>;
  recommendations: Array<{
    title: string;
    steps: string[];
    expected_impact: "low" | "medium" | "high";
  }>;
  transparency?: {
    local_competitors_found?: boolean;
    used_nearby_region?: boolean;
    estimated_fields?: string[];
    limitations?: string[];
  };
};

export type CompetitionResultOut = {
  report_id: string;
  status: "done" | "partial_data";
  result: CompetitionResult;
  updated_at?: string;
};
