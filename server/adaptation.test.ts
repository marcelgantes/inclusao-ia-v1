import { describe, it, expect } from "vitest";
import { validateProfile } from "./adaptation";
import type { StudentProfile } from "../drizzle/schema";

describe("adaptation", () => {
  describe("validateProfile", () => {
    it("should validate a complete profile", () => {
      const profile: StudentProfile = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: "passo_a_passo",
        dislexia: "sim",
        tipoLetra: "normal",
        observacoes: "Gosta de exemplos com animais",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validateProfile(profile)).toBe(true);
    });

    it("should reject profile with missing fragmentacao", () => {
      const profile: Partial<StudentProfile> = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: undefined,
        abstracao: "baixa",
        mediacao: "passo_a_passo",
        dislexia: "sim",
        tipoLetra: "normal",
      };

      expect(validateProfile(profile as StudentProfile)).toBe(false);
    });

    it("should reject profile with missing abstracao", () => {
      const profile: Partial<StudentProfile> = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: undefined,
        mediacao: "passo_a_passo",
        dislexia: "sim",
        tipoLetra: "normal",
      };

      expect(validateProfile(profile as StudentProfile)).toBe(false);
    });

    it("should reject profile with missing mediacao", () => {
      const profile: Partial<StudentProfile> = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: undefined,
        dislexia: "sim",
        tipoLetra: "normal",
      };

      expect(validateProfile(profile as StudentProfile)).toBe(false);
    });

    it("should reject profile with missing dislexia", () => {
      const profile: Partial<StudentProfile> = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: "passo_a_passo",
        dislexia: undefined,
        tipoLetra: "normal",
      };

      expect(validateProfile(profile as StudentProfile)).toBe(false);
    });

    it("should reject profile with missing tipoLetra", () => {
      const profile: Partial<StudentProfile> = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: "passo_a_passo",
        dislexia: "sim",
        tipoLetra: undefined,
      };

      expect(validateProfile(profile as StudentProfile)).toBe(false);
    });

    it("should accept all valid fragmentacao values", () => {
      const baseProfile: StudentProfile = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "baixa",
        abstracao: "baixa",
        mediacao: "autonomo",
        dislexia: "nao",
        tipoLetra: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validateProfile({ ...baseProfile, fragmentacao: "baixa" })).toBe(true);
      expect(validateProfile({ ...baseProfile, fragmentacao: "media" })).toBe(true);
      expect(validateProfile({ ...baseProfile, fragmentacao: "alta" })).toBe(true);
    });

    it("should accept all valid abstracao values", () => {
      const baseProfile: StudentProfile = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "alta",
        mediacao: "autonomo",
        dislexia: "nao",
        tipoLetra: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validateProfile({ ...baseProfile, abstracao: "alta" })).toBe(true);
      expect(validateProfile({ ...baseProfile, abstracao: "media" })).toBe(true);
      expect(validateProfile({ ...baseProfile, abstracao: "baixa" })).toBe(true);
      expect(validateProfile({ ...baseProfile, abstracao: "nao_abstrai" })).toBe(true);
    });

    it("should accept all valid mediacao values", () => {
      const baseProfile: StudentProfile = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: "autonomo",
        dislexia: "nao",
        tipoLetra: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validateProfile({ ...baseProfile, mediacao: "autonomo" })).toBe(true);
      expect(validateProfile({ ...baseProfile, mediacao: "guiado" })).toBe(true);
      expect(validateProfile({ ...baseProfile, mediacao: "passo_a_passo" })).toBe(true);
    });

    it("should accept all valid dislexia values", () => {
      const baseProfile: StudentProfile = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: "autonomo",
        dislexia: "sim",
        tipoLetra: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(validateProfile({ ...baseProfile, dislexia: "sim" })).toBe(true);
      expect(validateProfile({ ...baseProfile, dislexia: "nao" })).toBe(true);
    });

    it("should accept all valid tipoLetra values", () => {
      const baseProfile: StudentProfile = {
        id: 1,
        classId: 1,
        profileName: "Aluno A",
        fragmentacao: "media",
        abstracao: "baixa",
        mediacao: "autonomo",
        dislexia: "nao",
        tipoLetra: "bastao",
      };

      expect(validateProfile({ ...baseProfile, tipoLetra: "bastao" })).toBe(true);
      expect(validateProfile({ ...baseProfile, tipoLetra: "normal" })).toBe(true);
    });
  });
});
