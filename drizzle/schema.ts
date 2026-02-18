import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Classes (Turmas)
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

// Student Profiles (Perfis Anônimos)
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  profileName: varchar("profileName", { length: 100 }).notNull(),
  fragmentacao: mysqlEnum("fragmentacao", ["baixa", "media", "alta"]).notNull(),
  abstracao: mysqlEnum("abstracao", ["alta", "media", "baixa", "nao_abstrai"]).notNull(),
  mediacao: mysqlEnum("mediacao", ["autonomo", "guiado", "passo_a_passo"]).notNull(),
  dislexia: mysqlEnum("dislexia", ["sim", "nao"]).notNull(),
  tipoLetra: mysqlEnum("tipoLetra", ["bastao", "normal"]).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

// Materials (Materiais Didáticos)
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["pdf", "docx"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSize: int("fileSize"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

// Adapted Materials (Materiais Adaptados)
export const adaptedMaterials = mysqlTable("adapted_materials", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull(),
  profileId: int("profileId").notNull(),
  adaptedFileName: varchar("adaptedFileName", { length: 255 }).notNull(),
  adaptedFileUrl: text("adaptedFileUrl").notNull(),
  adaptedFileKey: varchar("adaptedFileKey", { length: 512 }).notNull(),
  adaptedFileSize: int("adaptedFileSize"),
  adaptedAt: timestamp("adaptedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdaptedMaterial = typeof adaptedMaterials.$inferSelect;
export type InsertAdaptedMaterial = typeof adaptedMaterials.$inferInsert;