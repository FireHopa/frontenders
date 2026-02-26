import { http } from "./http";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_email: string;
  user_name?: string;
  credits: number; // NOVO: Backend agora devolve os créditos
}

export const authService = {
  login: async (email: string, password: string) => {
    return http<TokenResponse>("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });
  },
  
  register: async (email: string, password: string, full_name?: string) => {
    return http<TokenResponse>("/api/auth/register", {
      method: "POST",
      json: { email, password, full_name },
    });
  },
  
  googleLogin: async (credential: string) => {
    return http<TokenResponse>("/api/auth/google", {
      method: "POST",
      json: { credential },
    });
  },
  
  checkMe: async () => {
    // NOVO: Adicionado o campo credits no retorno esperado
    return http<{ email: string; full_name?: string; google_id?: string; credits: number }>("/api/auth/me", {
      method: "GET",
    });
  }
};