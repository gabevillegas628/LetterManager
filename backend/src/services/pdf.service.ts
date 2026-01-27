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
      '.svg': 'image/svg+xml',
    };
    const mimeType = mimeTypes[ext] || 'image/png';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}

interface HeaderConfig {
  showName: boolean;
  items: string[];
}

const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  showName: false,
  items: ['title', 'department', 'institution', 'email']
};

// Helper to render header items based on config
function renderHeaderItems(professorInfo: PdfProfessorInfo, config: HeaderConfig): string {
  const itemMap: Record<string, string | undefined> = {
    title: professorInfo.title,
    department: professorInfo.department,
    institution: professorInfo.institution,
    address: professorInfo.address,
    email: professorInfo.email,
    phone: professorInfo.phone,
  };

  return config.items
    .map(item => {
      const value = itemMap[item];
      if (!value) return '';
      // Address may have multiple lines
      if (item === 'address') {
        return value.split('\n').map(line => `<p>${line}</p>`).join('');
      }
      return `<p>${value}</p>`;
    })
    .join('');
}

interface PdfProfessorInfo {
  name?: string;
  title?: string;
  department?: string;
  institution?: string;
  email?: string;
  address?: string;
  phone?: string;
  headerConfig?: HeaderConfig | null;
  letterheadImage?: string | null;
  signatureImage?: string | null;
}

// HTML template for PDF
function buildPdfHtml(content: string, professorInfo?: PdfProfessorInfo, fontSizePt: number = 11): string {
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
      font-size: ${fontSizePt}pt;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 6.5in;
      margin: 0 auto;
    }

    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75em;
      padding-bottom: 0.5em;
      border-bottom: 1px solid #c0c0c0;
      gap: 0.75em;
    }

    .letterhead-logo {
      flex-shrink: 0;
    }

    .letterhead-logo img {
      max-width: 210px;
      object-fit: contain;
      /* height set dynamically via inline style to match header info */
    }

    .letterhead-info {
      flex: 1;
      text-align: right;
      line-height: 1.3;
    }

    .letterhead-info h1 {
      margin: 0 0 2px 0;
      font-size: 12pt;
      font-weight: 600;
      color: #2c3e50;
    }

    .letterhead-info p {
      margin: 0;
      font-size: 9pt;
      color: #555;
    }

    .date {
      margin: 1em 0;
      font-size: 11pt;
    }

    .content {
      text-align: justify;
      hyphens: auto;
    }

    .content p {
      margin: 0.75em 0;
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
  ${(() => {
    const config = professorInfo?.headerConfig || DEFAULT_HEADER_CONFIG;
    const showHeader = (config.showName && professorInfo?.name) || letterheadDataUri || (professorInfo && config.items.length > 0);
    if (!showHeader) return '';

    const headerItems = professorInfo ? renderHeaderItems(professorInfo, config) : '';

    // Calculate logo height based on number of visible header lines
    // Name line: ~18px, each info line: ~13px (9pt * 1.3 line-height)
    const itemMap: Record<string, string | undefined> = professorInfo ? {
      title: professorInfo.title,
      department: professorInfo.department,
      institution: professorInfo.institution,
      address: professorInfo.address,
      email: professorInfo.email,
      phone: professorInfo.phone,
    } : {};
    // Count lines, accounting for multi-line address
    let lineCount = 0;
    for (const item of config.items) {
      const value = itemMap[item];
      if (value) {
        if (item === 'address') {
          // Count actual lines in address
          lineCount += value.split('\n').filter(line => line.trim()).length;
        } else {
          lineCount += 1;
        }
      }
    }
    const nameHeight = (config.showName && professorInfo?.name) ? 18 : 0;
    const itemsHeight = lineCount * 13;
    const logoMaxHeight = Math.max(30, nameHeight + itemsHeight); // minimum 30px

    return `
  <div class="letterhead">
    ${letterheadDataUri ? `
    <div class="letterhead-logo">
      <img src="${letterheadDataUri}" alt="Letterhead" style="height: ${logoMaxHeight}px;" />
    </div>
    ` : ''}
    <div class="letterhead-info">
      ${config.showName && professorInfo?.name ? `<h1>${professorInfo.name}</h1>` : ''}
      ${headerItems}
    </div>
  </div>
  `;
  })()}

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

// Helper to generate PDF buffer and get page count
async function generatePdfBuffer(
  page: puppeteer.Page,
  html: string
): Promise<{ buffer: Buffer; pageCount: number }> {
  // Use 'domcontentloaded' instead of 'networkidle0' to avoid timeouts
  // since we're rendering static HTML with inline styles (no external resources)
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

  const pdfUint8Array = await page.pdf({
    format: 'Letter',
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in',
    },
    printBackground: true,
  });

  // Convert Uint8Array to Buffer
  const pdfBuffer = Buffer.from(pdfUint8Array);

  // Count pages by looking for page markers in the PDF
  // PDF page objects contain "/Type /Page" entries
  const pdfString = pdfBuffer.toString('latin1');
  const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : 1;

  return { buffer: pdfBuffer, pageCount };
}

