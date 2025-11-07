# PDF-Tools MCP Server v1.0.0

A Model Context Protocol (MCP) server for PDF generation and manipulation. This server provides tools to generate PDF documents from HTML, text, and Markdown content.

<a href="https://glama.ai/mcp/servers/@Theorhd/Pdftools-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Theorhd/Pdftools-mcp/badge" alt="PDF-Tools Server MCP server" />
</a>

## Features

- **HTML to PDF**: Convert HTML content to PDF using Puppeteer
- **Text to PDF**: Generate PDF from plain text using PDFKit
- **Markdown to PDF**: Convert Markdown content to styled PDF
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Dynamic paths**: Automatically uses user's home directory
- **Secure**: Validates output paths to allowed directories

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Clone and Install

```bash
git clone https://github.com/Theorhd/Pdftools-mcp.git
cd Pdftools-mcp
npm install
```

### Build

```bash
npm run build
```

## Usage

### As MCP Server

Add to your MCP client configuration (e.g., Jan):

```json
{
  "mcpServers": {
    "pdf-creator": {
      "command": "node",
      "args": ["path/to/pdftools-mcp/dist/index.js"],
      "env": {},
      "type": "stdio",
      "active": true
    }
  }
}
```

### Standalone

```bash
npm start
```

## Tools

### generate_pdf_from_html

Generate a PDF from HTML content using Puppeteer.

**Parameters:**
- `html_content` (string, required): HTML content to convert
- `output_filename` (string, required): Output PDF filename
- `output_dir` (string, optional): Output directory (defaults to Downloads)
- `options` (object, optional): PDF generation options
  - `format` (string): Page format (default: A4)
  - `margin` (object): Page margins

**Example:**
```json
{
  "html_content": "<h1>Hello World</h1><p>This is a test PDF.</p>",
  "output_filename": "test.pdf",
  "options": {
    "format": "A4",
    "margin": {
      "top": "1cm",
      "right": "1cm",
      "bottom": "1cm",
      "left": "1cm"
    }
  }
}
```

### generate_pdf_from_text

Generate a PDF from plain text using PDFKit.

**Parameters:**
- `text_content` (string, required): Text content to convert
- `output_filename` (string, required): Output PDF filename
- `output_dir` (string, optional): Output directory (defaults to Downloads)
- `options` (object, optional): PDF formatting options
  - `fontSize` (number): Font size (default: 12)
  - `font` (string): Font family (default: Helvetica)
  - `margins` (object): Page margins

**Example:**
```json
{
  "text_content": "Hello World!\n\nThis is a test PDF generated from plain text.",
  "output_filename": "text-example.pdf",
  "options": {
    "fontSize": 14,
    "font": "Helvetica",
    "margins": {
      "top": 50,
      "left": 50,
      "right": 50,
      "bottom": 50
    }
  }
}
```

### generate_pdf_from_markdown

Generate a PDF from Markdown content with automatic HTML conversion.

**Parameters:**
- `markdown_content` (string, required): Markdown content to convert
- `output_filename` (string, required): Output PDF filename
- `output_dir` (string, optional): Output directory (defaults to Downloads)

**Example:**
```json
{
  "markdown_content": "# Hello World\n\nThis is a **bold** text and this is *italic*.\n\n## Subheading\n\n- List item 1\n- List item 2\n\n`code example`",
  "output_filename": "markdown-example.pdf"
}
```

## Security

The server validates all output paths to ensure files are only written to allowed directories:
- User's Downloads folder
- User's Documents folder
- User's Desktop folder

Any attempt to write outside these directories will result in an error.

## Development

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run the compiled server
- `npm run dev`: Run in development mode with tsx
- `npm test`: Run tests

### Project Structure

```
pdftools-mcp/
├── src/
├── dist/           # Compiled JavaScript
├── index.ts        # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **puppeteer**: HTML to PDF conversion
- **pdfkit**: PDF generation from text
- **typescript**: TypeScript compiler

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Troubleshooting

### Common Issues

**Puppeteer fails to launch:**
- Ensure you have the required system dependencies
- On Linux: `sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget`

**Permission errors:**
- Ensure the output directory exists and is writable
- Check that the user has permissions to write to the target directory

**Module not found errors:**
- Run `npm install` to ensure all dependencies are installed
- Rebuild the project with `npm run build`

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above