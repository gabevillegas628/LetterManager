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

// Build variables from request and professor data, with optional destination override
async function buildVariables(
  requestId: string,
  destination?: Pick<SubmissionDestination, 'institutionName' | 'programName'> | null
): Promise<Record<string, string>> {
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  const professor = await prisma.professor.findFirst();

  const variables: Record<string, string> = {
    // Student info
    student_name: request.studentName || '',
    student_email: request.studentEmail || '',
    student_phone: request.studentPhone || '',

    // Application info - use destination data if provided, fall back to request
    program: destination?.programName || request.programApplying || '',
    institution: destination?.institutionName || request.institutionApplying || '',
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
export async function generateLetter(data: GenerateLetterInput) {
  const { requestId, templateId } = data;

  // Verify request exists and is in correct status
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.status !== 'SUBMITTED' && request.status !== 'IN_PROGRESS') {
    throw new AppError('Request must be submitted before generating a letter', 400);
  }

  // Get template
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Build variables and interpolate
  const variables = await buildVariables(requestId);
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
export async function getLetter(id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: {
      template: {
        select: { id: true, name: true },
      },
      request: {
        select: {
          id: true,
          accessCode: true,
          studentName: true,
          studentEmail: true,
          status: true,
        },
      },
    },
  });

  if (!letter) {
    throw new AppError('Letter not found', 404);
  }

  return letter;
}

// Get letters for a request
export async function getLettersForRequest(requestId: string) {
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
export async function updateLetter(id: string, data: UpdateLetterInput) {
  const letter = await prisma.letter.findUnique({
    where: { id },
  });

  if (!letter) {
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
export async function finalizeLetter(id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
  });

  if (!letter) {
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

  // Update request status to COMPLETED
  await prisma.letterRequest.update({
    where: { id: letter.requestId },
    data: { status: 'COMPLETED' },
  });

  return finalized;
}

// Unfinalize letter (allow editing again)
export async function unfinalizeLetter(id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
  });

  if (!letter) {
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

  // Update request status back to IN_PROGRESS
  await prisma.letterRequest.update({
    where: { id: letter.requestId },
    data: { status: 'IN_PROGRESS' },
  });

  return unfinalized;
}

// Delete letter
export async function deleteLetter(id: string) {
  const letter = await prisma.letter.findUnique({
    where: { id },
  });

  if (!letter) {
    throw new AppError('Letter not found', 404);
  }

  await prisma.letter.delete({
    where: { id },
  });

  return { message: 'Letter deleted' };
}

// Generate letters for all destinations (master + per-destination)
export async function generateLettersForAllDestinations(data: GenerateLetterInput) {
  const { requestId, templateId } = data;

  // Verify request exists and get destinations
  const request = await prisma.letterRequest.findUnique({
    where: { id: requestId },
    include: { destinations: true },
  });

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.status !== 'SUBMITTED' && request.status !== 'IN_PROGRESS') {
    throw new AppError('Request must be submitted before generating letters', 400);
  }

  // Get template
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // First generate/update the master letter
  const masterVariables = await buildVariables(requestId);
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
export async function getLetterForDestination(requestId: string, destinationId: string) {
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
export async function getMasterLetter(requestId: string) {
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
export async function syncMasterToDestinations(requestId: string) {
  // Get master letter
  const masterLetter = await prisma.letter.findFirst({
    where: { requestId, isMaster: true },
    orderBy: { version: 'desc' },
    include: { template: true },
  });

  if (!masterLetter) {
    throw new AppError('No master letter found', 404);
  }

  if (!masterLetter.template) {
    throw new AppError('Master letter has no template', 400);
  }

  // Get all destinations
  const destinations = await prisma.submissionDestination.findMany({
    where: { requestId },
  });

  const updatedLetters = [];
  for (const destination of destinations) {
    // Build destination-specific variables and interpolate master template
    const destVariables = await buildVariables(requestId, destination);
    const destContent = interpolateTemplate(masterLetter.template.content, destVariables);

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

// Get all letters for a request organized by destination
export async function getLettersWithDestinations(requestId: string) {
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