// Generate PDF from letter content
export async function generatePdf(letterId: string): Promise<string> {
  const letter = await prisma.letter.findUnique({
    where: { id: letterId },
    include: {
      request: {
        include: {
          professor: true,
        },
      },
    },
  });

  if (!letter) {
    throw new AppError('Letter not found', 404);
  }

  // Get professor info for letterhead from the request relation
  const professor = letter.request.professor;

  // Build HTML - convert null values to undefined for the function
  const professorInfo = professor ? {
    name: professor.name,
    title: professor.title ?? undefined,
    department: professor.department ?? undefined,
    institution: professor.institution ?? undefined,
    email: professor.email ?? undefined,
    address: professor.address ?? undefined,
    phone: professor.phone ?? undefined,
    headerConfig: professor.headerConfig as HeaderConfig | null,
    letterheadImage: professor.letterheadImage,
    signatureImage: professor.signatureImage,
  } : undefined;

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Try with default font size (11pt)
    const defaultFontSize = 11;
    const htmlDefault = buildPdfHtml(letter.content, professorInfo, defaultFontSize);
    const { buffer: defaultBuffer, pageCount: defaultPageCount } = await generatePdfBuffer(page, htmlDefault);

    let finalBuffer = defaultBuffer;
    let usedFontSize = defaultFontSize;

    // If we got 2 pages, try with smaller font to see if it fits on 1 page
    if (defaultPageCount === 2) {
      const smallerFontSize = 10;
      const htmlSmaller = buildPdfHtml(letter.content, professorInfo, smallerFontSize);
      const { buffer: smallerBuffer, pageCount: smallerPageCount } = await generatePdfBuffer(page, htmlSmaller);

      // Only use smaller font if it actually reduces to 1 page
      if (smallerPageCount === 1) {
        finalBuffer = smallerBuffer;
        usedFontSize = smallerFontSize;
        console.log(`PDF for letter ${letterId}: Reduced font from ${defaultFontSize}pt to ${usedFontSize}pt to fit on 1 page`);
      }
    }

    // Save the PDF
    const pdfFileName = `letter-${letter.requestId}-${nanoid(8)}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    fs.writeFileSync(pdfPath, finalBuffer);

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

// Generate a preview PDF from template content (returns buffer, doesn't save)
export async function generatePreviewPdf(professorId: string, content: string): Promise<Buffer> {
  // Get professor info for letterhead
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
  });

  if (!professor) {
    throw new AppError('Professor not found', 404);
  }

  const professorInfo = {
    name: professor.name,
    title: professor.title ?? undefined,
    department: professor.department ?? undefined,
    institution: professor.institution ?? undefined,
    email: professor.email ?? undefined,
    address: professor.address ?? undefined,
    phone: professor.phone ?? undefined,
    headerConfig: professor.headerConfig as HeaderConfig | null,
    letterheadImage: professor.letterheadImage,
    signatureImage: professor.signatureImage,
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const html = buildPdfHtml(content, professorInfo, 11);
    const { buffer } = await generatePdfBuffer(page, html);
    return buffer;
  } finally {
    await browser.close();
  }
}
