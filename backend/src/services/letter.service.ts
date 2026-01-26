import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { interpolateTemplate } from './template.service.js';
import type { SubmissionDestination } from '@prisma/client';

export interface GenerateLetterInput {
  requestId: string;
  templateId: string;
}

export interface UpdateLetterInput {
  content: string;
}

// Placeholders used in master letters for destination-specific values
export const PLACEHOLDER_INSTITUTION = '[INSTITUTION]';
export const PLACEHOLDER_PROGRAM = '[PROGRAM]';

// Build variables from request and professor data, with optional destination override
async function buildVariables(
  requestId: string,
  destination?: Pick<SubmissionDestination, 'institutionName' | 'programName'> | null,
  usePlaceholders?: boolean
): Promise<Record<string, string>> {
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    include: { professor: true },
  });

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  const professor = request.professor;

  // For master letters, use placeholders; for destination letters, use actual values
  let programValue: string;
  let institutionValue: string;

  if (usePlaceholders) {
    // Master letter: use placeholders
    programValue = PLACEHOLDER_PROGRAM;
    institutionValue = PLACEHOLDER_INSTITUTION;
  } else if (destination) {
    // Destination letter: use destination-specific values
    programValue = destination.programName || request.programApplying || '';
    institutionValue = destination.institutionName || request.institutionApplying || '';
  } else {
    // Fallback: use request values
    programValue = request.programApplying || '';
    institutionValue = request.institutionApplying || '';
  }

  const variables: Record<string, string> = {
    // Student info
    student_name: request.studentName || '',
    student_first_name: request.studentName?.split(' ')[0] || '',
    student_email: request.studentEmail || '',
    student_phone: request.studentPhone || '',

    // Application info
    program: programValue,
    institution: institutionValue,
    degree_type: request.degreeType || '',

    // Academic info
    course_taken: request.courseTaken || '',
    grade: request.grade || '',
    semester_year: request.semesterYear || '',

    // Professor info
    professor_name: professor?.name || '',
    professor_title: professor?.title || '',
    department: professor?.department || '',
    professor_institution: professor?.institution || '',

    // System
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  return variables;
}

// Generate a letter from a template
export async function generateLetter(professorId: string, data: GenerateLetterInput) {
  const { requestId, templateId } = data;

  // Verify request exists, belongs to professor, and is in correct status
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  if (request.status !== 'SUBMITTED' && request.status !== 'IN_PROGRESS') {
    throw new AppError('Request must be submitted before generating a letter', 400);
  }

  // Get template (must belong to same professor)
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template || template.professorId !== professorId) {
    throw new AppError('Template not found', 404);
  }

  // Build variables and interpolate (with placeholders for master letter)
  const variables = await buildVariables(requestId, null, true);
  const content = interpolateTemplate(template.content, variables);

  let letter;

  // Find existing master letter (no destinationId)
  const existingMaster = await prisma.letter.findFirst({
    where: { requestId, destinationId: null },
    orderBy: { version: 'desc' },
  });

  if (existingMaster && !existingMaster.isFinalized) {
    // Update existing draft master
    letter = await prisma.letter.update({
      where: { id: existingMaster.id },
      data: {
        content,
        templateId,
        version: existingMaster.version + 1,
        isMaster: true,
      },
    });
  } else if (existingMaster && existingMaster.isFinalized) {
    // Create new version if previous was finalized
    letter = await prisma.letter.create({
      data: {
        requestId,
        templateId,
        content,
        version: existingMaster.version + 1,
        isMaster: true,
      },
    });
  } else {
    // Create first master letter
    letter = await prisma.letter.create({
      data: {
        requestId,
        templateId,
        content,
        version: 1,
        isMaster: true,
      },
    });
  }

  // Update request status to IN_PROGRESS
  await prisma.letterRequest.update({
    where: { id: requestId },
    data: { status: 'IN_PROGRESS' },
  });

  return letter;
}

// Get letter by ID
export async function getLetter(professorId: string, id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: {
      template: {
        select: { id: true, name: true },
      },
      request: {
        select: {
          id: true,
          professorId: true,
          accessCode: true,
          studentName: true,
          studentEmail: true,
          status: true,
        },
      },
    },
  });

  if (!letter || letter.request.professorId !== professorId) {
    throw new AppError('Letter not found', 404);
  }

  return letter;
}

