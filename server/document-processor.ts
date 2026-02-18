import { Document, Packer, Paragraph, TextRun } from "docx";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import pdfkit from "pdfkit";
import * as fs from "fs";

/**
 * Extracts text from a PDF file using a simple approach
 * For production, consider using a more robust library like pdfjs-dist
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // For now, we'll return a placeholder
    // In production, integrate pdfjs-dist properly
    const fileBuffer = buffer;
    
    // Simple heuristic: convert buffer to string and extract readable text
    let text = fileBuffer.toString("latin1");
    
    // Remove binary data and keep only readable text
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, " ");
    text = text.replace(/\s+/g, " ");
    
    return text.trim();
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extracts text from a DOCX file
 * Note: DOCX is a ZIP file, so we need a proper library
 * For now, returning a placeholder
 */
export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // DOCX extraction requires proper XML parsing
    // This is a placeholder - in production use mammoth or similar
    throw new Error("DOCX extraction requires additional setup - use mammoth library");
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw error;
  }
}

/**
 * Generates a PDF from adapted text
 */
export async function generatePDFFromText(
  text: string,
  isBastao: boolean,
  isDislexia: boolean
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdfkit({
        size: "A4",
        margin: 40,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err: Error) => {
        reject(err);
      });

      // Set font based on dislexia setting
      const fontSize = isDislexia ? 14 : 12;
      const lineGap = isDislexia ? 8 : 4;
      const font = isBastao ? "Helvetica" : "Times-Roman";

      // Add title
      doc.font(font, 16).text("Material Adaptado", { align: "center" });
      doc.moveDown();

      // Add content with appropriate spacing
      const paragraphs = text.split("\n\n");
      
      for (const paragraph of paragraphs) {
        doc.font(font, fontSize).text(paragraph, {
          align: "left",
          lineGap,
          width: 500,
        });
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generates a DOCX from adapted text
 */
export async function generateDOCXFromText(
  text: string,
  isBastao: boolean,
  isDislexia: boolean
): Promise<Buffer> {
  try {
    // Parse text into paragraphs
    const paragraphs = text.split("\n\n").map(
      (para) =>
        new Paragraph({
          spacing: {
            line: isDislexia ? 360 : 240, // 1.5 or 1.0 line spacing
            lineRule: "auto",
          },
          children: [
            new TextRun({
              text: para,
              font: isBastao ? "Arial" : "Calibri",
              size: isDislexia ? 28 : 24, // 14pt or 12pt
            }),
          ],
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw new Error("Failed to generate DOCX document");
  }
}

/**
 * Processes a file and extracts text based on file type
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileType: "pdf" | "docx"
): Promise<string> {
  if (fileType === "pdf") {
    return extractTextFromPDF(buffer);
  } else if (fileType === "docx") {
    return extractTextFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Generates an output file based on the desired format
 */
export async function generateOutputFile(
  text: string,
  outputFormat: "pdf" | "docx",
  isBastao: boolean,
  isDislexia: boolean
): Promise<Buffer> {
  if (outputFormat === "pdf") {
    return generatePDFFromText(text, isBastao, isDislexia);
  } else if (outputFormat === "docx") {
    return generateDOCXFromText(text, isBastao, isDislexia);
  } else {
    throw new Error(`Unsupported output format: ${outputFormat}`);
  }
}

/**
 * Saves a buffer to a temporary file and returns the path
 */
export function saveTempFile(buffer: Buffer, extension: string): string {
  const tempPath = join(tmpdir(), `${randomUUID()}.${extension}`);
  writeFileSync(tempPath, buffer);
  return tempPath;
}

/**
 * Cleans up a temporary file
 */
export function cleanupTempFile(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch (error) {
    console.warn("Failed to cleanup temp file:", error);
  }
}
