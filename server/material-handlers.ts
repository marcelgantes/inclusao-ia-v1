import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import axios from "axios";
import { storagePut, storageGet } from "./storage";
import { createMaterial, getMaterialById, getProfileById } from "./db";
import { adaptTextContent, validateProfile } from "./adaptation";
import { generatePDFFromText, generateDOCXFromText, extractTextFromPDF, extractTextFromDOCX } from "./document-processor";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

interface AuthenticatedRequest extends Request {
  user?: { id: number };
  file?: any;
}

// Middleware para autenticar usuário
function authMiddleware(req: any, res: Response, next: any) {
  if (process.env.NODE_ENV === "development") {
    req.user = {
      id: 1,
      openId: "mock-user-id",
      name: "Professor Gantes (Mock)",
      email: "gantes@exemplo.com",
      loginMethod: "mock",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    return next();
  }

  sdk.authenticateRequest(req)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Unauthorized" });
    });
}

export function setupMaterialHandlers(app: express.Application) {
  // Upload material
  app.post("/api/materials/upload", authMiddleware, upload.single("file"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const classId = parseInt(req.body.classId);
      const userId = req.user?.id;

      if (!userId || !classId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const fileType = req.file.mimetype === "application/pdf" ? "pdf" : "docx";
      const fileName = req.file.originalname;
      const fileKey = `materials/${userId}/${classId}/${Date.now()}-${fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      // Save to database
      const result = await createMaterial(classId, fileName, fileType as "pdf" | "docx", url, fileKey, req.file.size);

      res.json({
        success: true,
        materialId: result.insertId,
        url,
        fileKey,
        fileName,
        fileType,
        fileSize: req.file.size,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Process and adapt material
  app.post("/api/materials/process", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialId, profileIds } = req.body;
      const userId = req.user?.id;

      if (!userId || !materialId || !profileIds || profileIds.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get material
      const material = await getMaterialById(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Get presigned URL for material
      const { url: materialUrl } = await storageGet(material.fileKey);

      // Download material from S3
      const response = await axios.get(materialUrl, { responseType: 'arraybuffer' });
      const buffer = response.data;

      // Save buffer to temp file for extraction
      const tempPath = require("path").join(require("os").tmpdir(), `${Date.now()}.${material.fileType}`);
      require("fs").writeFileSync(tempPath, Buffer.from(buffer));

      // Extract text based on file type
      let extractedText = "";
      try {
        if (material.fileType === "pdf") {
          extractedText = await extractTextFromPDF(tempPath);
        } else {
          extractedText = await extractTextFromDOCX(tempPath);
        }
      } finally {
        require("fs").unlinkSync(tempPath);
      }

      // Process for each profile
      const adaptedMaterials = [];

      for (const profileId of profileIds) {
        const profile = await getProfileById(profileId);
        if (!profile || !validateProfile(profile)) {
          continue;
        }

        // Adapt text
        const adaptedText = await adaptTextContent(extractedText, profile);

        // Generate output document
        let outputBuffer: Buffer;
        let outputMimeType: string;

        if (material.fileType === "pdf") {
          outputBuffer = await generatePDFFromText(
            adaptedText,
            profile.tipoLetra === "bastao",
            profile.dislexia === "sim"
          );
          outputMimeType = "application/pdf";
        } else {
          outputBuffer = await generateDOCXFromText(
            adaptedText,
            profile.tipoLetra === "bastao",
            profile.dislexia === "sim"
          );
          outputMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        // Upload adapted material to S3
        const adaptedFileName = `${path.parse(material.fileName).name}_${profile.profileName}.${material.fileType}`;
        const adaptedFileKey = `adapted/${userId}/${materialId}/${profileId}/${adaptedFileName}`;
        const { url: adaptedUrl } = await storagePut(adaptedFileKey, outputBuffer, outputMimeType);

        adaptedMaterials.push({
          profileId,
          profileName: profile.profileName,
          fileName: adaptedFileName,
          url: adaptedUrl,
        });
      }

      res.json({
        success: true,
        materials: adaptedMaterials,
      });
    } catch (error) {
      console.error("Process error:", error);
      res.status(500).json({ error: "Processing failed" });
    }
  });
}