// Get letters for a request
export async function getLettersForRequest(professorId: string, requestId: string) {
  // Verify request belongs to professor
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    select: { professorId: true },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const letters = await prisma.letter.findMany({
    where: { requestId },
    include: {
      template: {
        select: { id: true, name: true },
      },
    },
    orderBy: { version: 'desc' },
  });

  return letters;
}

// Update letter content
export async function updateLetter(professorId: string, id: string, data: UpdateLetterInput) {
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: { request: { select: { professorId: true } } },
  });

  if (!letter || letter.request.professorId !== professorId) {
    throw new AppError('Letter not found', 404);
  }

  if (letter.isFinalized) {
    throw new AppError('Cannot edit a finalized letter', 400);
  }

  const updated = await prisma.letter.update({
    where: { id },
    data: {
      content: data.content,
    },
  });

  return updated;
}

// Finalize letter (lock from editing)
export async function finalizeLetter(professorId: string, id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: { request: { select: { professorId: true } } },
  });

  if (!letter || letter.request.professorId !== professorId) {
    throw new AppError('Letter not found', 404);
  }

  if (letter.isFinalized) {
    throw new AppError('Letter is already finalized', 400);
  }

  const finalized = await prisma.letter.update({
    where: { id },
    data: {
      isFinalized: true,
    },
  });

  // Note: Request status stays IN_PROGRESS until all destinations are SENT/CONFIRMED
  // The status will be updated to COMPLETED by the email service when appropriate

  return finalized;
}

// Unfinalize letter (allow editing again)
export async function unfinalizeLetter(professorId: string, id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: { request: { select: { professorId: true } } },
  });

  if (!letter || letter.request.professorId !== professorId) {
    throw new AppError('Letter not found', 404);
  }

  if (!letter.isFinalized) {
    throw new AppError('Letter is not finalized', 400);
  }

  const unfinalized = await prisma.letter.update({
    where: { id },
    data: {
      isFinalized: false,
    },
  });

  // Note: Request status is based on destination statuses, not letter finalization
  // No status change needed here

  return unfinalized;
}

// Delete letter
export async function deleteLetter(professorId: string, id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: { request: { select: { professorId: true } } },
  });

  if (!letter || letter.request.professorId !== professorId) {
    throw new AppError('Letter not found', 404);
  }

  await prisma.letter.delete({
    where: { id },
  });

  return { message: 'Letter deleted' };
}

// Delete all letters for a request (allows starting fresh)
export async function deleteAllLettersForRequest(professorId: string, requestId: string) {
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const deleted = await prisma.letter.deleteMany({
    where: { requestId },
  });

  // Reset request status back to SUBMITTED so they can generate again
  if (request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') {
    await prisma.letterRequest.update({
      where: { id: requestId },
      data: { status: 'SUBMITTED' },
    });
  }

  return { message: `Deleted ${deleted.count} letters` };
}

// Generate letters for all destinations (master + per-destination)
export async function generateLettersForAllDestinations(professorId: string, data: GenerateLetterInput) {
  const { requestId, templateId } = data;

  // Verify request exists, belongs to professor, and get destinations
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    include: { destinations: true },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  if (request.status !== 'SUBMITTED' && request.status !== 'IN_PROGRESS') {
    throw new AppError('Request must be submitted before generating letters', 400);
  }

  // Get template (must belong to same professor)
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template || template.professorId !== professorId) {
    throw new AppError('Template not found', 404);
  }

  // First generate/update the master letter (with placeholders for institution/program)
  const masterVariables = await buildVariables(requestId, null, true);
  const masterContent = interpolateTemplate(template.content, masterVariables);

  const existingMaster = await prisma.letter.findFirst({
    where: { requestId, destinationId: null },
    orderBy: { version: 'desc' },
  });

  let masterLetter;
  if (existingMaster && !existingMaster.isFinalized) {
    masterLetter = await prisma.letter.update({
      where: { id: existingMaster.id },
      data: {
        content: masterContent,
        templateId,
        version: existingMaster.version + 1,
        isMaster: true,
      },
    });
  } else {
    masterLetter = await prisma.letter.create({
      data: {
        requestId,
        templateId,
        content: masterContent,
        version: existingMaster ? existingMaster.version + 1 : 1,
        isMaster: true,
      },
    });
  }

  // Generate a letter for each destination
  const destinationLetters = [];
  for (const destination of request.destinations) {
    const destVariables = await buildVariables(requestId, destination);
    const destContent = interpolateTemplate(template.content, destVariables);

    const existingDestLetter = await prisma.letter.findFirst({
      where: { requestId, destinationId: destination.id },
      orderBy: { version: 'desc' },
    });

    let destLetter;
    if (existingDestLetter && !existingDestLetter.isFinalized) {
      destLetter = await prisma.letter.update({
        where: { id: existingDestLetter.id },
        data: {
          content: destContent,
          templateId,
          version: existingDestLetter.version + 1,
        },
      });
    } else {
      destLetter = await prisma.letter.create({
        data: {
          requestId,
          templateId,
          destinationId: destination.id,
          content: destContent,
          version: existingDestLetter ? existingDestLetter.version + 1 : 1,
          isMaster: false,
        },
      });
    }
    destinationLetters.push(destLetter);
  }

  // Update request status to IN_PROGRESS
  await prisma.letterRequest.update({
    where: { id: requestId },
    data: { status: 'IN_PROGRESS' },
  });

  return {
    master: masterLetter,
    destinationLetters,
  };
}

