import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  email: string;
  name?: string | null;
  credits: number; // NOVO: Controle de créditos diários
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  deductCredits: (amount: number) => void; // NOVO: Desconta créditos localmente
  updateCredits: (amount: number) => void; // NOVO: Atualiza o valor exato de créditos
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      
      // NOVO: Funções para manipular os créditos na interface instantaneamente
      deductCredits: (amount) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, credits: Math.max(0, state.user.credits - amount) }
            : null,
        })),
        
      updateCredits: (amount) =>
        set((state) => ({
          user: state.user ? { ...state.user, credits: amount } : null,
        })),
    }),
    {
      name: "auth-store", // Nome da chave que ficará salva no localStorage do navegador
    }
  )
);