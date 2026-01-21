import { api } from './client'
import type { Template, CreateTemplateInput, UpdateTemplateInput, TemplateVariable } from 'shared'

export async function listTemplates(options?: { activeOnly?: boolean; category?: string }) {
  const params = new URLSearchParams()
  if (options?.activeOnly) params.set('activeOnly', 'true')
  if (options?.category) params.set('category', options.category)

  const response = await api.get(`/templates?${params}`)
  return response.data.data as Template[]
}

export async function getTemplate(id: string) {
  const response = await api.get(`/templates/${id}`)
  return response.data.data as Template
}

export async function createTemplate(data: CreateTemplateInput) {
  const response = await api.post('/templates', data)
  return response.data.data as Template
}

export async function updateTemplate(id: string, data: UpdateTemplateInput) {
  const response = await api.put(`/templates/${id}`, data)
  return response.data.data as Template
}

export async function deleteTemplate(id: string) {
  const response = await api.delete(`/templates/${id}`)
  return response.data
}

export async function duplicateTemplate(id: string) {
  const response = await api.post(`/templates/${id}/duplicate`)
  return response.data.data as Template
}

export async function getTemplateVariables() {
  const response = await api.get('/templates/variables/list')
  return response.data.data as TemplateVariable[]
}

export async function previewTemplate(id: string, variables?: Record<string, string>) {
  const response = await api.post(`/templates/${id}/preview`, { variables })
  return response.data.data as { preview: string; variables: Record<string, string> }
}

export async function previewTemplatePdf(content: string): Promise<Blob> {
  const response = await api.post('/templates/preview-pdf', { content }, { responseType: 'blob' })
  return response.data as Blob
}
