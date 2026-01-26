import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { generatePdf, getPdfPath } from './pdf.service.js';
import path from 'path';
import fs from 'fs';

// Helper to check if all destinations are SENT or CONFIRMED, and update request status
async function checkAndUpdateRequestCompletion(requestId: string): Promise<void> {
  const destinations = await prisma.submissionDestination.findMany({
    where: { requestId },
  });

  // If there are no destinations, don't mark as completed
  if (destinations.length === 0) {
    return;
  }

  // Check if all destinations are either SENT or CONFIRMED
  const allComplete = destinations.every(
    (d) => d.status === 'SENT' || d.status === 'CONFIRMED'
  );

  if (allComplete) {
    await prisma.letterRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED' },
    });
  }
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Verify transporter configuration
export async function verifyEmailConfig(): Promise<boolean> {
  if (!config.smtp.user || !config.smtp.pass) {
    return false;
  }

  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

export interface SendLetterInput {
  letterId: string;
  destinationId: string;
}

// Send letter to a destination
export async function sendLetter(input: SendLetterInput): Promise<void> {
  const { letterId, destinationId } = input;

  // Get letter with professor info from request relation
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

  // Get destination
  const destination = await prisma.submissionDestination.findUnique({
    where: { id: destinationId },
  });

  if (!destination) {
    throw new AppError('Destination not found', 404);
  }

  if (destination.requestId !== letter.requestId) {
    throw new AppError('Destination does not belong to this request', 400);
  }

  if (destination.method !== 'EMAIL') {
    throw new AppError('Destination is not configured for email', 400);
  }

  if (!destination.recipientEmail) {
    throw new AppError('Destination has no recipient email', 400);
  }

  // Generate PDF if needed
  let pdfPath: string;
  try {
    pdfPath = await getPdfPath(letterId);
  } catch {
    // Generate PDF if it doesn't exist
    pdfPath = await generatePdf(letterId);
  }

  // Get professor info for sender from request relation
  const professor = letter.request.professor;
  const fromName = professor?.name || 'Recommate';
  const fromEmail = config.smtp.user;

  // Build email
  const studentName = letter.request.studentName || 'a student';
  const subject = `Letter of Recommendation for ${studentName}`;

  const text = `Dear ${destination.recipientName || 'Admissions Committee'},

Please find attached a letter of recommendation for ${studentName} applying to ${destination.programName || 'your program'} at ${destination.institutionName}.

If you have any questions, please feel free to contact me.

Sincerely,
${professor?.name || 'Professor'}
${professor?.title ? professor.title + '\n' : ''}${professor?.department ? professor.department + '\n' : ''}${professor?.institution || ''}`;

  const html = `
<p>Dear ${destination.recipientName || 'Admissions Committee'},</p>

<p>Please find attached a letter of recommendation for <strong>${studentName}</strong> applying to ${destination.programName || 'your program'} at ${destination.institutionName}.</p>

<p>If you have any questions, please feel free to contact me.</p>

<p>Sincerely,<br>
${professor?.name || 'Professor'}<br>
${professor?.title ? professor.title + '<br>' : ''}
${professor?.department ? professor.department + '<br>' : ''}
${professor?.institution || ''}</p>
`;

  try {
    // Send email
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: destination.recipientEmail,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `Recommendation_Letter_${studentName.replace(/\s+/g, '_')}.pdf`,
          path: pdfPath,
        },
      ],
    });

    // Update destination status
    await prisma.submissionDestination.update({
      where: { id: destinationId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Check if all destinations are now complete
    await checkAndUpdateRequestCompletion(destination.requestId);
  } catch (error) {
    // Update destination with failure
    await prisma.submissionDestination.update({
      where: { id: destinationId },
      data: {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw new AppError('Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
  }
}

// Mark destination as manually sent (for DOWNLOAD and PORTAL methods)
export async function markDestinationSent(destinationId: string): Promise<void> {
  const destination = await prisma.submissionDestination.findUnique({
    where: { id: destinationId },
  });

  if (!destination) {
    throw new AppError('Destination not found', 404);
  }

  await prisma.submissionDestination.update({
    where: { id: destinationId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });

  // Check if all destinations are now complete
  await checkAndUpdateRequestCompletion(destination.requestId);
}

// Mark destination as confirmed
export async function markDestinationConfirmed(destinationId: string): Promise<void> {
  const destination = await prisma.submissionDestination.findUnique({
    where: { id: destinationId },
  });

  if (!destination) {
    throw new AppError('Destination not found', 404);
  }

  await prisma.submissionDestination.update({
    where: { id: destinationId },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
  });

  // Check if all destinations are now complete
  await checkAndUpdateRequestCompletion(destination.requestId);
}

// Reset destination status to pending
export async function resetDestinationStatus(destinationId: string): Promise<void> {
  const destination = await prisma.submissionDestination.findUnique({
    where: { id: destinationId },
  });

  if (!destination) {
    throw new AppError('Destination not found', 404);
  }

  await prisma.submissionDestination.update({
    where: { id: destinationId },
    data: {
      status: 'PENDING',
      sentAt: null,
      confirmedAt: null,
      failureReason: null,
    },
  });

  // If request was COMPLETED, revert to IN_PROGRESS since not all destinations are done
  const request = await prisma.letterRequest.findUnique({
    where: { id: destination.requestId },
  });

  if (request?.status === 'COMPLETED') {
    await prisma.letterRequest.update({
      where: { id: destination.requestId },
      data: { status: 'IN_PROGRESS' },
    });
  }
}
