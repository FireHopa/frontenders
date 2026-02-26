import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
      toast.success(`Arquivo ${file.name} processado com sucesso!`);
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
    <Card className="border-border/60 bg-card shadow-lg flex flex-col h-fit">
      <CardHeader className="pb-5 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-lg flex items-center gap-2 font-bold">
          <div className="p-2 bg-google-blue/10 rounded-lg">
            <FileText className="w-5 h-5 text-google-blue" />
          </div>
          Base de Conhecimento
        </CardTitle>
        <CardDescription className="text-sm mt-1">
          Faça upload de PDFs, DOCX ou TXT para treinar a inteligência.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        {/* Nova Área de Upload (Dropzone visual) */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.csv"
          />
          <div className={cn(
            "w-full rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 hover:bg-muted/60 transition-all flex flex-col items-center justify-center gap-3 p-8 text-center",
            isUploading || deletingFile !== null ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:border-google-blue/50"
          )}>
            <div className="p-3 bg-background rounded-full shadow-sm">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-google-blue" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-google-blue transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isUploading ? "Processando arquivo..." : "Clique para anexar arquivo"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Máx. 5MB (PDF, DOCX, TXT)</p>
            </div>
          </div>
        </div>

        {/* Lista de Arquivos fica fixada abaixo, não empurra o botão pro fundo */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Arquivos Aprendidos
              </h4>
              <Badge variant="secondary" className="bg-muted text-xs rounded-full px-2">
                {uploadedFiles.length}
              </Badge>
            </div>
            
            <div className="grid gap-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border/50 group hover:border-google-blue/30 hover:shadow-sm transition-all min-w-0">
                  <div className="p-1.5 bg-green-500/10 rounded-md shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-semibold text-sm text-foreground truncate" title={f.filename}>
                      {f.filename}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {new Date(f.uploaded_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-600"
                    disabled={deletingFile === f.filename}
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.filename); }}
                    title="Excluir arquivo"
                  >
                    {deletingFile === f.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}