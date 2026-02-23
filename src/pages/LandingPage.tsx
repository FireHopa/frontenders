import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Particles } from "@/components/effects/Particles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MotionInView } from "@/components/motion/MotionInView";
import { RobotsMockGrid } from "@/components/landing/RobotsMockGrid";
import { ExplainerA3 } from "@/components/landing/ExplainerA3";
import { transitions } from "@/lib/motion";

export function LandingPage() {
  return (
    <div className="relative">
      {/* Hero background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-hero" />
      <Particles />

      <section className="py-10 md:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <MotionInView>
              <Badge variant="secondary" className="mb-4">
                Authority Robot Panel
              </Badge>
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                Crie um robô de autoridade em minutos.
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
                Uma jornada guiada para transformar conhecimento em instruções de alto impacto — prontas para
                aparecer, convencer e serem citadas por IA.
              </p>
            </MotionInView>

            <MotionInView delay={0.06} className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="accent" size="lg">
                <Link to="/journey">Começar Jornada</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/dashboard">Ver robôs criados</Link>
              </Button>
            </MotionInView>

            <MotionInView delay={0.12} className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
              <Card variant="glass" className="p-4">
                <div className="text-sm font-semibold">Progresso visível</div>
                <div className="mt-1 text-xs text-muted-foreground">Etapas, níveis e recompensas.</div>
              </Card>
              <Card variant="glass" className="p-4">
                <div className="text-sm font-semibold">Clareza estratégica</div>
                <div className="mt-1 text-xs text-muted-foreground">Perguntas que guiam decisões.</div>
              </Card>
              <Card variant="glass" className="p-4">
                <div className="text-sm font-semibold">Chat inteligente</div>
                <div className="mt-1 text-xs text-muted-foreground">Interaja com seu robô.</div>
              </Card>
            </MotionInView>
          </div>

          {/* Mock visual */}
          <MotionInView delay={0.08}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitions.slow}
              className="relative"
            >
              <div className="absolute -inset-6 -z-10 rounded-[32px] bg-surface opacity-60 blur-xl" />
              <RobotsMockGrid />
            </motion.div>
          </MotionInView>
        </div>
      </section>

      {/* AIO/AEO/GEO */}
      <section className="py-12 md:py-16">
        <MotionInView>
          <div className="mb-6 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Projetado para ser citado.</h2>
            <p className="mt-2 text-muted-foreground">
              Seu robô nasce com um padrão de escrita e estrutura que favorece consumo por IA, clareza e presença em respostas.
            </p>
          </div>
        </MotionInView>
        <ExplainerA3 />
      </section>

      {/* Scroll micro-animation teaser */}
      <section className="py-12 md:py-16">
        <MotionInView>
          <Card variant="glass" className="overflow-hidden">
            <div className="relative p-8">
              <div className="pointer-events-none absolute inset-0 bg-surface opacity-70" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">Nível 1</Badge>
                  <Badge variant="secondary">Identidade</Badge>
                  <Badge variant="outline">sem fricção</Badge>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Uma jornada que parece viva.</h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Avance por níveis, desbloqueie conquistas e veja seu robô ganhar forma em tempo real.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline">
                    <Link to="/journey">Iniciar agora</Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-google-blue/50 via-google-green/40 to-google-yellow/40" />
          </Card>
        </MotionInView>
      </section>
    </div>
  );
}

export default LandingPage;
