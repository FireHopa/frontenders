import * as React from "react";
import { BrainCircuit, ShieldCheck, Link2, Save } from "lucide-react";
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
    // Dá um scroll suave pro topo pra confirmar a ação pro usuário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // Ampliamos a largura máxima para 1600px para ocupar os espaços brancos em telas grandes
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-8 space-y-8 pb-32">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BrainCircuit className="h-10 w-10 text-google-blue" /> Núcleo da Empresa
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-3xl leading-relaxed">
            Preencha as informações centrais do seu negócio. Todos os 10 Agentes de Autoridade consumirão essas informações e os arquivos que você anexar para gerar os conteúdos mais precisos possíveis.
          </p>
        </div>
        
        <Button size="lg" variant="accent" onClick={saveCore} className="rounded-xl shadow-md h-12 px-8 text-base hidden md:flex">
          <Save className="h-5 w-5 mr-2" /> Salvar Tudo
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* LADO ESQUERDO: Formulário (Ocupa mais espaço agora) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
          <Card className="shadow-soft border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/10 pb-5">
              <CardTitle className="text-xl">Informações Base</CardTitle>
              <CardDescription className="text-sm">Os dados digitados aqui compõem a raiz de conhecimento da IA.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-10">
              {CORE_GROUPS.map(g => (
                <div key={g.title} className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                    <g.icon className="h-5 w-5 text-google-blue/70" /> 
                    <h3 className="font-bold text-base uppercase text-foreground/80 tracking-wide">{g.title}</h3>
                  </div>
                  
                  {/* Grid responsivo melhorado para não esticar muito os textareas */}
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {g.fields.map(f => (
                      <div key={f.key} className={cn("space-y-2", f.kind === 'textarea' ? "sm:col-span-2 xl:col-span-3" : "")}>
                        <label className="text-sm font-semibold text-foreground/90 pl-1">{f.label}</label>
                        {f.kind === 'input' ? (
                          <Input 
                            value={draft[f.key] || ""} 
                            onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))} 
                            className="rounded-xl shadow-sm bg-background h-11" 
                            placeholder={`Digite ${f.label.toLowerCase()}...`}
                          />
                        ) : (
                          <Textarea 
                            value={draft[f.key] || ""} 
                            onChange={e => setDraft(d => ({...d, [f.key]: e.target.value}))} 
                            className="rounded-xl min-h-[120px] shadow-sm bg-background resize-y" 
                            placeholder={`Descreva os detalhes de ${f.label.toLowerCase()} aqui...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-8 mt-8 border-t border-border/30 flex justify-end">
                <Button size="lg" variant="accent" onClick={saveCore} className="rounded-xl shadow-md h-14 px-10 text-base w-full sm:w-auto">
                  <Save className="h-5 w-5 mr-2" /> Salvar Informações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LADO DIREITO: Uploader (Fica fixo na tela "sticky" acompanhando o scroll) */}
        <div className="lg:col-span-4 xl:col-span-3 sticky top-6 space-y-6">
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