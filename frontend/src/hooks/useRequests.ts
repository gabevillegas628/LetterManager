import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as requestsApi from '../api/requests.api'
import type { CreateRequestInput, RequestStatus } from 'shared'

export function useRequests(options?: requestsApi.ListRequestsOptions) {
  return useQuery({
    queryKey: ['requests', options],
    queryFn: () => requestsApi.listRequests(options),
  })
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: () => requestsApi.getRequest(id!),
    enabled: !!id,
  })
}

export function useRequestStats() {
  return useQuery({
    queryKey: ['request-stats'],
    queryFn: requestsApi.getRequestStats,
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRequestInput) => requestsApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['request-stats'] })
    },
  })
}

export function useUpdateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<requestsApi.ListRequestsOptions> }) =>
      requestsApi.updateRequest(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests', id] })
      queryClient.invalidateQueries({ queryKey: ['request-stats'] })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => requestsApi.deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['request-stats'] })
    },
  })
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      requestsApi.updateRequestStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests', id] })
      queryClient.invalidateQueries({ queryKey: ['request-stats'] })
    },
  })
}

export function useRegenerateAccessCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => requestsApi.regenerateAccessCode(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['requests', id] })
    },
  })
}
