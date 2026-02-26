import { http } from "./http";



export const authService = {
  login: async (email: string, password: string) => {
    return http("/api/auth/login", {
      method: "POST",
      json: { email, password },
    });
  },
  
  register: async (email: string, password: string, full_name?: string) => {
    return http("/api/auth/register", {
      method: "POST",
      json: { email, password, full_name },
    });
  },
  
  googleLogin: async (credential: string) => {
    return http("/api/auth/google", {
      method: "POST",
      json: { credential },
    });
  },
  
  // Utilidade para checar se o token atual ainda é válido no backend
  checkMe: async () => {
    return http<{ email: string; full_name?: string; google_id?: string }>("/api/auth/me", {
      method: "GET",
    });
  }
};