import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { config } from '../config/index.js';

// Ensure PDF output directory exists
const pdfDir = path.join(config.uploadDir, 'pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

// HTML template for PDF
function buildPdfHtml(content: string, professorInfo?: { name?: string; title?: string; department?: string; institution?: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: letter;
      margin: 1in;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 6.5in;
      margin: 0 auto;
    }

    .letterhead {
      text-align: center;
      margin-bottom: 2em;
      padding-bottom: 1em;
      border-bottom: 2px solid #333;
    }

    .letterhead h1 {
      margin: 0;
      font-size: 18pt;
      font-weight: bold;
    }

    .letterhead p {
      margin: 0.25em 0;
      font-size: 10pt;
      color: #555;
    }

    .date {
      text-align: right;
      margin-bottom: 2em;
    }

    .content {
      text-align: justify;
    }

    .content p {
      margin: 1em 0;
      text-indent: 0;
    }

    .signature {
      margin-top: 3em;
    }

    .signature-line {
      margin-top: 4em;
      border-top: 1px solid #000;
      width: 200px;
    }

    h1, h2, h3 {
      font-weight: bold;
    }

    strong, b {
      font-weight: bold;
    }

    em, i {
      font-style: italic;
    }

    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }

    li {
      margin: 0.5em 0;
    }
  </style>
</head>
<body>
  ${professorInfo?.name ? `
  <div class="letterhead">
    <h1>${professorInfo.name}</h1>
    ${professorInfo.title ? `<p>${professorInfo.title}</p>` : ''}
    ${professorInfo.department ? `<p>${professorInfo.department}</p>` : ''}
    ${professorInfo.institution ? `<p>${professorInfo.institution}</p>` : ''}
  </div>
  ` : ''}

  <div class="content">
    ${content}
  </div>
</body>
</html>
`;
}

// Generate PDF from letter content
export async function generatePdf(letterId: string): Promise<string> {
  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
    include: {
      request: true,
    },
  });

  if (!letter) {
    throw new AppError('Letter not found', 404);
  }

  // Get professor info for letterhead
  const professor = await prisma.professor.findFirst();

  // Build HTML - convert null values to undefined for the function
  const professorInfo = professor ? {
    name: professor.name,
    title: professor.title ?? undefined,
    department: professor.department ?? undefined,
    institution: professor.institution ?? undefined,
  } : undefined;

  const html = buildPdfHtml(letter.content, professorInfo);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfFileName = `letter-${letter.requestId}-${nanoid(8)}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);

    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
      },
      printBackground: true,
    });

    // Delete old PDF if exists
    if (letter.pdfPath && fs.existsSync(letter.pdfPath)) {
      try {
        fs.unlinkSync(letter.pdfPath);
      } catch {
        // Ignore deletion errors
      }
    }

    // Update letter with PDF path
    await prisma.letter.update({
      where: { id: letterId },
      data: {
        pdfPath,
        pdfGeneratedAt: new Date(),
      },
    });

    return pdfPath;
  } finally {
    await browser.close();
  }
}

// Get PDF file path for a letter
export async function getPdfPath(letterId: string): Promise<string> {
  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
  });

  if (!letter) {
    throw new AppError('Letter not found', 404);
  }

  if (!letter.pdfPath || !fs.existsSync(letter.pdfPath)) {
    throw new AppError('PDF not found. Generate it first.', 404);
  }

  return letter.pdfPath;
}

// Check if PDF exists and is up to date
export async function isPdfUpToDate(letterId: string): Promise<boolean> {
  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
  });

  if (!letter || !letter.pdfPath || !letter.pdfGeneratedAt) {
    return false;
  }

  // Check if file exists
  if (!fs.existsSync(letter.pdfPath)) {
    return false;
  }

  // Check if letter was updated after PDF was generated
  return letter.pdfGeneratedAt >= letter.updatedAt;
}
