import { RobotMock } from "@/components/landing/RobotMock";
import { motion } from "framer-motion";
import { FileText, MapPin, Star, Stethoscope } from "lucide-react";

export function RobotsMockGrid() {
  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-[40px] bg-hero opacity-70 blur-2xl"
        animate={{ opacity: [0.55, 0.7, 0.55] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <div className="relative grid gap-4 sm:grid-cols-2">
        <RobotMock
          title="Bob"
          niche="Clínicas e serviços locais"
          vibe="preciso"
          tone="blue"
          icon={MapPin}
          creator={{ name: "Rafa Lima", role: "SEO & Growth" }}
          description="Encontra oportunidades locais e sugere conteúdos que geram contatos no WhatsApp."
        />

        <RobotMock
          title="B2Bot"
          niche="SaaS e consultorias"
          vibe="estratégico"
          tone="green"
          icon={FileText}
          creator={{ name: "Camila Rocha", role: "Content Lead" }}
          description="Transforma ideias e features em textos claros que ajudam a vender — sem enrolação."
        />

        <RobotMock
          title="Yula"
          niche="Infoprodutos premium"
          vibe="persuasivo"
          tone="red"
          icon={Star}
          creator={{ name: "Bruno Santos", role: "Copywriter" }}
          description="Organiza depoimentos reais e cria textos de oferta que passam confiança."
        />

        <RobotMock
          title="Lulu"
          niche="Saúde (conteúdo seguro)"
          vibe="confiável"
          tone="yellow"
          icon={Stethoscope}
          creator={{ name: "Dra. Luiza Moreira", role: "Revisão clínica" }}
          description="Produz conteúdo responsável, simples e seguro — sem promessas exageradas."
        />
      </div>
    </div>
  );
}
