import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, classes, studentProfiles, materials, adaptedMaterials } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Classes queries
export async function createClass(userId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(classes).values({ userId, name, description });
  return { insertId: result[0].insertId };
}

export async function getClassesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(classes).where(eq(classes.userId, userId));
}

export async function getClassById(classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  return result[0];
}

export async function updateClass(classId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(classes).set({ name, description }).where(eq(classes.id, classId));
}

export async function deleteClass(classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(classes).where(eq(classes.id, classId));
}

// Student Profiles queries
export async function createStudentProfile(
  classId: number,
  profileName: string,
  fragmentacao: "baixa" | "media" | "alta",
  abstracao: "alta" | "media" | "baixa" | "nao_abstrai",
  mediacao: "autonomo" | "guiado" | "passo_a_passo",
  dislexia: "sim" | "nao",
  tipoLetra: "bastao" | "normal",
  observacoes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(studentProfiles).values({
    classId,
    profileName,
    fragmentacao,
    abstracao,
    mediacao,
    dislexia,
    tipoLetra,
    observacoes,
  });
  return { insertId: result[0].insertId };
}

export async function getProfilesByClassId(classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(studentProfiles).where(eq(studentProfiles.classId, classId));
}

export async function getProfileById(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.id, profileId)).limit(1);
  return result[0];
}

export async function updateStudentProfile(
  profileId: number,
  updates: Partial<{
    profileName: string;
    fragmentacao: "baixa" | "media" | "alta";
    abstracao: "alta" | "media" | "baixa" | "nao_abstrai";
    mediacao: "autonomo" | "guiado" | "passo_a_passo";
    dislexia: "sim" | "nao";
    tipoLetra: "bastao" | "normal";
    observacoes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(studentProfiles).set(updates).where(eq(studentProfiles.id, profileId));
}

export async function deleteStudentProfile(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(studentProfiles).where(eq(studentProfiles.id, profileId));
}

// Materials queries
export async function createMaterial(
  classId: number,
  fileName: string,
  fileType: "pdf" | "docx",
  fileUrl: string,
  fileKey: string,
  fileSize?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materials).values({ classId, fileName, fileType, fileUrl, fileKey, fileSize });
  return { insertId: result[0].insertId };
}

export async function getMaterialsByClassId(classId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(materials).where(eq(materials.classId, classId));
}

export async function getMaterialById(materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
  return result[0];
}

export async function deleteMaterial(materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(materials).where(eq(materials.id, materialId));
}

// Adapted Materials queries
export async function createAdaptedMaterial(
  materialId: number,
  profileId: number,
  adaptedFileName: string,
  adaptedFileUrl: string,
  adaptedFileKey: string,
  adaptedFileSize?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(adaptedMaterials).values({
    materialId,
    profileId,
    adaptedFileName,
    adaptedFileUrl,
    adaptedFileKey,
    adaptedFileSize,
  });
  return result;
}

export async function getAdaptedMaterialsByMaterialId(materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(adaptedMaterials).where(eq(adaptedMaterials.materialId, materialId));
}

export async function getAdaptedMaterialsByProfileId(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(adaptedMaterials).where(eq(adaptedMaterials.profileId, profileId));
}

export async function getAdaptedMaterialById(adaptedMaterialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(adaptedMaterials).where(eq(adaptedMaterials.id, adaptedMaterialId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteAdaptedMaterial(adaptedMaterialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(adaptedMaterials).where(eq(adaptedMaterials.id, adaptedMaterialId));
}
