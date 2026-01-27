import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { SubmissionMethod, CustomQuestion } from 'shared'

// Types
export interface StudentRequest {
  id: string
  accessCode: string
  status: string
  studentName: string | null
  studentEmail: string | null
  studentPhone: string | null
  programApplying: string | null
  institutionApplying: string | null
  degreeType: string | null
  courseTaken: string | null
  grade: string | null
  semesterYear: string | null
  relationshipDescription: string | null
  achievements: string | null
  personalStatement: string | null
  additionalNotes: string | null
  customFields: Record<string, unknown> | null
  questions: CustomQuestion[] | null // Custom questions for dynamic form
  deadline: string | null
  documents: Document[]
  destinations: Destination[]
}

export interface Document {
  id: string
  originalName: string
  mimeType: string
  size: number
  label: string | null
  description: string | null
  createdAt: string
}

export interface Destination {
  id: string
  institutionName: string
  programName: string | null
  recipientName: string | null
  recipientEmail: string | null
  portalUrl: string | null
  portalInstructions: string | null
  method: SubmissionMethod
  deadline: string | null
}

export interface StudentInfoInput {
  studentName: string
  studentEmail: string
  studentPhone?: string
  programApplying?: string
  institutionApplying?: string
  degreeType?: string
  courseTaken?: string
  grade?: string
  semesterYear?: string
  relationshipDescription?: string
  achievements?: string
  personalStatement?: string
  additionalNotes?: string
  customFields?: Record<string, unknown>
}

export interface DestinationInput {
  institutionName: string
  programName?: string
  recipientName?: string
  recipientEmail?: string
  portalUrl?: string
  portalInstructions?: string
  method: SubmissionMethod
  deadline?: string
}

// Custom error class for validation errors with details
export class ValidationError extends Error {
  reason?: 'not_found' | 'in_progress' | 'completed' | 'archived'
  professorEmail?: string

  constructor(message: string, reason?: string, professorEmail?: string) {
    super(message)
    this.reason = reason as ValidationError['reason']
    this.professorEmail = professorEmail
  }
}

// Validate access code
export function useValidateCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      try {
        const response = await api.post('/student/validate-code', { code })
        return response.data.data as { valid: boolean; status: string }
      } catch (err: unknown) {
        // Extract error details from axios error response
        const axiosError = err as { response?: { data?: { reason?: string; professorEmail?: string } } }
        if (axiosError.response?.data?.reason) {
          throw new ValidationError(
            'Invalid access code',
            axiosError.response.data.reason,
            axiosError.response.data.professorEmail
          )
        }
        throw err
      }
    },
  })
}

// Get request by code
export function useStudentRequest(code: string | undefined) {
  return useQuery({
    queryKey: ['studentRequest', code],
    queryFn: async () => {
      if (!code) throw new Error('Code is required')
      try {
        const response = await api.get(`/student/${code}`)
        return response.data.data as StudentRequest
      } catch (err: unknown) {
        // Extract error details from axios error response
        const axiosError = err as { response?: { data?: { reason?: string; professorEmail?: string } } }
        if (axiosError.response?.data?.reason) {
          throw new ValidationError(
            'Request not accessible',
            axiosError.response.data.reason,
            axiosError.response.data.professorEmail
          )
        }
        throw err
      }
    },
    enabled: !!code,
    retry: false,
  })
}

// Update student info
export function useUpdateStudentInfo(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StudentInfoInput) => {
      const response = await api.put(`/student/${code}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}

// Upload documents
export function useUploadDocuments(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ files, label, description }: { files: File[]; label?: string; description?: string }) => {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      if (label) formData.append('label', label)
      if (description) formData.append('description', description)

      const response = await api.post(`/student/${code}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data as { uploaded: Document[]; rejected?: string[] }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}

// Delete document
export function useDeleteDocument(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/student/${code}/documents/${documentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}

// Add destination
export function useAddDestination(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: DestinationInput) => {
      const response = await api.post(`/student/${code}/destinations`, data)
      return response.data.data as Destination
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}

// Update destination
export function useUpdateDestination(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ destinationId, data }: { destinationId: string; data: DestinationInput }) => {
      const response = await api.put(`/student/${code}/destinations/${destinationId}`, data)
      return response.data.data as Destination
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}

// Delete destination
export function useDeleteDestination(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (destinationId: string) => {
      await api.delete(`/student/${code}/destinations/${destinationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}

// Final submit
export function useSubmitRequest(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`/student/${code}/submit`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentRequest', code] })
    },
  })
}
