import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  uploadRobotKnowledgeFile, 
  uploadBusinessCoreKnowledgeFile,
  deleteRobotKnowledgeFile,
  deleteBusinessCoreKnowledgeFile
} from "@/services/robots";

interface KnowledgeUploaderProps {
  publicId: string;
  type: "robot" | "business-core";
  existingFilesJson?: string | null;
  onUploadSuccess?: () => void;
}

export function KnowledgeUploader({ publicId, type, existingFilesJson, onUploadSuccess }: KnowledgeUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadedFiles: Array<{ filename: string; uploaded_at: string }> = 
    existingFilesJson ? JSON.parse(existingFilesJson) : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ["pdf", "docx", "txt", "md", "csv"];
    const ext = file.name.split('.').pop()?.toLowerCase() || "";
    
    if (!validExtensions.includes(ext)) {
      toast.error("Formato inválido. Use PDF, DOCX, TXT, MD ou CSV.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo é muito grande. O limite é de 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      if (type === "robot") {
        await uploadRobotKnowledgeFile(publicId, file);
      } else {
        await uploadBusinessCoreKnowledgeFile(publicId, file);
      }
      toast.success(`Arquivo ${file.name} processado e aprendido com sucesso!`);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar arquivo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      setDeletingFile(filename);
      if (type === "robot") {
        await deleteRobotKnowledgeFile(publicId, filename);
      } else {
        await deleteBusinessCoreKnowledgeFile(publicId, filename);
      }
      toast.success("Arquivo removido do cérebro com sucesso!");
      if (onUploadSuccess) onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir arquivo.");
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <Card className="border-border/50 bg-muted/20 shadow-soft h-full flex flex-col">
      <CardHeader className="pb-4 border-b border-border/40 bg-background/50">
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="w-6 h-6 text-google-blue" />
          Base de Conhecimento
        </CardTitle>
        <CardDescription className="text-sm">
          Faça upload de PDFs, DOCX ou TXT para treinar a inteligência com materiais específicos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 flex-1 flex flex-col">
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 mb-6 flex-1">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
              Arquivos Atuais 
              <Badge variant="secondary" className="bg-background">{uploadedFiles.length}</Badge>
            </h4>
            
            {/* O max-h e overflow-y garantem que a lista role e não empurre a página infinitamente */}
            <div className="grid gap-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm bg-background p-3 rounded-xl border group min-w-0 transition-colors hover:border-google-blue/30 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#00D278] shrink-0" />
                  
                  {/* O min-w-0 aqui impede o nome do arquivo de quebrar a tela inteira! */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-semibold text-foreground truncate" title={f.filename}>
                      {f.filename}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Anexado em: {new Date(f.uploaded_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 text-[#FF5050] hover:text-[#FF5050] hover:bg-[rgba(255,80,80,0.15)] dark:hover:bg-red-950/30 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    disabled={deletingFile === f.filename}
                    onClick={() => handleDelete(f.filename)}
                    title="Excluir arquivo"
                  >
                    {deletingFile === f.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mt-auto pt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.csv"
          />
          <Button 
            variant="accent" 
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || deletingFile !== null}
            className="w-full rounded-xl shadow-sm h-14 text-base"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Lendo e processando arquivo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Anexar Novo Arquivo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}