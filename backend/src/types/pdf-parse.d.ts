declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }

  function pdf(buffer: Buffer): Promise<PdfParseResult>;
  export default pdf;
}
