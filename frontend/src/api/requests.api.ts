import { api } from './client'
import type { LetterRequest, RequestStatus, CreateRequestInput } from 'shared'

export interface RequestStats {
  total: number
  pending: number
  submitted: number
  inProgress: number
  completed: number
  upcomingDeadlines: LetterRequest[]
}

export interface ListRequestsOptions {
  status?: RequestStatus
  search?: string
  limit?: number
  offset?: number
}

export async function listRequests(options?: ListRequestsOptions) {
  const params = new URLSearchParams()
  if (options?.status) params.set('status', options.status)
  if (options?.search) params.set('search', options.search)
  if (options?.limit) params.set('limit', options.limit.toString())
  if (options?.offset) params.set('offset', options.offset.toString())

  const response = await api.get(`/requests?${params}`)
  return {
    requests: response.data.data as LetterRequest[],
    total: response.data.total as number,
  }
}

export async function getRequest(id: string) {
  const response = await api.get(`/requests/${id}`)
  return response.data.data as LetterRequest
}

export async function createRequest(data: CreateRequestInput) {
  const response = await api.post('/requests', data)
  return response.data.data as LetterRequest
}

export async function updateRequest(id: string, data: Partial<LetterRequest>) {
  const response = await api.put(`/requests/${id}`, data)
  return response.data.data as LetterRequest
}

export async function deleteRequest(id: string) {
  const response = await api.delete(`/requests/${id}`)
  return response.data
}

export async function updateRequestStatus(id: string, status: RequestStatus) {
  const response = await api.patch(`/requests/${id}/status`, { status })
  return response.data.data as LetterRequest
}

export async function regenerateAccessCode(id: string) {
  const response = await api.post(`/requests/${id}/regenerate-code`)
  return response.data.data as LetterRequest
}

export async function getRequestStats() {
  const response = await api.get('/requests/stats')
  return response.data.data as RequestStats
}
