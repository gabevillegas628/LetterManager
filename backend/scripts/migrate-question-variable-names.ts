/**
 * Migration script to add variableName to existing custom questions.
 *
 * This script updates:
 * 1. Professor.customQuestions - adds variableName based on legacyField or label
 * 2. LetterRequest.questions - adds variableName to question snapshots
 *
 * Run with: npx tsx scripts/migrate-question-variable-names.ts
 */

import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OldCustomQuestion {
  id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string[];
  legacyField?: string;
}

interface NewCustomQuestion {
  id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string[];
  variableName: string;
}

// Map legacy field names to variable names
const legacyToVariable: Record<string, string> = {
  degreeType: 'degree_type',
  courseTaken: 'course_taken',
  grade: 'grade',
  semesterYear: 'semester_year',
  relationshipDescription: 'relationship_description',
  achievements: 'achievements',
  personalStatement: 'personal_statement',
  additionalNotes: 'additional_notes',
};

// Generate a variable name from a label
function generateVariableName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50) || 'variable';
}

// Convert an old question to a new question with variableName
function migrateQuestion(q: OldCustomQuestion & { variableName?: string }): NewCustomQuestion {
  // If already has variableName, keep it; otherwise generate from legacyField or label
  const variableName = q.variableName
    ? q.variableName
    : q.legacyField
      ? legacyToVariable[q.legacyField] || generateVariableName(q.label)
      : generateVariableName(q.label);

  // Return new question without legacyField
  return {
    id: q.id,
    type: q.type,
    label: q.label,
    description: q.description,
    placeholder: q.placeholder,
    required: q.required,
    order: q.order,
    options: q.options,
    variableName,
  };
}

async function main() {
  console.log('Starting migration to add variableName to custom questions...\n');

  // 1. Update professors' custom questions
  console.log('Updating professor custom questions...');
  const professors = await prisma.professor.findMany({
    where: {
      customQuestions: { not: Prisma.JsonNull },
    },
    select: {
      id: true,
      name: true,
      customQuestions: true,
    },
  });

  let professorCount = 0;
  for (const professor of professors) {
    const questions = professor.customQuestions as OldCustomQuestion[] | null;
    if (!questions || questions.length === 0) continue;

    // Check if migration is needed (any question missing variableName)
    const needsMigration = questions.some((q) => !('variableName' in q));
    if (!needsMigration) {
      console.log(`  - Professor "${professor.name}": already migrated`);
      continue;
    }

    const migratedQuestions = questions.map(migrateQuestion);

    await prisma.professor.update({
      where: { id: professor.id },
      data: { customQuestions: migratedQuestions as unknown as Prisma.InputJsonValue },
    });

    professorCount++;
    console.log(`  - Professor "${professor.name}": migrated ${questions.length} questions`);
  }

  console.log(`\nMigrated ${professorCount} professor(s)\n`);

  // 2. Update letter request question snapshots
  console.log('Updating letter request question snapshots...');
  const requests = await prisma.letterRequest.findMany({
    where: {
      questions: { not: Prisma.JsonNull },
    },
    select: {
      id: true,
      accessCode: true,
      studentName: true,
      questions: true,
    },
  });

  let requestCount = 0;
  for (const request of requests) {
    const questions = request.questions as OldCustomQuestion[] | null;
    if (!questions || questions.length === 0) continue;

    // Check if migration is needed
    const needsMigration = questions.some((q) => !('variableName' in q));
    if (!needsMigration) {
      console.log(`  - Request ${request.accessCode} (${request.studentName || 'no name'}): already migrated`);
      continue;
    }

    const migratedQuestions = questions.map(migrateQuestion);

    await prisma.letterRequest.update({
      where: { id: request.id },
      data: { questions: migratedQuestions as unknown as Prisma.InputJsonValue },
    });

    requestCount++;
    console.log(`  - Request ${request.accessCode} (${request.studentName || 'no name'}): migrated ${questions.length} questions`);
  }

  console.log(`\nMigrated ${requestCount} request(s)\n`);
  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
