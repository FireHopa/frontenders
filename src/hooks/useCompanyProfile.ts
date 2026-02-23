import * as React from "react";

export type CompanyProfile = {
  companyName?: string;
  cityState?: string; // "Cidade - UF" ou "Cidade, UF"
  neighborhood?: string;
  segment?: string;
  services?: string;
  audience?: string;
  serviceRegion?: string;
  differentiator?: string;
  instagram?: string;
  website?: string;
  brandWords?: string; // "moderno, direto, premium"
};

const STORAGE_KEY = "authority.competition.company_profile.v1";

function safeParse(json: string | null): CompanyProfile | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    if (!v || typeof v !== "object") return null;
    return v as CompanyProfile;
  } catch {
    return null;
  }
}

export function loadCompanyProfile(): CompanyProfile {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  return safeParse(raw) ?? {};
}

export function saveCompanyProfile(profile: CompanyProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearCompanyProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const REQUIRED_FIELDS: Array<keyof CompanyProfile> = ["cityState", "segment", "services", "audience", "serviceRegion"];

export function missingRequired(profile: CompanyProfile): Array<keyof CompanyProfile> {
  return REQUIRED_FIELDS.filter((k) => !String(profile[k] ?? "").trim());
}

export function useCompanyProfile() {
  const [profile, setProfile] = React.useState<CompanyProfile>(() => loadCompanyProfile());

  const update = React.useCallback((patch: Partial<CompanyProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      saveCompanyProfile(next);
      return next;
    });
  }, []);

  const replace = React.useCallback((next: CompanyProfile) => {
    setProfile(next);
    saveCompanyProfile(next);
  }, []);

  const clear = React.useCallback(() => {
    setProfile({});
    clearCompanyProfile();
  }, []);

  return { profile, update, replace, clear, missing: missingRequired(profile) };
}
