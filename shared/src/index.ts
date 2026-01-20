// Request Status
export type RequestStatus = 'PENDING' | 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

// Submission Status
export type SubmissionStatus = 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';

// Submission Method
export type SubmissionMethod = 'EMAIL' | 'DOWNLOAD' | 'PORTAL';

// Professor
export interface Professor {
  id: string;
  email: string;
  name: string;
  title?: string;
  department?: string;
  institution?: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

// Letter Request
export interface LetterRequest {
  id: string;
  accessCode: string;
  status: RequestStatus;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  programApplying?: string;
  institutionApplying?: string;
  degreeType?: string;
  courseTaken?: string;
  grade?: string;
  semesterYear?: string;
  relationshipDescription?: string;
  achievements?: string;
  personalStatement?: string;
  additionalNotes?: string;
  customFields?: Record<string, unknown>;
  deadline?: string;
  professorNotes?: string;
  codeGeneratedAt: string;
  studentSubmittedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents?: Document[];
  destinations?: SubmissionDestination[];
  letters?: Letter[];
}

// Document
export interface Document {
  id: string;
  requestId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
  label?: string;
  description?: string;
  createdAt: string;
}

// Template Variable
export interface TemplateVariable {
  name: string;
  description?: string;
  required?: boolean;
  category?: string;
  example?: string;
}

// Template
export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  variables?: TemplateVariable[];
  category?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Submission Destination
export interface SubmissionDestination {
  id: string;
  requestId: string;
  institutionName: string;
  programName?: string;
  recipientName?: string;
  recipientEmail?: string;
  portalUrl?: string;
  portalInstructions?: string;
  method: SubmissionMethod;
  status: SubmissionStatus;
  deadline?: string;
  sentAt?: string;
  confirmedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Letter
export interface Letter {
  id: string;
  requestId: string;
  templateId?: string;
  content: string;
  pdfPath?: string;
  pdfGeneratedAt?: string;
  version: number;
  isFinalized: boolean;
  createdAt: string;
  updatedAt: string;
  template?: Template;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  professor: Omit<Professor, 'passwordHash'>;
}

export interface SetupRequest {
  email: string;
  password: string;
  name: string;
  title?: string;
  department?: string;
  institution?: string;
}

// Create request types
export interface CreateRequestInput {
  deadline?: string;
  professorNotes?: string;
}

// Student submission types
export interface StudentSubmissionInput {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  programApplying?: string;
  institutionApplying?: string;
  degreeType?: string;
  courseTaken?: string;
  grade?: string;
  semesterYear?: string;
  relationshipDescription?: string;
  achievements?: string;
  personalStatement?: string;
  additionalNotes?: string;
}

export interface AddDestinationInput {
  institutionName: string;
  programName?: string;
  recipientName?: string;
  recipientEmail?: string;
  portalUrl?: string;
  portalInstructions?: string;
  method: SubmissionMethod;
  deadline?: string;
}

// Template types
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

// Letter generation
export interface GenerateLetterInput {
  requestId: string;
  templateId: string;
  variableOverrides?: Record<string, string>;
}

// System variables available for templates
export const SYSTEM_VARIABLES: TemplateVariable[] = [
  { name: 'student_name', description: 'Student full name', category: 'Student' },
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
