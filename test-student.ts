import { createStudentProfile, getProfilesByClassId } from "./server/db";

async function testStudent() {
  console.log("--- Iniciando teste de criação de aluno ---");
  const classId = 1;
  const profileName = "Aluno de Teste " + Date.now();

  try {
    console.log(`1. Criando aluno: "${profileName}" na turma ${classId}...`);
    const createResult = await createStudentProfile(
      classId,
      profileName,
      "media",
      "media",
      "guiado",
      "nao",
      "normal",
      "Observação de teste"
    );
    console.log("Resultado da criação:", JSON.stringify(createResult, null, 2));

    console.log(`2. Listando alunos para a turma ${classId}...`);
    const profiles = await getProfilesByClassId(classId);
    console.log(`Total de alunos encontrados: ${profiles.length}`);
    
    const found = profiles.find(p => p.profileName === profileName);
    if (found) {
      console.log("SUCESSO: O aluno criado foi encontrado na lista!");
      console.log("Dados do aluno:", JSON.stringify(found, null, 2));
    } else {
      console.log("ERRO: O aluno criado NÃO foi encontrado na lista.");
      console.log("Lista atual:", JSON.stringify(profiles, null, 2));
    }
  } catch (error) {
    console.error("ERRO durante o teste:", error);
  }
}

testStudent();
