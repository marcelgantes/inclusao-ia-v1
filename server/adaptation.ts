import { invokeLLM } from "./_core/llm";
import type { StudentProfile } from "../drizzle/schema";

/**
 * Builds adaptation rules based on student profile
 */
function buildAdaptationRules(profile: StudentProfile): string {
  const rules: string[] = [];

  // Fragmentação
  if (profile.fragmentacao === "baixa") {
    rules.push("- Mantenha o texto em estrutura contínua com parágrafos naturais.");
  } else if (profile.fragmentacao === "media") {
    rules.push("- Divida o conteúdo em parágrafos curtos (3-5 linhas). Cada parágrafo deve abordar um conceito específico.");
    rules.push("- Adicione títulos e subtítulos para organizar o conteúdo.");
  } else if (profile.fragmentacao === "alta") {
    rules.push("- Divida cada conceito em um bloco separado.");
    rules.push("- Use listas numeradas ou com bullets extensivamente.");
    rules.push("- Máximo de 2-3 linhas por bloco.");
    rules.push("- Cada seção deve ter um título descritivo.");
  }

  // Abstração
  if (profile.abstracao === "alta") {
    rules.push("- Inclua analogias contextualizadas e exemplos práticos avançados.");
    rules.push("- Permita inferências e pensamento abstrato.");
  } else if (profile.abstracao === "media") {
    rules.push("- Explique conceitos com exemplos simples e diretos.");
    rules.push("- Mantenha algum nível de abstração, mas com clareza.");
  } else if (profile.abstracao === "baixa") {
    rules.push("- Explicação passo a passo.");
    rules.push("- Linguagem direta e literal.");
    rules.push("- Sem inferências implícitas.");
    rules.push("- Cada conceito deve ser explicitado.");
  } else if (profile.abstracao === "nao_abstrai") {
    rules.push("- Mantenha tudo literal e factual.");
    rules.push("- Sem analogias, metáforas ou interpretações subjetivas.");
    rules.push("- Apenas fatos e definições.");
  }

  // Mediação
  if (profile.mediacao === "autonomo") {
    rules.push("- O material deve ser autoexplicativo.");
    rules.push("- Não inclua instruções adicionais ou perguntas de verificação.");
  } else if (profile.mediacao === "guiado") {
    rules.push("- Inclua instruções curtas (ex: 'Leia o parágrafo abaixo').");
    rules.push("- Adicione exemplos que orientem o aluno.");
    rules.push("- Sem excesso de detalhes.");
  } else if (profile.mediacao === "passo_a_passo") {
    rules.push("- Explique cada etapa em detalhe.");
    rules.push("- Após cada conceito, inclua uma pergunta de checagem (ex: 'Você entendeu que...?').");
    rules.push("- Adicione resumos do que foi aprendido.");
  }

  // Dislexia
  if (profile.dislexia === "sim") {
    rules.push("- Use fontes legíveis: Arial, Verdana ou OpenDyslexic.");
    rules.push("- Espaçamento entre linhas: 1.5 ou superior.");
    rules.push("- Frases curtas: máximo 15 palavras por frase.");
    rules.push("- Cores neutras: preto sobre branco ou azul claro.");
    rules.push("- Alto contraste entre texto e fundo.");
    rules.push("- Evite blocos de texto muito densos.");
  }

  // Tipo de Letra
  if (profile.tipoLetra === "bastao") {
    rules.push("- Use fonte de letra bastão (sem serifas) em todo o material. Exemplos: Arial, Verdana, Helvetica.");
  }

  return rules.join("\n");
}

/**
 * Adapts text content based on student profile using Gemini API
 */
export async function adaptTextContent(
  originalText: string,
  profile: StudentProfile
): Promise<string> {
  const adaptationRules = buildAdaptationRules(profile);

  const systemPrompt = `Você é um especialista em educação inclusiva e adaptação de materiais didáticos.

Seu objetivo é adaptar o material didático abaixo conforme o perfil específico do aluno, mantendo TODAS as informações do original.

IMPORTANTE: Adapte apenas linguagem, estrutura, clareza e acessibilidade. Nunca remova informações ou altere o significado do conteúdo.

Regras de Adaptação:
${adaptationRules}

${profile.observacoes ? `\nObservações Adicionais do Professor:\n${profile.observacoes}` : ""}

Gere o material adaptado completo:`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Material Original:\n\n${originalText}`,
      },
    ],
  });

  // Extract text from response
  const adaptedText =
    response.choices[0]?.message?.content || originalText;

  if (typeof adaptedText !== "string") {
    throw new Error("Unexpected response format from LLM");
  }

  return adaptedText;
}

/**
 * Validates that a profile has all required fields
 */
export function validateProfile(profile: StudentProfile): boolean {
  return !!(
    profile.fragmentacao &&
    profile.abstracao &&
    profile.mediacao &&
    profile.dislexia &&
    profile.tipoLetra
  );
}
