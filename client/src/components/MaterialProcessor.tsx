import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Download, CheckCircle, History } from "lucide-react";
import { toast } from "sonner";

interface MaterialProcessorProps {
  classId: number;
  materialId: number;
  materialName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialProcessor({
  classId,
  materialId,
  materialName,
  isOpen,
  onOpenChange,
}: MaterialProcessorProps) {
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [adaptedMaterials, setAdaptedMaterials] = useState<Array<{ id: number; profileId: number; url: string; fileName: string }>>([]);
  const [activeTab, setActiveTab] = useState<"process" | "history">("process");

  const { data: profiles } = trpc.profiles.listByClass.useQuery({ classId });
  const { data: history } = trpc.materials.history.useQuery({ materialId }, { enabled: isOpen });
  const processMutation = trpc.materials.process.useMutation();

  const handleProfileToggle = (profileId: number) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleProcess = async () => {
    if (selectedProfiles.length === 0) {
      toast.error("Selecione pelo menos um perfil");
      return;
    }

    try {
      const result = await processMutation.mutateAsync({
        materialId,
        profileIds: selectedProfiles,
      });

      if (result.success && result.adaptedMaterials.length > 0) {
        setAdaptedMaterials(result.adaptedMaterials);
        setActiveTab("process");
        toast.success(result.message || "Material adaptado com sucesso!");
      } else {
        toast.error("Nenhum material foi adaptado");
      }
    } catch (error) {
      console.error("Erro ao processar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar material");
    }
  };

  const handleDownload = async (adaptedMaterialId: number, fileName: string) => {
    try {
      const downloadRes = await fetch("/api/trpc/materials.getDownloadUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: { adaptedMaterialId } }),
      });
      const { result } = await downloadRes.json();
      const { url } = result.data;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download concluido!");
    } catch (error) {
      console.error("Erro ao baixar:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const handleClose = () => {
    setSelectedProfiles([]);
    setAdaptedMaterials([]);
    setActiveTab("process");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adaptar Material</DialogTitle>
          <DialogDescription>
            Material: {materialName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "process" | "history")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="process">Processar</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-4">
            {adaptedMaterials.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-semibold">Materiais adaptados com sucesso!</p>
                </div>
                <div className="space-y-2">
                  {adaptedMaterials.map((material) => {
                    const profileName = profiles?.find((p) => p.id === material.profileId)?.profileName || `Perfil ${material.profileId}`;
                    return (
                      <Card key={material.id} className="bg-green-50 border-green-200">
                        <CardContent className="pt-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{profileName}</p>
                            <p className="text-sm text-gray-600">{material.fileName}</p>
                          </div>
                          <Button
                            onClick={() => handleDownload(material.id, material.fileName)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <Button onClick={() => { setAdaptedMaterials([]); setSelectedProfiles([]); }} variant="outline" className="w-full">
                  Adaptar Novamente
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {profiles && profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <Card key={profile.id} className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`profile-${profile.id}`}
                              checked={selectedProfiles.includes(profile.id)}
                              onCheckedChange={() => handleProfileToggle(profile.id)}
                              disabled={processMutation.isPending}
                            />
                            <label
                              htmlFor={`profile-${profile.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="font-semibold text-gray-900">{profile.profileName}</p>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Frag:</span> {profile.fragmentacao}
                                </div>
                                <div>
                                  <span className="font-medium">Abst:</span> {profile.abstracao}
                                </div>
                                <div>
                                  <span className="font-medium">Med:</span> {profile.mediacao}
                                </div>
                                <div>
                                  <span className="font-medium">Dislexia:</span> {profile.dislexia}
                                </div>
                                <div>
                                  <span className="font-medium">Letra:</span> {profile.tipoLetra}
                                </div>
                              </div>
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>Nenhum perfil disponível. Crie perfis de alunos primeiro.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleProcess}
                    disabled={processMutation.isPending || selectedProfiles.length === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {processMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Adaptar ({selectedProfiles.length})
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClose}
                    disabled={processMutation.isPending}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {history && history.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item) => {
                  const profileName = profiles?.find((p) => p.id === item.profileId)?.profileName || `Perfil ${item.profileId}`;
                  return (
                    <Card key={item.id} className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{profileName}</p>
                            <p className="text-sm text-gray-600">{item.adaptedFileName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Adaptado em: {new Date(item.adaptedAt).toLocaleDateString("pt-BR")} às {new Date(item.adaptedAt).toLocaleTimeString("pt-BR")}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleDownload(item.id, item.adaptedFileName)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>Nenhuma adaptação anterior para este material.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
