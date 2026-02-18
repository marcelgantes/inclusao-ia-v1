import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createClass,
  getClassesByUserId,
  updateClass,
  deleteClass,
  createStudentProfile,
  getProfilesByClassId,
  updateStudentProfile,
  deleteStudentProfile,
  createMaterial,
  getMaterialsByClassId,
  deleteMaterial,
  getProfileById,
  getMaterialById,
  createAdaptedMaterial,
  getAdaptedMaterialsByMaterialId,
  getAdaptedMaterialById,
} from "./db";
import { adaptTextContent, validateProfile } from "./adaptation";
import { extractTextFromPDF, extractTextFromDOCX, generatePDFFromText, generateDOCXFromText } from "./document-processor";
import { storagePut, storageGet } from "./storage";
import axios from "axios";

export const appRouter = router({
  system: systemRouter,
  
  classes: router({
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const result = await createClass(ctx.user.id, input.name, input.description);
        return { success: true, classId: result.insertId };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClassesByUserId(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({ classId: z.number(), name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await updateClass(input.classId, input.name, input.description);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClass(input.classId);
        return { success: true };
      }),
  }),

  profiles: router({
    create: protectedProcedure
      .input(
        z.object({
          classId: z.number(),
          profileName: z.string().min(1),
          fragmentacao: z.enum(["baixa", "media", "alta"]),
          abstracao: z.enum(["alta", "media", "baixa", "nao_abstrai"]),
          mediacao: z.enum(["autonomo", "guiado", "passo_a_passo"]),
          dislexia: z.enum(["sim", "nao"]),
          tipoLetra: z.enum(["bastao", "normal"]),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createStudentProfile(
          input.classId,
          input.profileName,
          input.fragmentacao,
          input.abstracao,
          input.mediacao,
          input.dislexia,
          input.tipoLetra,
          input.observacoes
        );
        const profileId = (result as any).insertId || (result as any)[0]?.insertId;
        return { success: true, profileId };
      }),
    listByClass: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getProfilesByClassId(input.classId);
      }),
    update: protectedProcedure
      .input(
        z.object({
          profileId: z.number(),
          profileName: z.string().min(1).optional(),
          fragmentacao: z.enum(["baixa", "media", "alta"]).optional(),
          abstracao: z.enum(["alta", "media", "baixa", "nao_abstrai"]).optional(),
          mediacao: z.enum(["autonomo", "guiado", "passo_a_passo"]).optional(),
          dislexia: z.enum(["sim", "nao"]).optional(),
          tipoLetra: z.enum(["bastao", "normal"]).optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { profileId, ...updates } = input;
        await updateStudentProfile(profileId, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteStudentProfile(input.profileId);
        return { success: true };
      }),
  }),

  materials: router({
    upload: protectedProcedure
      .input(
        z.object({
          classId: z.number(),
          fileName: z.string(),
          fileType: z.enum(["pdf", "docx"]),
          fileUrl: z.string(),
          fileKey: z.string(),
          fileSize: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createMaterial(
          input.classId,
          input.fileName,
          input.fileType,
          input.fileUrl,
          input.fileKey,
          input.fileSize
        );
        return { success: true, materialId: result.insertId };
      }),
    listByClass: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getMaterialsByClassId(input.classId);
      }),
    delete: protectedProcedure
      .input(z.object({ materialId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMaterial(input.materialId);
        return { success: true };
      }),
    process: protectedProcedure
      .input(
        z.object({
          materialId: z.number(),
          profileIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        const material = await getMaterialById(input.materialId);
        if (!material) {
          throw new Error("Material not found");
        }

        let extractedText = "";
        try {
          const { url } = await storageGet(material.fileKey);
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const buffer = response.data;

          if (material.fileType === "pdf") {
            extractedText = await extractTextFromPDF(Buffer.from(buffer));
          } else if (material.fileType === "docx") {
            extractedText = await extractTextFromDOCX(Buffer.from(buffer));
          }
        } catch (error) {
          console.error("Error extracting text:", error);
          throw new Error("Failed to extract text from material");
        }

        const adaptedMaterials: Array<{ id: number; profileId: number; url: string; fileName: string }> = [];

        for (const profileId of input.profileIds) {
          try {
            const profile = await getProfileById(profileId);
            if (!profile) {
              console.error(`Profile ${profileId} not found`);
              continue;
            }

            if (!validateProfile(profile)) {
              console.error(`Profile ${profileId} has missing fields`);
              continue;
            }

            const adaptedText = await adaptTextContent(extractedText, profile);

            const adaptedFileName = `${material.fileName.replace(/\.[^/.]+$/, "")}_adaptado_${profileId}.${material.fileType}`;
            let adaptedBuffer: Buffer;

            if (material.fileType === "pdf") {
              adaptedBuffer = await generatePDFFromText(
                adaptedText,
                profile.tipoLetra === "bastao",
                profile.dislexia === "sim"
              );
            } else {
              adaptedBuffer = await generateDOCXFromText(
                adaptedText,
                profile.tipoLetra === "bastao",
                profile.dislexia === "sim"
              );
            }

            const adaptedFileKey = `adapted/${material.classId}/${material.id}/${profileId}/${Date.now()}-${adaptedFileName}`;
            const mimeType = material.fileType === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            const { url: adaptedUrl } = await storagePut(adaptedFileKey, adaptedBuffer, mimeType);

            await createAdaptedMaterial(
              material.id,
              profileId,
              adaptedFileName,
              adaptedUrl,
              adaptedFileKey,
              adaptedBuffer.length
            );

            const adaptedMaterial = await createAdaptedMaterial(
              material.id,
              profileId,
              adaptedFileName,
              adaptedUrl,
              adaptedFileKey,
              adaptedBuffer.length
            );

            adaptedMaterials.push({
              id: (adaptedMaterial as any).insertId || 0,
              profileId,
              url: adaptedUrl,
              fileName: adaptedFileName,
            });
          } catch (error) {
            console.error(`Error adapting for profile ${profileId}:`, error);
          }
        }

        return {
          success: true,
          adaptedMaterials,
          message: `${adaptedMaterials.length} material(is) adaptado(s) com sucesso`,
        };
      }),
    history: protectedProcedure
      .input(z.object({ materialId: z.number() }))
      .query(async ({ input }) => {
        const adapted = await getAdaptedMaterialsByMaterialId(input.materialId);
        return adapted;
      }),
    getDownloadUrl: protectedProcedure
      .input(z.object({ adaptedMaterialId: z.number() }))
      .query(async ({ input }) => {
        const adapted = await getAdaptedMaterialById(input.adaptedMaterialId);
        if (!adapted) {
          throw new Error("Adapted material not found");
        }
        const { url } = await storageGet(adapted.adaptedFileKey);
        return { url, fileName: adapted.adaptedFileName };
      }),
  }),

  adapt: router({
    process: protectedProcedure
      .input(
        z.object({
          text: z.string(),
          profileId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const profile = await getProfileById(input.profileId);
        if (!profile) {
          throw new Error("Profile not found");
        }

        if (!validateProfile(profile)) {
          throw new Error("Profile has missing required fields");
        }

        const adaptedText = await adaptTextContent(input.text, profile);
        return { success: true, adaptedText };
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
