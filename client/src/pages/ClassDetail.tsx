import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { MaterialUpload } from "@/components/MaterialUpload";
import { MaterialProcessor } from "@/components/MaterialProcessor";

function MaterialCard({ material, classId, onDelete }: any) {
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);

  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: onDelete,
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return (
    <>
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{material.originalFileName}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Enviado em {new Date(material.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsProcessorOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Adaptar
              </Button>
              <Button
                onClick={() => deleteMutation.mutate({ materialId: material.id })}
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MaterialProcessor
        classId={classId}
        materialId={material.id}
        materialName={material.originalFileName}
        isOpen={isProcessorOpen}
        onOpenChange={setIsProcessorOpen}
      />
    </>
  );
}

export default function ClassDetail() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/class/:classId");
  const classId = params?.classId ? parseInt(params.classId) : null;

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [fragmentacao, setFragmentacao] = useState<"baixa" | "media" | "alta">("media");
  const [abstracao, setAbstracao] = useState<"alta" | "media" | "baixa" | "nao_abstrai">("baixa");
  const [mediacao, setMediacao] = useState<"autonomo" | "guiado" | "passo_a_passo">("guiado");
  const [dislexia, setDislexia] = useState<"sim" | "nao">("nao");
  const [tipoLetra, setTipoLetra] = useState<"bastao" | "normal">("normal");
  const [observacoes, setObservacoes] = useState("");

  if (!classId) {
    return <div>Turma não encontrada</div>;
  }

  // Queries
  const { data: profiles, refetch: refetchProfiles } = trpc.profiles.listByClass.useQuery({
    classId,
  });

  const { data: materials, refetch: refetchMaterials } = trpc.materials.listByClass.useQuery({
    classId,
  });

  // Mutations
  const createProfileMutation = trpc.profiles.create.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso!");
      setProfileName("");
      setFragmentacao("media");
      setAbstracao("baixa");
      setMediacao("guiado");
      setDislexia("nao");
      setTipoLetra("normal");
      setObservacoes("");
      setIsProfileDialogOpen(false);
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(`Erro ao criar perfil: ${error.message}`);
    },
  });

  const deleteProfileMutation = trpc.profiles.delete.useMutation({
    onSuccess: () => {
      toast.success("Perfil deletado com sucesso!");
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar perfil: ${error.message}`);
    },
  });

  const handleCreateProfile = () => {
    if (!profileName.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }

    createProfileMutation.mutate({
      classId,
      profileName,
      fragmentacao,
      abstracao,
      mediacao,
      dislexia,
      tipoLetra,
      observacoes,
    });
  };

  const handleDeleteProfile = (profileId: number) => {
    if (confirm("Tem certeza que deseja deletar este perfil?")) {
      deleteProfileMutation.mutate({ profileId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento da Turma</h1>
            <p className="text-gray-600">Crie perfis de alunos e adapte materiais</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-0 shadow-md">
            <TabsTrigger value="profiles">Perfis de Alunos</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Perfis de Alunos</CardTitle>
                    <CardDescription>
                      Crie perfis anônimos com necessidades específicas para adaptar materiais
                    </CardDescription>
                  </div>
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Perfil de Aluno</DialogTitle>
                        <DialogDescription>
                          Configure os 5 parâmetros essenciais para adaptar materiais
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="profile-name">Nome do Perfil (anônimo)</Label>
                          <Input
                            id="profile-name"
                            placeholder="Ex: Aluno A, Perfil 1"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="fragmentacao">Fragmentação</Label>
                          <Select value={fragmentacao} onValueChange={(v: any) => setFragmentacao(v)}>
                            <SelectTrigger id="fragmentacao" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa - Texto contínuo e fluido</SelectItem>
                              <SelectItem value="media">Média - Parágrafos curtos e organizados</SelectItem>
                              <SelectItem value="alta">Alta - Blocos muito curtos com tópicos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="abstracao">Abstração</Label>
                          <Select value={abstracao} onValueChange={(v: any) => setAbstracao(v)}>
                            <SelectTrigger id="abstracao" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alta">Alta - Com analogias e exemplos avançados</SelectItem>
                              <SelectItem value="media">Média - Exemplos simples e diretos</SelectItem>
                              <SelectItem value="baixa">Baixa - Passo a passo e literal</SelectItem>
                              <SelectItem value="nao_abstrai">Não abstrai - Apenas fatos e definições</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="mediacao">Mediação</Label>
                          <Select value={mediacao} onValueChange={(v: any) => setMediacao(v)}>
                            <SelectTrigger id="mediacao" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="autonomo">Autônomo - Segue sozinho</SelectItem>
                              <SelectItem value="guiado">Guiado - Com instruções curtas</SelectItem>
                              <SelectItem value="passo_a_passo">Passo a Passo - Detalhado com checagens</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="dislexia">Dislexia</Label>
                          <Select value={dislexia} onValueChange={(v: any) => setDislexia(v)}>
                            <SelectTrigger id="dislexia" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim - Adaptar para dislexia</SelectItem>
                              <SelectItem value="nao">Não - Formatação padrão</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tipoLetra">Tipo de Letra</Label>
                          <Select value={tipoLetra} onValueChange={(v: any) => setTipoLetra(v)}>
                            <SelectTrigger id="tipoLetra" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bastao">Bastão (sem serifas)</SelectItem>
                              <SelectItem value="normal">Normal (padrão)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="observacoes">Observações (opcional)</Label>
                          <Textarea
                            id="observacoes"
                            placeholder="Ex: Gosta de exemplos com esportes, evitar alergias..."
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                          />
                        </div>

                        <Button
                          onClick={handleCreateProfile}
                          disabled={createProfileMutation.isPending}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          {createProfileMutation.isPending ? "Criando..." : "Criar Perfil"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {profiles && profiles.length > 0 ? (
                  <div className="space-y-3">
                    {profiles.map((profile) => (
                      <Card key={profile.id} className="bg-gray-50 border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{profile.profileName}</h3>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Fragmentação:</span> {profile.fragmentacao}
                                </div>
                                <div>
                                  <span className="font-medium">Abstração:</span> {profile.abstracao}
                                </div>
                                <div>
                                  <span className="font-medium">Mediação:</span> {profile.mediacao}
                                </div>
                                <div>
                                  <span className="font-medium">Dislexia:</span> {profile.dislexia}
                                </div>
                                <div>
                                  <span className="font-medium">Letra:</span> {profile.tipoLetra}
                                </div>
                              </div>
                              {profile.observacoes && (
                                <p className="mt-2 text-sm text-gray-600 italic">
                                  Obs: {profile.observacoes}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProfile(profile.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <p>Nenhum perfil criado ainda. Clique em "Novo Perfil" para começar.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Enviar Material</CardTitle>
                <CardDescription>
                  Faça upload de um material para adaptar conforme os perfis dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialUpload classId={classId} onUploadSuccess={() => refetchMaterials()} />
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Materiais Enviados</CardTitle>
                <CardDescription>
                  Selecione um material para adaptar para os perfis dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {materials && materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.map((material) => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        classId={classId}
                        onDelete={() => refetchMaterials()}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    <p>Nenhum material enviado ainda. Faça upload de um arquivo acima.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
