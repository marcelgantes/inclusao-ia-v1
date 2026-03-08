import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Download, FileText, Sparkles, ListChecks, UserCircle2, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { MaterialUpload } from "@/components/MaterialUpload";
import { MaterialProcessor } from "@/components/MaterialProcessor";

function MaterialCard({ material, classId, onDelete }: any) {
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const displayName = material.originalFileName || material.fileName;

  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: onDelete,
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const fileSize = material.fileSize
    ? `${(material.fileSize / 1024 / 1024).toFixed(2)} MB`
    : "Tamanho não informado";

  return (
    <>
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-800 font-medium uppercase">
                  {material.fileType}
                </span>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-gray-700">
                  {fileSize}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Enviado em {new Date(material.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                onClick={() => setIsProcessorOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Adaptar para perfis
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
        materialName={displayName}
        isOpen={isProcessorOpen}
        onOpenChange={setIsProcessorOpen}
      />
    </>
  );
}

export default function ClassDetail() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/class/:classId");
  const classId = params?.classId ? parseInt(params.classId) : null;

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("");
  const [fragmentacao, setFragmentacao] = useState<"baixa" | "media" | "alta">("media");
  const [abstracao, setAbstracao] = useState<"alta" | "media" | "baixa" | "nao_abstrai">("baixa");
  const [mediacao, setMediacao] = useState<"autonomo" | "guiado" | "passo_a_passo">("guiado");
  const [dislexia, setDislexia] = useState<"sim" | "nao">("nao");
  const [tipoLetra, setTipoLetra] = useState<"bastao" | "normal">("normal");
  const [observacoes, setObservacoes] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");

  if (!classId) {
    return <div>Turma não encontrada</div>;
  }

  const { data: profiles, refetch: refetchProfiles } = trpc.profiles.listByClass.useQuery({ classId });
  const { data: materials, refetch: refetchMaterials } = trpc.materials.listByClass.useQuery({ classId });

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

  const updateProfileMutation = trpc.profiles.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditProfileDialogOpen(false);
      setEditingProfileId(null);
      refetchProfiles();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
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

  const handleOpenEditProfile = (profile: any) => {
    setEditingProfileId(profile.id);
    setProfileName(profile.profileName);
    setFragmentacao(profile.fragmentacao);
    setAbstracao(profile.abstracao);
    setMediacao(profile.mediacao);
    setDislexia(profile.dislexia);
    setTipoLetra(profile.tipoLetra);
    setObservacoes(profile.observacoes || "");
    setIsEditProfileDialogOpen(true);
  };

  const handleUpdateProfile = () => {
    if (!editingProfileId) return;
    if (!profileName.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }

    updateProfileMutation.mutate({
      profileId: editingProfileId,
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

  const filteredMaterials = (materials || []).filter((material) =>
    material.fileName.toLowerCase().includes(materialSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento da Turma</h1>
            <p className="text-gray-600">Crie perfis de alunos e adapte materiais</p>
          </div>
        </div>

        <Card className="bg-white border-0 shadow-lg mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle2 className="w-5 h-5 text-indigo-600" />
              Perfil do Professor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{user?.name || "Professor(a)"}</p>
              <p className="text-sm text-gray-600">{user?.email || "E-mail não informado"}</p>
            </div>
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-0 shadow-md">
            <TabsTrigger value="profiles">Perfis de Alunos</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Perfis de Alunos</CardTitle>
                    <CardDescription>
                      Crie, edite e ajuste os parâmetros dos perfis sempre que necessário
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
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">Nome do Perfil (anônimo)</Label>
                          <Input
                            id="profile-name"
                            placeholder="Ex: Aluno A, Perfil 1"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fragmentação</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={fragmentacao} onChange={(e) => setFragmentacao(e.target.value as any)}>
                            <option value="baixa">Baixa - Texto contínuo e fluido</option>
                            <option value="media">Média - Parágrafos curtos e organizados</option>
                            <option value="alta">Alta - Blocos muito curtos com tópicos</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Abstração</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={abstracao} onChange={(e) => setAbstracao(e.target.value as any)}>
                            <option value="alta">Alta - Com analogias e exemplos avançados</option>
                            <option value="media">Média - Exemplos simples e diretos</option>
                            <option value="baixa">Baixa - Passo a passo e literal</option>
                            <option value="nao_abstrai">Não abstrai - Apenas fatos e definições</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Mediação</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={mediacao} onChange={(e) => setMediacao(e.target.value as any)}>
                            <option value="autonomo">Autônomo - Segue sozinho</option>
                            <option value="guiado">Guiado - Com instruções curtas</option>
                            <option value="passo_a_passo">Passo a Passo - Detalhado com checagens</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Dislexia</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={dislexia} onChange={(e) => setDislexia(e.target.value as any)}>
                            <option value="sim">Sim - Adaptar para dislexia</option>
                            <option value="nao">Não - Formatação padrão</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Letra</Label>
                          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={tipoLetra} onChange={(e) => setTipoLetra(e.target.value as any)}>
                            <option value="bastao">Bastão (sem serifas)</option>
                            <option value="normal">Normal (padrão)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="observacoes">Observações (opcional)</Label>
                          <Textarea id="observacoes" placeholder="Ex: Gosta de exemplos com esportes, evitar alergias..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
                        </div>

                        <Button onClick={handleCreateProfile} disabled={createProfileMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4">
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{profile.profileName}</h3>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-sm text-gray-600">
                                <div><span className="font-medium">Fragmentação:</span> {profile.fragmentacao}</div>
                                <div><span className="font-medium">Abstração:</span> {profile.abstracao}</div>
                                <div><span className="font-medium">Mediação:</span> {profile.mediacao}</div>
                                <div><span className="font-medium">Dislexia:</span> {profile.dislexia}</div>
                                <div><span className="font-medium">Letra:</span> {profile.tipoLetra}</div>
                              </div>
                              {profile.observacoes && <p className="mt-2 text-sm text-gray-600 italic">Obs: {profile.observacoes}</p>}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditProfile(profile)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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

          <TabsContent value="materials" className="space-y-4">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-indigo-600" />
                  Fluxo simples para adaptar materiais
                </CardTitle>
                <CardDescription>
                  Pensado para uso rápido por professores: 1) enviar arquivo, 2) clicar em adaptar, 3) baixar material pronto.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-indigo-50 p-3 text-sm"><strong>1. Envie</strong><br />PDF ou DOCX de até 10MB.</div>
                <div className="rounded-lg border bg-blue-50 p-3 text-sm"><strong>2. Adapte</strong><br />Escolha os perfis de alunos e processe.</div>
                <div className="rounded-lg border bg-green-50 p-3 text-sm"><strong>3. Baixe</strong><br />Faça download dos arquivos adaptados.</div>
              </CardContent>
            </Card>

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
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Materiais Enviados ({materials?.length || 0})
                </CardTitle>
                <CardDescription>
                  Selecione um material para adaptar para os perfis dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="Buscar material pelo nome..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                  />
                </div>
                {filteredMaterials.length > 0 ? (
                  <div className="space-y-3">
                    {filteredMaterials.map((material) => (
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
                    <p>
                      {materials && materials.length > 0
                        ? "Nenhum material encontrado para essa busca."
                        : 'Nenhum material enviado ainda. Faça upload de um arquivo acima.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Perfil do Aluno</DialogTitle>
              <DialogDescription>Atualize os parâmetros sempre que necessário.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Perfil</Label>
                <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Fragmentação</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={fragmentacao} onChange={(e) => setFragmentacao(e.target.value as any)}>
                  <option value="baixa">Baixa - Texto contínuo e fluido</option>
                  <option value="media">Média - Parágrafos curtos e organizados</option>
                  <option value="alta">Alta - Blocos muito curtos com tópicos</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Abstração</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={abstracao} onChange={(e) => setAbstracao(e.target.value as any)}>
                  <option value="alta">Alta - Com analogias e exemplos avançados</option>
                  <option value="media">Média - Exemplos simples e diretos</option>
                  <option value="baixa">Baixa - Passo a passo e literal</option>
                  <option value="nao_abstrai">Não abstrai - Apenas fatos e definições</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Mediação</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={mediacao} onChange={(e) => setMediacao(e.target.value as any)}>
                  <option value="autonomo">Autônomo - Segue sozinho</option>
                  <option value="guiado">Guiado - Com instruções curtas</option>
                  <option value="passo_a_passo">Passo a Passo - Detalhado com checagens</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Dislexia</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={dislexia} onChange={(e) => setDislexia(e.target.value as any)}>
                  <option value="sim">Sim - Adaptar para dislexia</option>
                  <option value="nao">Não - Formatação padrão</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Letra</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={tipoLetra} onChange={(e) => setTipoLetra(e.target.value as any)}>
                  <option value="bastao">Bastão (sem serifas)</option>
                  <option value="normal">Normal (padrão)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>

              <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {updateProfileMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