// Get letter for a specific destination
export async function getLetterForDestination(professorId: string, requestId: string, destinationId: string) {
  // Verify request belongs to professor
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    select: { professorId: true },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const letter = await prisma.letter.findFirst({
    where: { requestId, destinationId },
    orderBy: { version: 'desc' },
    include: {
      template: { select: { id: true, name: true } },
      destination: {
        select: { id: true, institutionName: true, programName: true },
      },
    },
  });

  return letter;
}

// Get master letter for a request
export async function getMasterLetter(professorId: string, requestId: string) {
  // Verify request belongs to professor
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    select: { professorId: true },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const letter = await prisma.letter.findFirst({
    where: { requestId, isMaster: true },
    orderBy: { version: 'desc' },
    include: {
      template: { select: { id: true, name: true } },
    },
  });

  return letter;
}

// Sync master letter content to all destination letters
// This copies the master's actual content, replacing [INSTITUTION] and [PROGRAM] placeholders
export async function syncMasterToDestinations(professorId: string, requestId: string) {
  // Get the request and verify ownership
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  // Get master letter
  const masterLetter = await prisma.letter.findFirst({
    where: { requestId, isMaster: true },
    orderBy: { version: 'desc' },
  });

  if (!masterLetter) {
    throw new AppError('No master letter found', 404);
  }

  // Get all destinations
  const destinations = await prisma.submissionDestination.findMany({
    where: { requestId },
  });

  const updatedLetters = [];
  for (const destination of destinations) {
    // Copy master content and replace placeholders with destination-specific values
    let destContent = masterLetter.content;

    // Replace placeholders with destination-specific values (or request fallback)
    const institutionValue = destination.institutionName || request.institutionApplying || '';
    const programValue = destination.programName || request.programApplying || '';

    destContent = destContent.replace(
      new RegExp(escapeRegExp(PLACEHOLDER_INSTITUTION), 'g'),
      institutionValue
    );
    destContent = destContent.replace(
      new RegExp(escapeRegExp(PLACEHOLDER_PROGRAM), 'g'),
      programValue
    );

    const existingDestLetter = await prisma.letter.findFirst({
      where: { requestId, destinationId: destination.id },
      orderBy: { version: 'desc' },
    });

    let destLetter;
    if (existingDestLetter && !existingDestLetter.isFinalized) {
      destLetter = await prisma.letter.update({
        where: { id: existingDestLetter.id },
        data: {
          content: destContent,
          templateId: masterLetter.templateId,
          version: existingDestLetter.version + 1,
        },
      });
    } else {
      destLetter = await prisma.letter.create({
        data: {
          requestId,
          templateId: masterLetter.templateId,
          destinationId: destination.id,
          content: destContent,
          version: existingDestLetter ? existingDestLetter.version + 1 : 1,
          isMaster: false,
        },
      });
    }
    updatedLetters.push(destLetter);
  }

  return updatedLetters;
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get all letters for a request organized by destination
export async function getLettersWithDestinations(professorId: string, requestId: string) {
  // Verify request belongs to professor
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    select: { professorId: true },
  });

  if (!request || request.professorId !== professorId) {
    throw new AppError('Request not found', 404);
  }

  const letters = await prisma.letter.findMany({
    where: { requestId },
    include: {
      template: { select: { id: true, name: true } },
      destination: {
        select: { id: true, institutionName: true, programName: true },
      },
    },
    orderBy: [{ destinationId: 'asc' }, { version: 'desc' }],
  });

  // Separate master and destination letters
  const master = letters.find((l) => l.isMaster);
  const byDestination = letters.filter((l) => l.destinationId);

  return { master, byDestination };
}
