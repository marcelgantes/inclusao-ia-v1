import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  if (loading || (isAuthenticated && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Inclusão IA</h1>
        <p className="text-xl text-gray-600 mb-8">
          Adaptação Automática de Materiais Didáticos para Alunos com Necessidades Especiais
        </p>
        <p className="text-gray-600 mb-12 max-w-xl mx-auto">
          Uma plataforma inteligente que adapta automaticamente materiais didáticos conforme as necessidades
          específicas de cada aluno, respeitando sua individualidade e promovendo verdadeira inclusão educacional.
        </p>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg"
        >
          Começar Agora
        </Button>
      </div>
    </div>
  );
}
