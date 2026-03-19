import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Coins,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Unplug,
  Youtube,
} from "lucide-react";
import { useAuthStore } from "@/state/authStore";
import { linkedinService } from "@/services/linkedin";
import { instagramService } from "@/services/instagram";
import { facebookService } from "@/services/facebook";
import { InstagramConnectButton } from "@/components/instagram/InstagramConnectButton";
import { youtubeService } from "@/services/youtube";
import { googleBusinessProfileService } from "@/services/googleBusinessProfile";
import { tiktokService } from "@/services/tiktok";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return base64;
}

function generatePkceVerifier(length = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, (x) => chars[x % chars.length]).join("");
}

type IntegrationCardProps = {
  title: string;
  description: string;
  connected: boolean;
  accountLabel?: string | null;
  accentClassName: string;
  iconWrapClassName: string;
  icon: React.ReactNode;
  action: React.ReactNode;
};

function IntegrationCard({
  title,
  description,
  connected,
  accountLabel,
  accentClassName,
  iconWrapClassName,
  icon,
  action,
}: IntegrationCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.045] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_38%)] opacity-70" />

      <div className="relative flex items-start gap-4">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-white/90 transition-transform duration-300 group-hover:scale-[1.03]", iconWrapClassName)}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em]",
                connected
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/55",
              )}
            >
              {connected ? "Conectado" : "Disponível"}
            </span>
          </div>

          <p className="mt-2 max-w-[32ch] text-sm leading-6 text-white/62">{description}</p>
        </div>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/38">
          <span>Conta</span>
          <span className={cn("max-w-[70%] truncate text-right text-[12px] normal-case tracking-normal", accentClassName)}>
            {accountLabel || "Nenhuma conta vinculada"}
          </span>
        </div>

        <div className="mt-4">{action}</div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  loading,
  disabled,
  variant = "connect",
  children,
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "connect" | "disconnect";
  children: React.ReactNode;
}) {
  const isDisconnect = variant === "disconnect";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        isDisconnect
          ? "border-white/10 bg-white/[0.04] text-white/78 hover:bg-white/[0.08]"
          : "border-white/12 bg-white text-slate-950 hover:scale-[1.01] hover:bg-white/92",
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isDisconnect ? <Unplug className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      {children}
    </button>
  );
}

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const [isLinking, setIsLinking] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);
  const [isDisconnectingFacebook, setIsDisconnectingFacebook] = useState(false);
  const [isLinkingFacebook, setIsLinkingFacebook] = useState(false);
  const [isLinkingYouTube, setIsLinkingYouTube] = useState(false);
  const [isDisconnectingYouTube, setIsDisconnectingYouTube] = useState(false);
  const [isLinkingTikTok, setIsLinkingTikTok] = useState(false);
  const [isDisconnectingTikTok, setIsDisconnectingTikTok] = useState(false);
  const [isLinkingGoogleBusiness, setIsLinkingGoogleBusiness] = useState(false);
  const [isDisconnectingGoogleBusiness, setIsDisconnectingGoogleBusiness] = useState(false);

  if (!user) return <div className="p-8">Não autenticado.</div>;

  const handleConnectLinkedIn = async () => {
    try {
      setIsLinking(true);
      localStorage.setItem("linkedin_redirect", "/conta");
      const res = await linkedinService.getAuthUrl();
      window.location.href = res.url;
    } catch (error) {
      toastApiError(error, "Erro ao gerar a URL do LinkedIn");
      setIsLinking(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (isDisconnectingInstagram) return;
    setIsDisconnectingInstagram(true);
    try {
      await instagramService.disconnect();
      updateUser({ has_instagram: false, instagram_username: null });
      toastSuccess("Instagram desconectado com sucesso.");
    } catch (error) {
      toastApiError(error, "Erro ao desconectar Instagram");
    } finally {
      setIsDisconnectingInstagram(false);
    }
  };

  const handleConnectFacebook = async () => {
    if (isLinkingFacebook) return;
    try {
      setIsLinkingFacebook(true);
      facebookService.startAuth("/conta");
    } catch (error) {
      toastApiError(error, "Erro ao iniciar conexão com Facebook");
      setIsLinkingFacebook(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    if (isDisconnectingFacebook) return;
    setIsDisconnectingFacebook(true);
    try {
      await facebookService.disconnect();
      updateUser({ has_facebook: false, facebook_page_name: null, facebook_page_username: null });
      toastSuccess("Facebook desconectado com sucesso.");
    } catch (error) {
      toastApiError(error, "Erro ao desconectar Facebook");
    } finally {
      setIsDisconnectingFacebook(false);
    }
  };

  const handleConnectYouTube = async () => {
    if (isLinkingYouTube) return;
    try {
      setIsLinkingYouTube(true);
      const state = `youtube::/conta::${Date.now()}`;
      localStorage.setItem("youtube_oauth_state", state);
      localStorage.setItem("youtube_redirect", "/conta");
      const res = await youtubeService.getAuthUrl(state);
      window.location.href = res.url;
    } catch (error) {
      toastApiError(error, "Erro ao iniciar conexão com YouTube");
      setIsLinkingYouTube(false);
    }
  };

  const handleDisconnectYouTube = async () => {
    if (isDisconnectingYouTube) return;
    setIsDisconnectingYouTube(true);
    try {
      await youtubeService.disconnect();
      updateUser({ has_youtube: false, youtube_channel_title: null, youtube_channel_handle: null });
      toastSuccess("YouTube desconectado com sucesso.");
    } catch (error) {
      toastApiError(error, "Erro ao desconectar YouTube");
    } finally {
      setIsDisconnectingYouTube(false);
    }
  };

  const handleConnectTikTok = async () => {
    if (isLinkingTikTok) return;
    try {
      setIsLinkingTikTok(true);
      const state = `tiktok::/conta::${Date.now()}`;
      const codeVerifier = generatePkceVerifier(64);
      const codeChallenge = await sha256Base64Url(codeVerifier);
      localStorage.setItem("tiktok_oauth_state", state);
      localStorage.setItem("tiktok_redirect", "/conta");
      sessionStorage.setItem("tiktok_code_verifier", codeVerifier);
      const res = await tiktokService.getAuthUrl(state, codeChallenge);
      window.location.href = res.url;
    } catch (error) {
      sessionStorage.removeItem("tiktok_code_verifier");
      toastApiError(error, "Erro ao iniciar conexão com TikTok");
      setIsLinkingTikTok(false);
    }
  };

  const handleDisconnectTikTok = async () => {
    if (isDisconnectingTikTok) return;
    setIsDisconnectingTikTok(true);
    try {
      await tiktokService.disconnect();
      updateUser({ has_tiktok: false, tiktok_display_name: null, tiktok_username: null });
      toastSuccess("TikTok desconectado com sucesso.");
    } catch (error) {
      toastApiError(error, "Erro ao desconectar TikTok");
    } finally {
      setIsDisconnectingTikTok(false);
    }
  };

  const handleConnectGoogleBusiness = async () => {
    if (isLinkingGoogleBusiness) return;
    try {
      setIsLinkingGoogleBusiness(true);
      localStorage.setItem("google_business_redirect", "/conta");
      const res = await googleBusinessProfileService.getAuthUrl();
      localStorage.setItem("google_business_oauth_state", res.state);
      window.location.href = res.url;
    } catch (error) {
      toastApiError(error, "Erro ao iniciar conexão com Perfil de Empresa Google");
      setIsLinkingGoogleBusiness(false);
    }
  };

  const handleDisconnectGoogleBusiness = async () => {
    if (isDisconnectingGoogleBusiness) return;
    setIsDisconnectingGoogleBusiness(true);
    try {
      await googleBusinessProfileService.disconnect();
      updateUser({ has_google_business_profile: false, google_business_account_display_name: null, google_business_location_title: null });
      toastSuccess("Perfil de Empresa Google desconectado com sucesso.");
    } catch (error) {
      toastApiError(error, "Erro ao desconectar Perfil de Empresa Google");
    } finally {
      setIsDisconnectingGoogleBusiness(false);
    }
  };

  const connectedCount = [
    user.has_linkedin,
    user.has_instagram,
    user.has_facebook,
    user.has_youtube,
    user.has_tiktok,
    user.has_google_business_profile,
  ].filter(Boolean).length;

  const integrations = useMemo(
    () => [
      {
        id: "linkedin",
        title: "LinkedIn",
        description: "Conecte seu perfil para fortalecer sua presença profissional e o fluxo de publicação.",
        connected: !!user.has_linkedin,
        accountLabel: user.has_linkedin ? "Conta vinculada" : null,
        accentClassName: user.has_linkedin ? "text-[#78B7FF]" : "text-white/55",
        iconWrapClassName: "border-[#0A66C2]/25 bg-[#0A66C2]/12",
        icon: <Linkedin className="h-5 w-5 text-[#78B7FF]" />,
        action: user.has_linkedin ? (
          <div className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/62">
            LinkedIn já conectado
          </div>
        ) : (
          <ActionButton onClick={handleConnectLinkedIn} loading={isLinking} disabled={isLinking}>
            Vincular LinkedIn
          </ActionButton>
        ),
      },
      {
        id: "instagram",
        title: "Instagram",
        description: "Mantenha seu perfil conectado para publicar com mais agilidade e consistência.",
        connected: !!user.has_instagram,
        accountLabel: user.instagram_username ? `@${user.instagram_username}` : user.has_instagram ? "Conta vinculada" : null,
        accentClassName: user.has_instagram ? "text-pink-300" : "text-white/55",
        iconWrapClassName: "border-pink-500/20 bg-pink-500/10",
        icon: <Instagram className="h-5 w-5 text-pink-300" />,
        action: user.has_instagram ? (
          <ActionButton
            onClick={handleDisconnectInstagram}
            loading={isDisconnectingInstagram}
            disabled={isDisconnectingInstagram}
            variant="disconnect"
          >
            Desconectar Instagram
          </ActionButton>
        ) : (
          <InstagramConnectButton
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white text-sm font-medium text-slate-950 transition-all duration-200 hover:scale-[1.01] hover:bg-white/92"
          >
            Vincular Instagram
          </InstagramConnectButton>
        ),
      },
      {
        id: "facebook",
        title: "Facebook",
        description: "Conecte sua página para centralizar publicações e manter tudo no mesmo padrão.",
        connected: !!user.has_facebook,
        accountLabel:
          user.facebook_page_name || (user.facebook_page_username ? `@${user.facebook_page_username}` : user.has_facebook ? "Conta vinculada" : null),
        accentClassName: user.has_facebook ? "text-[#8DC0FF]" : "text-white/55",
        iconWrapClassName: "border-[#1877F2]/20 bg-[#1877F2]/10",
        icon: <Facebook className="h-5 w-5 text-[#8DC0FF]" />,
        action: user.has_facebook ? (
          <ActionButton
            onClick={handleDisconnectFacebook}
            loading={isDisconnectingFacebook}
            disabled={isDisconnectingFacebook}
            variant="disconnect"
          >
            Desconectar Facebook
          </ActionButton>
        ) : (
          <ActionButton onClick={handleConnectFacebook} loading={isLinkingFacebook} disabled={isLinkingFacebook}>
            Vincular Facebook
          </ActionButton>
        ),
      },
      {
        id: "youtube",
        title: "YouTube",
        description: "Deixe seu canal pronto para fluxos de vídeo, publicação e distribuição.",
        connected: !!user.has_youtube,
        accountLabel: user.youtube_channel_title || user.youtube_channel_handle || (user.has_youtube ? "Conta vinculada" : null),
        accentClassName: user.has_youtube ? "text-red-300" : "text-white/55",
        iconWrapClassName: "border-red-500/20 bg-red-500/10",
        icon: <Youtube className="h-5 w-5 text-red-300" />,
        action: user.has_youtube ? (
          <ActionButton
            onClick={handleDisconnectYouTube}
            loading={isDisconnectingYouTube}
            disabled={isDisconnectingYouTube}
            variant="disconnect"
          >
            Desconectar YouTube
          </ActionButton>
        ) : (
          <ActionButton onClick={handleConnectYouTube} loading={isLinkingYouTube} disabled={isLinkingYouTube}>
            Vincular YouTube
          </ActionButton>
        ),
      },
      {
        id: "tiktok",
        title: "TikTok",
        description: "Ative sua conta para aproveitar fluxos visuais, vídeos curtos e distribuição rápida.",
        connected: !!user.has_tiktok,
        accountLabel: user.tiktok_display_name || (user.tiktok_username ? `@${user.tiktok_username}` : user.has_tiktok ? "Conta vinculada" : null),
        accentClassName: user.has_tiktok ? "text-white/85" : "text-white/55",
        iconWrapClassName: "border-white/12 bg-white/[0.04]",
        icon: <Sparkles className="h-5 w-5 text-white/90" />,
        action: user.has_tiktok ? (
          <ActionButton
            onClick={handleDisconnectTikTok}
            loading={isDisconnectingTikTok}
            disabled={isDisconnectingTikTok}
            variant="disconnect"
          >
            Desconectar TikTok
          </ActionButton>
        ) : (
          <ActionButton onClick={handleConnectTikTok} loading={isLinkingTikTok} disabled={isLinkingTikTok}>
            Vincular TikTok
          </ActionButton>
        ),
      },
      {
        id: "google-business",
        title: "Perfil de Empresa Google",
        description: "Conecte sua ficha para ações locais, serviços, produtos e gestão de presença.",
        connected: !!user.has_google_business_profile,
        accountLabel:
          user.google_business_location_title || user.google_business_account_display_name || (user.has_google_business_profile ? "Conta vinculada" : null),
        accentClassName: user.has_google_business_profile ? "text-cyan-300" : "text-white/55",
        iconWrapClassName: "border-cyan-500/20 bg-cyan-500/10",
        icon: <Building2 className="h-5 w-5 text-cyan-300" />,
        action: user.has_google_business_profile ? (
          <ActionButton
            onClick={handleDisconnectGoogleBusiness}
            loading={isDisconnectingGoogleBusiness}
            disabled={isDisconnectingGoogleBusiness}
            variant="disconnect"
          >
            Desconectar Perfil Google
          </ActionButton>
        ) : (
          <ActionButton
            onClick={handleConnectGoogleBusiness}
            loading={isLinkingGoogleBusiness}
            disabled={isLinkingGoogleBusiness}
          >
            Vincular Perfil Google
          </ActionButton>
        ),
      },
    ],
    [
      handleConnectFacebook,
      handleConnectGoogleBusiness,
      handleConnectLinkedIn,
      handleConnectTikTok,
      handleConnectYouTube,
      handleDisconnectFacebook,
      handleDisconnectGoogleBusiness,
      handleDisconnectInstagram,
      handleDisconnectTikTok,
      handleDisconnectYouTube,
      isDisconnectingFacebook,
      isDisconnectingGoogleBusiness,
      isDisconnectingInstagram,
      isDisconnectingTikTok,
      isDisconnectingYouTube,
      isLinking,
      isLinkingFacebook,
      isLinkingGoogleBusiness,
      isLinkingTikTok,
      isLinkingYouTube,
      user.facebook_page_name,
      user.facebook_page_username,
      user.google_business_account_display_name,
      user.google_business_location_title,
      user.has_facebook,
      user.has_google_business_profile,
      user.has_instagram,
      user.has_linkedin,
      user.has_tiktok,
      user.has_youtube,
      user.instagram_username,
      user.tiktok_display_name,
      user.tiktok_username,
      user.youtube_channel_handle,
      user.youtube_channel_title,
    ],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Minha conta</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/60">
            Gerencie seu perfil e organize as integrações da sua conta em uma interface mais limpa, com status visual rápido e ações objetivas.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(64,129,255,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_30%)]" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-2xl font-bold text-slate-950 shadow-[0_12px_30px_rgba(54,124,255,0.35)] transition-transform duration-300 hover:scale-[1.02]">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold text-white">{user.name || "Sem nome"}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white/55">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Conta ativa
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75">
                  {connectedCount} integrações conectadas
                </span>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/15">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_36%)]" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex rounded-2xl border border-cyan-500/15 bg-cyan-500/10 p-3 text-cyan-300">
                  <Coins className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">Créditos de IA</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
                  Seus créditos são usados para executar agentes de autoridade. Você recebe <span className="font-semibold text-white">100 novos créditos</span> automaticamente todos os dias.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                Renovação diária
              </span>
            </div>

            <div className="relative mt-6 rounded-[24px] border border-white/10 bg-black/20 p-5 transition-all duration-300 hover:bg-black/25">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">Disponível agora</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-5xl font-semibold leading-none text-white">{user.credits}</p>
                <p className="text-right text-sm leading-6 text-white/50">Uso contínuo para agentes, fluxos e tarefas do painel.</p>
              </div>
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Integrações da conta</h2>
              <p className="text-sm leading-6 text-white/55">
                Visual mais leve, status claros e ações padronizadas para todas as conexões.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((integration) => (
              <IntegrationCard key={integration.id} {...integration} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
