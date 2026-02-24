// src/components/robot/KnowledgeUploader.tsx
import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { uploadRobotKnowledgeFile, uploadBusinessCoreKnowledgeFile } from "@/services/robots";

interface KnowledgeUploaderProps {
  publicId: string;
  type: "robot" | "business-core";
  existingFilesJson?: string | null;
  onUploadSuccess?: () => void;
}

export function KnowledgeUploader({ publicId, type, existingFilesJson, onUploadSuccess }: KnowledgeUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fazer o parse da lista de arquivos que já vieram do banco
  const uploadedFiles: Array<{ filename: string; uploaded_at: string }> = 
    existingFilesJson ? JSON.parse(existingFilesJson) : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica de extensão e tamanho (max 5MB aqui como exemplo)
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

  return (
    <Card className="border-dashed bg-muted/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Base de Conhecimento ({type === "robot" ? "Robô" : "Núcleo"})
        </CardTitle>
        <CardDescription>
          Faça upload de PDFs, DOCX ou TXT para treinar a inteligência com materiais específicos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de Arquivos Já Carregados */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Arquivos Atuais:</h4>
            <div className="grid gap-2">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-background p-2 rounded-md border">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-medium truncate">{f.filename}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(f.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Upload Escondendo o Input Real */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.csv"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lendo e extraindo texto...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Adicionar Arquivo de Instrução
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}