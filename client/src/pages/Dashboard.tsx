import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");

  // Queries
  const { data: classes, isLoading, refetch } = trpc.classes.list.useQuery();

  // Mutations
  const createClassMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      toast.success("Turma criada com sucesso!");
      setNewClassName("");
      setNewClassDescription("");
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar turma: ${error.message}`);
    },
  });

  const deleteClassMutation = trpc.classes.delete.useMutation({
    onSuccess: () => {
      toast.success("Turma deletada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar turma: ${error.message}`);
    },
  });

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast.error("Nome da turma é obrigatório");
      return;
    }

    createClassMutation.mutate({
      name: newClassName,
      description: newClassDescription,
    });
  };

  const handleDeleteClass = (classId: number) => {
    if (confirm("Tem certeza que deseja deletar esta turma?")) {
      deleteClassMutation.mutate({ classId });
    }
  };

  const handleClassClick = (classId: number) => {
    navigate(`/class/${classId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não autenticado. Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Inclusão IA</h1>
          <p className="text-gray-600">Adaptação Automática de Materiais Didáticos</p>
        </div>

        {/* Welcome Section */}
        <Card className="mb-8 bg-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Bem-vindo, {user?.name || "Professor"}!</CardTitle>
            <CardDescription>
              Gerencie suas turmas e crie perfis de alunos para adaptar materiais didáticos automaticamente.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Create Class Button */}
        <div className="mb-8">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Turma</DialogTitle>
                <DialogDescription>
                  Adicione uma nova turma para começar a adaptar materiais.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="class-name">Nome da Turma</Label>
                  <Input
                    id="class-name"
                    placeholder="Ex: Turma 801 - 2026"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="class-description">Descrição (opcional)</Label>
                  <Textarea
                    id="class-description"
                    placeholder="Ex: Turma de Biologia do 8º ano"
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateClass}
                  disabled={createClassMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {createClassMutation.isPending ? "Criando..." : "Criar Turma"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Minhas Turmas</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">Carregando turmas...</p>
            </div>
          ) : classes && classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <Card
                  key={cls.id}
                  className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleClassClick(cls.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <CardDescription>{cls.description || "Sem descrição"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/class/${cls.id}`);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Gerenciar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(cls.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-0 shadow-md">
              <CardContent className="pt-12 text-center">
                <p className="text-gray-600 mb-4">Você ainda não tem turmas criadas.</p>
                <Button
                  onClick={() => setIsOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Turma
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
