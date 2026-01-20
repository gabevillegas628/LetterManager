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

// Convert image file to base64 data URI
function imageToBase64(imagePath: string): string | null {
  try {
    if (!fs.existsSync(imagePath)) {
      return null;
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/png';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}

interface PdfProfessorInfo {
  name?: string;
  title?: string;
  department?: string;
  institution?: string;
  email?: string;
  letterheadImage?: string | null;
  signatureImage?: string | null;
}

// HTML template for PDF
function buildPdfHtml(content: string, professorInfo?: PdfProfessorInfo): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Convert images to base64 if they exist
  const letterheadDataUri = professorInfo?.letterheadImage
    ? imageToBase64(professorInfo.letterheadImage)
    : null;
  const signatureDataUri = professorInfo?.signatureImage
    ? imageToBase64(professorInfo.signatureImage)
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: letter;
      margin: 0.75in 1in;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 6.5in;
      margin: 0 auto;
    }

    .letterhead-image {
      text-align: center;
      margin-bottom: 1em;
    }

    .letterhead-image img {
      max-width: 100%;
      max-height: 100px;
      object-fit: contain;
    }

    .letterhead {
      margin-bottom: 1.25em;
      padding-bottom: 0.75em;
      border-bottom: 1px solid #c0c0c0;
    }

    .letterhead-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .letterhead-left h1 {
      margin: 0;
      font-size: 14pt;
      font-weight: 600;
      color: #2c3e50;
      letter-spacing: 0.5px;
    }

    .letterhead-left p {
      margin: 2px 0;
      font-size: 9pt;
      color: #666;
    }

    .letterhead-right {
      text-align: right;
      font-size: 9pt;
      color: #666;
    }

    .letterhead-right p {
      margin: 2px 0;
    }

    .date {
      margin: 1.5em 0;
      font-size: 11pt;
    }

    .content {
      text-align: justify;
      hyphens: auto;
    }

    .content p {
      margin: 0.75em 0;
      text-indent: 0;
    }

    .content p:first-of-type {
      margin-top: 0;
    }

    .signature-section {
      margin-top: 2em;
    }

    .signature-image {
      margin: 1em 0;
    }

    .signature-image img {
      max-height: 60px;
      object-fit: contain;
    }

    .signature-name {
      margin-top: 0.5em;
      font-weight: 600;
    }

    .signature-title {
      font-size: 10pt;
      color: #666;
    }

    h1, h2, h3 {
      font-weight: 600;
      color: #2c3e50;
    }

    strong, b {
      font-weight: 600;
    }

    em, i {
      font-style: italic;
    }

    ul, ol {
      margin: 0.75em 0;
      padding-left: 1.5em;
    }

    li {
      margin: 0.35em 0;
    }

    /* Clean up any extra spacing from rich text editor */
    .content br + br {
      display: none;
    }
  </style>
</head>
<body>
  ${letterheadDataUri ? `
  <div class="letterhead-image">
    <img src="${letterheadDataUri}" alt="Letterhead" />
  </div>
  ` : ''}

  ${professorInfo?.name ? `
  <div class="letterhead">
    <div class="letterhead-content">
      <div class="letterhead-left">
        <h1>${professorInfo.name}</h1>
        ${professorInfo.title ? `<p>${professorInfo.title}</p>` : ''}
      </div>
      <div class="letterhead-right">
        ${professorInfo.department ? `<p>${professorInfo.department}</p>` : ''}
        ${professorInfo.institution ? `<p>${professorInfo.institution}</p>` : ''}
        ${professorInfo.email ? `<p>${professorInfo.email}</p>` : ''}
      </div>
    </div>
  </div>
  ` : ''}

  <div class="date">${today}</div>

  <div class="content">
    ${content}
  </div>

  ${professorInfo?.name || signatureDataUri ? `
  <div class="signature-section">
    <p>Sincerely,</p>
    ${signatureDataUri ? `
    <div class="signature-image">
      <img src="${signatureDataUri}" alt="Signature" />
    </div>
    ` : '<br><br><br>'}
    ${professorInfo?.name ? `<div class="signature-name">${professorInfo.name}</div>` : ''}
    ${professorInfo?.title ? `<div class="signature-title">${professorInfo.title}</div>` : ''}
    ${professorInfo?.institution ? `<div class="signature-title">${professorInfo.institution}</div>` : ''}
  </div>
  ` : ''}
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
    email: professor.email ?? undefined,
    letterheadImage: professor.letterheadImage,
    signatureImage: professor.signatureImage,
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
