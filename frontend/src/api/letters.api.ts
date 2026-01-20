import { api } from './client'

export interface LetterDestination {
  id: string
  institutionName: string
  programName: string | null
}

export interface Letter {
  id: string
  requestId: string
  templateId: string | null
  destinationId: string | null
  content: string
  pdfPath: string | null
  pdfGeneratedAt: string | null
  version: number
  isFinalized: boolean
  isMaster: boolean
  createdAt: string
  updatedAt: string
  template?: {
    id: string
    name: string
  }
  request?: {
    id: string
    accessCode: string
    studentName: string | null
    studentEmail: string | null
    status: string
  }
  destination?: LetterDestination
}

export interface GenerateAllResult {
  master: Letter
  destinationLetters: Letter[]
}

export interface LettersWithDestinations {
  master: Letter | null
  byDestination: Letter[]
}

export async function generateLetter(requestId: string, templateId: string) {
  const response = await api.post('/letters/generate', { requestId, templateId })
  return response.data.data as Letter
}

export async function generateAllLetters(requestId: string, templateId: string) {
  const response = await api.post('/letters/generate-all', { requestId, templateId })
  return response.data.data as GenerateAllResult
}

export async function getLettersForRequest(requestId: string) {
  const response = await api.get(`/letters/request/${requestId}`)
  return response.data.data as Letter[]
}

export async function getLettersWithDestinations(requestId: string) {
  const response = await api.get(`/letters/request/${requestId}/with-destinations`)
  return response.data.data as LettersWithDestinations
}

export async function getMasterLetter(requestId: string) {
  const response = await api.get(`/letters/request/${requestId}/master`)
  return response.data.data as Letter | null
}

export async function getLetterForDestination(requestId: string, destinationId: string) {
  const response = await api.get(`/letters/request/${requestId}/destination/${destinationId}`)
  return response.data.data as Letter | null
}

export async function syncMasterToDestinations(requestId: string) {
  const response = await api.post(`/letters/request/${requestId}/sync`)
  return response.data.data as Letter[]
}

export async function getLetter(id: string) {
  const response = await api.get(`/letters/${id}`)
  return response.data.data as Letter
}

export async function updateLetter(id: string, content: string) {
  const response = await api.put(`/letters/${id}`, { content })
  return response.data.data as Letter
}

export async function deleteLetter(id: string) {
  const response = await api.delete(`/letters/${id}`)
  return response.data
}

export async function finalizeLetter(id: string) {
  const response = await api.post(`/letters/${id}/finalize`)
  return response.data.data as Letter
}

export async function unfinalizeLetter(id: string) {
  const response = await api.post(`/letters/${id}/unfinalize`)
  return response.data.data as Letter
}

export async function generatePdf(id: string) {
  const response = await api.post(`/letters/${id}/pdf`)
  return response.data.data as { path: string; message: string }
}

export async function downloadPdf(id: string) {
  const response = await api.get(`/letters/${id}/pdf`, {
    responseType: 'blob',
  })
  return response.data as Blob
}

export async function getPdfStatus(id: string) {
  const response = await api.get(`/letters/${id}/pdf/status`)
  return response.data.data as { isUpToDate: boolean }
}

export async function sendLetter(letterId: string, destinationId: string) {
  const response = await api.post(`/letters/${letterId}/send`, { destinationId })
  return response.data
}

export async function markDestinationSent(destinationId: string) {
  const response = await api.post(`/letters/destination/${destinationId}/mark-sent`)
  return response.data
}

export async function markDestinationConfirmed(destinationId: string) {
  const response = await api.post(`/letters/destination/${destinationId}/confirm`)
  return response.data
}

export async function resetDestinationStatus(destinationId: string) {
  const response = await api.post(`/letters/destination/${destinationId}/reset`)
  return response.data
}

export async function getEmailStatus() {
  const response = await api.get('/letters/email/status')
  return response.data.data as { isConfigured: boolean }
}
