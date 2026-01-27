// Request Status
export type RequestStatus = 'PENDING' | 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

// Submission Status
export type SubmissionStatus = 'PENDING' | 'SENT' | 'CONFIRMED' | 'FAILED';

// Submission Method
export type SubmissionMethod = 'EMAIL' | 'DOWNLOAD' | 'PORTAL';

// Custom Question Types
export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'email' | 'number';

// Legacy field mapping for backward compatibility
export type LegacyField =
  | 'degreeType'
  | 'courseTaken'
  | 'grade'
  | 'semesterYear'
  | 'relationshipDescription'
  | 'achievements'
  | 'personalStatement'
  | 'additionalNotes';

// Custom Question definition
export interface CustomQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string[]; // For select/multiselect
  legacyField?: LegacyField; // Maps to existing database fields for backward compat
}

// Default questions that match current hardcoded fields
export const DEFAULT_QUESTIONS: CustomQuestion[] = [
  {
    id: 'degree-type',
    type: 'select',
    label: 'Degree Being Sought',
    description: 'The degree you are applying for',
    required: false,
    order: 1,
    options: ['MD', 'MS', 'PhD', 'MBA', 'BS', 'Multiple', 'Other'],
    legacyField: 'degreeType',
  },
  {
    id: 'course-taken',
    type: 'text',
    label: 'Course Taken with Professor',
    placeholder: 'CS 101 - Intro to Programming',
    required: false,
    order: 2,
    legacyField: 'courseTaken',
  },
  {
    id: 'grade',
    type: 'text',
    label: 'Grade Received',
    placeholder: 'A',
    required: false,
    order: 3,
    legacyField: 'grade',
  },
  {
    id: 'semester-year',
    type: 'text',
    label: 'Semester/Year',
    placeholder: 'Fall 2024',
    required: false,
    order: 4,
    legacyField: 'semesterYear',
  },
  {
    id: 'relationship-description',
    type: 'textarea',
    label: 'Describe Your Relationship with the Professor',
    placeholder: 'How do you know the professor? What projects did you work on together?',
    required: false,
    order: 5,
    legacyField: 'relationshipDescription',
  },
  {
    id: 'achievements',
    type: 'textarea',
    label: 'Key Achievements',
    placeholder: 'List your notable achievements, awards, or accomplishments...',
    required: false,
    order: 6,
    legacyField: 'achievements',
  },
  {
    id: 'personal-statement',
    type: 'textarea',
    label: 'Personal Statement / Goals',
    placeholder: "Briefly describe your goals and why you're pursuing this program...",
    required: false,
    order: 7,
    legacyField: 'personalStatement',
  },
  {
    id: 'additional-notes',
    type: 'textarea',
    label: 'Additional Notes for Professor',
    placeholder: "Any other information you'd like your professor to know...",
    required: false,
    order: 8,
    legacyField: 'additionalNotes',
  },
];

// Header item types for PDF header configuration
export type HeaderItem = 'title' | 'department' | 'institution' | 'address' | 'email' | 'phone';

// PDF Header configuration
export interface HeaderConfig {
  showName: boolean;
  items: HeaderItem[];
}

// Default header configuration (matches original behavior)
export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  showName: true,
  items: ['title', 'department', 'institution', 'email']
};

// All available header items for the UI
export const ALL_HEADER_ITEMS: { key: HeaderItem; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'department', label: 'Department' },
  { key: 'institution', label: 'Institution' },
  { key: 'address', label: 'Address' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
];

// Professor
export interface Professor {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  title?: string;
  department?: string;
  institution?: string;
  address?: string;
  phone?: string;
  signature?: string;
  hasLetterhead?: boolean;
  hasSignature?: boolean;
  headerConfig?: HeaderConfig;
  customQuestions?: CustomQuestion[];
  createdAt: string;
  updatedAt: string;
}

// Letter Request
export interface LetterRequest {
  id: string;
  professorId: string;
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
  questions?: CustomQuestion[]; // Snapshot of questions at request creation
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
  professorId: string;
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

// Admin: Create professor input
export interface CreateProfessorInput {
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
