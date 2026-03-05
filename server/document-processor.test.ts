import { describe, expect, it } from "vitest";
import { extractTextFromPDF, generatePDFFromText } from "./document-processor";

describe("document-processor PDF extraction", () => {
  it("extracts readable text from generated PDF", async () => {
    const originalText = "Este é um material de matemática inclusivo.";
    const pdfBuffer = await generatePDFFromText(originalText, false, false);

    const extractedText = await extractTextFromPDF(pdfBuffer);

    expect(extractedText).toContain("material de matemática inclusivo");
  });

  it("returns clear message when PDF has no extractable text", async () => {
    const invalidPdf = Buffer.from("not-a-pdf");

    const extractedText = await extractTextFromPDF(invalidPdf);

    expect(extractedText).toBe("Erro na extração de texto do PDF.");
  });
});
