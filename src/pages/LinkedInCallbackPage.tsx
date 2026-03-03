import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { linkedinService } from "@/services/linkedin";
import { useAuthStore } from "@/state/authStore";
import { toastSuccess, toastApiError } from "@/lib/toast";

export default function LinkedInCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [processing, setProcessing] = useState(true);
  
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    
    // Descobre para onde voltar. O padrão é a Mônica, se não achar a flag no localStorage
    const redirectPath = localStorage.getItem("linkedin_redirect") || "/authority-agents/run/linkedin";

    if (error) {
      toastApiError(new Error("Você cancelou a autorização do LinkedIn."), "Conexão Cancelada");
      localStorage.removeItem("linkedin_redirect");
      navigate(redirectPath);
      return;
    }

    if (code) {
      if (hasCalledAPI.current) return;
      hasCalledAPI.current = true;

      linkedinService.connect(code)
        .then(() => {
          updateUser({ has_linkedin: true });
          toastSuccess("Conta do LinkedIn conectada com sucesso!");
          localStorage.removeItem("linkedin_redirect");
          navigate(redirectPath);
        })
        .catch((err) => {
          toastApiError(err, "Erro ao conectar LinkedIn. Verifique o terminal do Backend.");
          localStorage.removeItem("linkedin_redirect");
          navigate(redirectPath);
        });
    } else {
      setProcessing(false);
    }
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-[#0A66C2]" />
      <h2 className="mt-6 text-xl font-semibold text-foreground">Sincronizando LinkedIn...</h2>
      <p className="mt-2 text-muted-foreground">A conectar a sua conta de forma segura. Por favor, aguarde.</p>
    </div>
  );
}