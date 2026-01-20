import { prisma } from '../db/index.js';
import { AppError } from '../middleware/error.middleware.js';
import type { TemplateVariable } from 'shared';

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content: string;
  variables?: TemplateVariable[];
  category?: string;
  isDefault?: boolean;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  isActive?: boolean;
}

export async function listTemplates(options?: {
  activeOnly?: boolean;
  category?: string;
}) {
  const where: {
    isActive?: boolean;
    category?: string;
  } = {};

  if (options?.activeOnly) {
    where.isActive = true;
  }

  if (options?.category) {
    where.category = options.category;
  }

  const templates = await prisma.template.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });

  return templates;
}

export async function getTemplate(id: string) {
  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  return template;
}

export async function createTemplate(data: CreateTemplateInput) {
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await prisma.template.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.template.create({
    data: {
      name: data.name,
      description: data.description,
      content: data.content,
      variables: data.variables as object[],
      category: data.category,
      isDefault: data.isDefault || false,
    },
  });

  return template;
}

export async function updateTemplate(id: string, data: UpdateTemplateInput) {
  const existing = await prisma.template.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Template not found', 404);
  }

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.template.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const template = await prisma.template.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.content && { content: data.content }),
      ...(data.variables && { variables: data.variables as object[] }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });

  return template;
}

export async function deleteTemplate(id: string) {
  const existing = await prisma.template.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Template not found', 404);
  }

  await prisma.template.delete({
    where: { id },
  });

  return { message: 'Template deleted' };
}

export async function duplicateTemplate(id: string) {
  const existing = await prisma.template.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Template not found', 404);
  }

  const template = await prisma.template.create({
    data: {
      name: `${existing.name} (Copy)`,
      description: existing.description,
      content: existing.content,
      variables: existing.variables as object[],
      category: existing.category,
      isDefault: false,
    },
  });

  return template;
}

// Interpolate variables in template content
export function interpolateTemplate(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    result = result.replace(regex, value || '');
  }

  return result;
}

// Get sample data for preview
export function getSampleVariables(): Record<string, string> {
  return {
    student_name: 'Jane Smith',
    student_first_name: 'Jane',
    student_email: 'jane.smith@example.com',
    program: 'Master of Science in Computer Science',
    institution: 'Stanford University',
    degree_type: 'MS',
    course_taken: 'CS 101 - Introduction to Programming',
    grade: 'A',
    semester_year: 'Fall 2024',
    professor_name: 'Dr. John Doe',
    professor_title: 'Associate Professor',
    department: 'Computer Science',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

// System variables available for templates
export const SYSTEM_VARIABLES: TemplateVariable[] = [
  { name: 'student_name', description: 'Student full name', category: 'Student' },
  { name: 'student_first_name', description: 'Student first name', category: 'Student' },
  { name: 'student_email', description: 'Student email', category: 'Student' },
  { name: 'program', description: 'Program applying to', category: 'Application' },
  { name: 'institution', description: 'Institution applying to', category: 'Application' },
  { name: 'degree_type', description: 'Degree type (MS, PhD, etc.)', category: 'Application' },
  { name: 'course_taken', description: 'Course taken with professor', category: 'Academic' },
  { name: 'grade', description: 'Grade in course', category: 'Academic' },
  { name: 'semester_year', description: 'Semester and year', category: 'Academic' },
  { name: 'professor_name', description: 'Professor name', category: 'Professor' },
  { name: 'professor_title', description: 'Professor title', category: 'Professor' },
  { name: 'department', description: 'Department name', category: 'Professor' },
  { name: 'date', description: 'Current date', category: 'System' },
];
