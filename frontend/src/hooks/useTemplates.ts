import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as templatesApi from '../api/templates.api'
import type { CreateTemplateInput, UpdateTemplateInput } from 'shared'

export function useTemplates(options?: { activeOnly?: boolean; category?: string }) {
  return useQuery({
    queryKey: ['templates', options],
    queryFn: () => templatesApi.listTemplates(options),
  })
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => templatesApi.getTemplate(id!),
    enabled: !!id,
  })
}

export function useTemplateVariables() {
  return useQuery({
    queryKey: ['template-variables'],
    queryFn: templatesApi.getTemplateVariables,
    staleTime: Infinity, // Variables don't change
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTemplateInput) => templatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) =>
      templatesApi.updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['templates', id] })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => templatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => templatesApi.duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export function usePreviewTemplate() {
  return useMutation({
    mutationFn: ({ id, variables }: { id: string; variables?: Record<string, string> }) =>
      templatesApi.previewTemplate(id, variables),
  })
}

export function usePreviewTemplatePdf() {
  return useMutation({
    mutationFn: (content: string) => templatesApi.previewTemplatePdf(content),
  })
}
