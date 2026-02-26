import * as React from "react";
import { BrainCircuit, ShieldCheck, Link2, Save, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { KnowledgeUploader } from "@/components/robot/KnowledgeUploader";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/robots";

const CORE_GROUPS = [
  { title: "Fundação", icon: BrainCircuit, fields: [
      { key: "company_name", label: "Empresa", kind: "input" },
      { key: "city_state", label: "Local", kind: "input" },
      { key: "main_audience", label: "Público", kind: "textarea" },
      { key: "services_products", label: "Oferta (Serviços/Produtos)", kind: "textarea" },
  ]},
  { title: "Regras e Provas", icon: ShieldCheck, fields: [
      { key: "real_differentials", label: "Diferenciais Reais", kind: "textarea" },
      { key: "restrictions", label: "Restrições (O que não falar)", kind: "textarea" },
      { key: "forbidden_content", label: "Conteúdo Proibido", kind: "textarea" },
      { key: "reviews", label: "Onde ficam suas Avaliações?", kind: "textarea" },
      { key: "testimonials", label: "Depoimentos de Clientes", kind: "textarea" },
      { key: "usable_links_texts", label: "Links ou Textos Úteis", kind: "textarea" },
  ]},
  { title: "Ecossistema Digital", icon: Link2, fields: [
      { key: "site", label: "Site Oficial", kind: "input" },
      { key: "instagram", label: "Instagram (@)", kind: "input" },
      { key: "linkedin", label: "LinkedIn", kind: "input" },
      { key: "youtube", label: "YouTube", kind: "input" },
      { key: "tiktok", label: "TikTok", kind: "input" },
  ]},
];

const STORAGE_KEY = "ori_authority_nucleus_v1";

export default function AuthorityNucleusPage() {
  const [draft, setDraft] = React.useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });

  const { data: coreData, refetch } = useQuery({
    queryKey: ["business-core", "business-core-global"],
    queryFn: () => api.robots.businessCore.get("business-core-global"),
  });

  const saveCore = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    toastSuccess("Núcleo da Empresa salvo com sucesso!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-32">
      
      {/* NOVO CABEÇALHO HERO COM GRADIENTE SUAVE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-google-blue/5 rounded-full blur-3xl -z-10 transform translate-x-1/3 -translate-y-1/3"></div>
        
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-google-blue/10 text-google-blue text-[11px] font-bold tracking-widest uppercase mb-4">
            <Rocket className="w-3.5 h-3.5" /> Configuração Global
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Núcleo da Empresa
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
            Preencha a inteligência central do negócio. Todos os seus Agentes de Autoridade consumirão essas informações para gerar conteúdos precisos.
          </p>
        </div>
        
        <Button size="lg" onClick={saveCore} className="rounded-full shadow-lg hover:shadow-xl transition-all h-12 px-8 text-base bg-google-blue text-white hover:bg-google-blue/90 hidden md:flex font-semibold">
          <Save className="h-5 w-5 mr-2" /> Salvar Tudo
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* LADO ESQUERDO: Cards Separados por Grupo */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-8">
          {CORE_GROUPS.map((g) => (
            <Card key={g.title} className="shadow-sm border-border/50 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-background rounded-xl shadow-sm border border-border/50">
                    <g.icon className="h-5 w-5 text-google-blue" /> 
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">{g.title}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Configure os parâmetros desta categoria.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 md:p-8">
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-8">
                  {g.fields.map(f => (
                    <div key={f.key} className={cn("space-y-2.5", f.kind === 'textarea' ? "sm:col-span-2" : "")}>
                      <label className="text-sm font-semibold text-foreground/90 pl-1">{f.label}</label>
                      {f.kind === 'input' ? (
                        <Input 
                          value={draft[f.key] || ""} 
                          onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))} 
                          className="rounded-xl h-12 px-4 shadow-sm bg-background border-border/60 focus:ring-google-blue focus:border-google-blue transition-all" 
                          placeholder={`Digite ${f.label.toLowerCase()}...`}
                        />
                      ) : (
                        <Textarea 
                          value={draft[f.key] || ""} 
                          onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))} 
                          className="rounded-xl min-h-[120px] p-4 shadow-sm bg-background border-border/60 focus:ring-google-blue focus:border-google-blue transition-all resize-y leading-relaxed" 
                          placeholder={`Descreva os detalhes de ${f.label.toLowerCase()} aqui...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Botão de salvar no final (Aparece no Mobile) */}
          <div className="pt-4 flex justify-end md:hidden">
            <Button size="lg" onClick={saveCore} className="rounded-full shadow-lg h-14 px-10 text-base w-full bg-google-blue text-white font-semibold">
              <Save className="h-5 w-5 mr-2" /> Salvar Alterações
            </Button>
          </div>
        </div>

        {/* LADO DIREITO: Uploader com Design Limpo */}
        <div className="lg:col-span-4 xl:col-span-4 sticky top-6 space-y-6">
          <KnowledgeUploader 
            publicId="business-core-global"
            type="business-core" 
            existingFilesJson={coreData?.knowledge_files_json}
            onUploadSuccess={() => refetch()}
          />
        </div>
        
      </div>
    </div>
  );
}