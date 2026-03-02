import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toastApiError(new Error("Você cancelou a autorização do LinkedIn."), "Conexão Cancelada");
      navigate("/authority-agents");
      return;
    }

    if (code) {
      linkedinService.connect(code)
        .then(() => {
          updateUser({ has_linkedin: true });
          toastSuccess("Conta do LinkedIn conectada com sucesso!");
          // Volta para a página do Liam onde ele estava (ajuste se necessário)
          navigate("/authority-agents/run/liam");
        })
        .catch((err) => {
          toastApiError(err, "Erro ao conectar LinkedIn");
          navigate("/authority-agents");
        });
    } else {
      setProcessing(false);
    }
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-[#0A66C2]" />
      <h2 className="mt-6 text-xl font-semibold text-foreground">Sincronizando LinkedIn...</h2>
      <p className="mt-2 text-muted-foreground">Por favor, aguarde um momento.</p>
    </div>
  );
}