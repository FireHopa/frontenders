import * as React from "react";

// Importando as imagens usando caminhos relativos
import rosaImg from "../icons/rosa.png";
import pepeImg from "../icons/pepe.png";
import monicaImg from "../icons/monica.png";
import liamImg from "../icons/liam.png";
import georgeImg from "../icons/george.png";
import miaImg from "../icons/mia.png";
import douglasImg from "../icons/douglas.png";
import patriciaImg from "../icons/patricia.png";
import alexImg from "../icons/alex.png";
import lucasImg from "../icons/lucas.png";

export type AuthorityAgentDef = {
  key: string;
  name: string;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

// Componente Mágico: Expande para cobrir o azul e dá zoom no rosto
const createIcon = (src: string) => {
  return function CustomImageIcon({ className }: { className?: string }) {
    return (
      <div 
        className={className} 
        style={{ 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          // Garante que a div base tenha dimensões caso falte classe no pai
          minWidth: '1em',
          minHeight: '1em'
        }}
      >
        {/* Máscara que cresce visualmente para "engolir" a borda azul do pai */}
        <div 
          style={{ 
            width: '100%',
            height: '100%',
            borderRadius: '50%', 
            overflow: 'hidden', 
            position: 'relative',
            zIndex: 10,
            // Esse scale(2.0) dobra o tamanho visual do ícone para fora, cobrindo todo o azul do fundo!
            // Se ainda faltar, mude para 2.2. Se ficar muito grande, reduza para 1.8
            transform: 'scale(2.0)' 
          }}
        >
          <img 
            src={src} 
            alt="Ícone do Agente" 
            style={{ 
              width: '100%',  
              height: '100%', 
              objectFit: 'cover', 
              objectPosition: 'top center', // Mantém o foco na parte de cima (rosto)
              transform: 'scale(1.25)'      // Mantém aquele zoom maroto pra não cortar
            }} 
          />
        </div>
      </div>
    );
  };
};

export const AUTHORITY_AGENTS: AuthorityAgentDef[] = [
  { 
    key: "site", 
    name: "Rosa", 
    label: "Agente Site", 
    desc: "Kit de autoridade para site (páginas, FAQ, prova social).", 
    Icon: createIcon(rosaImg) 
  },
  { 
    key: "google_business_profile", 
    name: "Pepe", 
    label: "Agente Perfil de Empresa no Google", 
    desc: "Otimização total do GBP (descrições, posts, avaliações).", 
    Icon: createIcon(pepeImg) 
  },
  { 
    key: "social_proof", 
    name: "Lucas", 
    label: "Agente Prova social e reputação", 
    desc: "Scripts e ativos para coletar e publicar prova social.", 
    Icon: createIcon(lucasImg) 
  },
  { 
    key: "decision_content", 
    name: "Douglas", 
    label: "Agente Conteúdos de decisão", 
    desc: "Conteúdos de fundo de funil que fecham sem prometer o impossível.", 
    Icon: createIcon(douglasImg) 
  },
  { 
    key: "instagram", 
    name: "George", 
    label: "Agente Instagram", 
    desc: "Plano de 30 dias + bio + Reels + carrosséis + stories.", 
    Icon: createIcon(georgeImg) 
  },
  { 
    key: "linkedin", 
    name: "Monica", 
    label: "Agente LinkedIn", 
    desc: "Perfil + posts + prospecção + cases (sem inventar números).", 
    Icon: createIcon(monicaImg) 
  },
  { 
    key: "youtube", 
    name: "Liam", 
    label: "Agente YouTube", 
    desc: "Ideias, roteiros e SEO para autoridade em vídeo.", 
    Icon: createIcon(liamImg) 
  },
  { 
    key: "tiktok", 
    name: "Mia", 
    label: "Agente TikTok", 
    desc: "30 ideias de vídeos curtos (autoridade, prova, decisão).", 
    Icon: createIcon(miaImg) 
  },
  { 
    key: "cross_platform_consistency", 
    name: "Patrícia", 
    label: "Agente Consistência", 
    desc: "Padronização de mensagens e identidade entre canais.", 
    Icon: createIcon(patriciaImg) 
  },
  { 
    key: "external_mentions", 
    name: "Alex", 
    label: "Agente Menções externas", 
    desc: "Plano de PR e citações externas (portais, parcerias, releases).", 
    Icon: createIcon(alexImg) 
  }
];

export function authorityAgentByKey(key?: string | null) {
  return AUTHORITY_AGENTS.find((a) => a.key === key);
}