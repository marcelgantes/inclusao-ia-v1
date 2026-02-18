import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface MaterialUploadProps {
  classId: number;
  onUploadSuccess: () => void;
}

export function MaterialUpload({ classId, onUploadSuccess }: MaterialUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.materials.upload.useMutation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      validateAndSelectFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      validateAndSelectFile(files[0]);
    }
  };

  const validateAndSelectFile = (file: File) => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error("Apenas arquivos PDF e DOCX são aceitos");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to S3 first
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("classId", String(classId));

      const uploadResponse = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || "Erro ao fazer upload");
      }

      const uploadData = await uploadResponse.json();

      // Save material metadata via tRPC
      await uploadMutation.mutateAsync({
        classId,
        fileName: uploadData.fileName || selectedFile.name,
        fileType: uploadData.fileType || (selectedFile.type === "application/pdf" ? "pdf" : "docx"),
        fileUrl: uploadData.url,
        fileKey: uploadData.fileKey,
        fileSize: uploadData.fileSize || selectedFile.size,
      });

      toast.success("Material enviado com sucesso!");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar material");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 bg-gray-50 hover:border-indigo-400"
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Arraste seu arquivo aqui
          </p>
          <p className="text-sm text-gray-600 mb-4">
            ou clique para selecionar
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Formatos aceitos: PDF, DOCX (máximo 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="bg-white"
          >
            Selecionar Arquivo
          </Button>
        </div>
      ) : (
        <Card className="bg-white border-indigo-200 border-2">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <FileText className="w-10 h-10 text-indigo-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                disabled={isUploading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Material
                  </>
                )}
              </Button>
              <Button
                onClick={handleClear}
                disabled={isUploading}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
