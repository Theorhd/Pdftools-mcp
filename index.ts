#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_HOME = os.homedir();
const DEFAULT_OUTPUT_DIR = path.join(USER_HOME, "Downloads");
const ALLOWED_DIRS = [
  path.join(USER_HOME, "Downloads"),
  path.join(USER_HOME, "Documents"), 
  path.join(USER_HOME, "Desktop")
];

function validateOutputPath(outputPath: string): string {
  const resolvedPath = path.resolve(outputPath);
  const isAllowed = ALLOWED_DIRS.some(allowedDir => 
    resolvedPath.startsWith(path.resolve(allowedDir))
  );
  
  if (!isAllowed) {
    throw new Error(`Output path must be within allowed directories: ${ALLOWED_DIRS.join(", ")}`);
  }
  
  return resolvedPath;
}

const server = new Server(
  {
    name: "pdftools-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: "generate_pdf_from_html",
    description: "Generate a PDF from HTML content using Puppeteer",
    inputSchema: {
      type: "object",
      properties: {
        html_content: {
          type: "string",
          description: "HTML content to convert to PDF"
        },
        output_filename: {
          type: "string", 
          description: "Name of the output PDF file (without path)"
        },
        output_dir: {
          type: "string",
          description: "Output directory (optional, defaults to Downloads)",
          default: DEFAULT_OUTPUT_DIR
        },
        options: {
          type: "object",
          description: "PDF generation options",
          properties: {
            format: { type: "string", default: "A4" },
            margin: {
              type: "object",
              properties: {
                top: { type: "string", default: "1cm" },
                right: { type: "string", default: "1cm" }, 
                bottom: { type: "string", default: "1cm" },
                left: { type: "string", default: "1cm" }
              }
            }
          }
        }
      },
      required: ["html_content", "output_filename"]
    }
  },
  {
    name: "generate_pdf_from_text",
    description: "Generate a PDF from plain text using PDFKit",
    inputSchema: {
      type: "object",
      properties: {
        text_content: {
          type: "string",
          description: "Text content to convert to PDF"
        },
        output_filename: {
          type: "string",
          description: "Name of the output PDF file (without path)"
        },
        output_dir: {
          type: "string", 
          description: "Output directory (optional, defaults to Downloads)",
          default: DEFAULT_OUTPUT_DIR
        },
        options: {
          type: "object",
          description: "PDF formatting options",
          properties: {
            fontSize: { type: "number", default: 12 },
            font: { type: "string", default: "Helvetica" },
            margins: {
              type: "object",
              properties: {
                top: { type: "number", default: 50 },
                left: { type: "number", default: 50 },
                right: { type: "number", default: 50 },
                bottom: { type: "number", default: 50 }
              }
            }
          }
        }
      },
      required: ["text_content", "output_filename"]
    }
  },
  {
    name: "generate_pdf_from_markdown",
    description: "Generate a PDF from Markdown content",
    inputSchema: {
      type: "object", 
      properties: {
        markdown_content: {
          type: "string",
          description: "Markdown content to convert to PDF"
        },
        output_filename: {
          type: "string",
          description: "Name of the output PDF file (without path)"
        },
        output_dir: {
          type: "string",
          description: "Output directory (optional, defaults to Downloads)", 
          default: DEFAULT_OUTPUT_DIR
        }
      },
      required: ["markdown_content", "output_filename"]
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "generate_pdf_from_html": {
        const { html_content, output_filename, output_dir = DEFAULT_OUTPUT_DIR, options = {} } = args as any;
        
        const outputPath = validateOutputPath(path.join(output_dir, output_filename));
        
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.setContent(html_content, { waitUntil: 'networkidle0' });
        
        const pdfOptions = {
          path: outputPath,
          format: options.format || 'A4',
          margin: options.margin || {
            top: '1cm',
            right: '1cm', 
            bottom: '1cm',
            left: '1cm'
          },
          printBackground: true
        };
        
        await page.pdf(pdfOptions as any);
        await browser.close();
        
        return {
          content: [
            {
              type: "text",
              text: `PDF successfully generated from HTML: ${outputPath}`
            }
          ]
        };
      }

      case "generate_pdf_from_text": {
        const { text_content, output_filename, output_dir = DEFAULT_OUTPUT_DIR, options = {} } = args as any;
        
        const outputPath = validateOutputPath(path.join(output_dir, output_filename));
        
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        const doc = new PDFDocument({
          margins: options.margins || { top: 50, left: 50, right: 50, bottom: 50 }
        });
        
        const stream = createWriteStream(outputPath);
        doc.pipe(stream);
        
        doc.font(options.font || 'Helvetica')
           .fontSize(options.fontSize || 12);
        
        doc.text(text_content);
        
        doc.end();
        
        return new Promise((resolve) => {
          stream.on('finish', () => {
            resolve({
              content: [
                {
                  type: "text",
                  text: `PDF successfully generated from text: ${outputPath}`
                }
              ]
            });
          });
        });
      }

      case "generate_pdf_from_markdown": {
        const { markdown_content, output_filename, output_dir = DEFAULT_OUTPUT_DIR } = args as any;
        
        const outputPath = validateOutputPath(path.join(output_dir, output_filename));
        
        const htmlContent = markdownToHtml(markdown_content);
        
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        await page.pdf({
          path: outputPath,
          format: 'A4',
          margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
          printBackground: true
        });
        
        await browser.close();
        
        return {
          content: [
            {
              type: "text", 
              text: `PDF successfully generated from Markdown: ${outputPath}`
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/\n/gim, '<br>');
    
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PDF MCP Server running on stdio");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
