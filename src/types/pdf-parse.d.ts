declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  export default function pdfParse(data: Buffer | Uint8Array | string): Promise<{
    numpages?: number;
    numrender?: number;
    info?: any;
    metadata?: any;
    version?: string;
    text: string;
    textAsHtml?: string;
  }>;
}
