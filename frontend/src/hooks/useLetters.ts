import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as lettersApi from '../api/letters.api'

export function useLettersForRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ['letters', 'request', requestId],
    queryFn: () => lettersApi.getLettersForRequest(requestId!),
    enabled: !!requestId,
  })
}

export function useLetter(id: string | undefined) {
  return useQuery({
    queryKey: ['letters', id],
    queryFn: () => lettersApi.getLetter(id!),
    enabled: !!id,
  })
}

export function useGenerateLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, templateId }: { requestId: string; templateId: string }) =>
      lettersApi.generateLetter(requestId, templateId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['letters', 'request', requestId] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useGenerateAllLetters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, templateId }: { requestId: string; templateId: string }) =>
      lettersApi.generateAllLetters(requestId, templateId),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['letters', 'request', requestId] })
      queryClient.invalidateQueries({ queryKey: ['letters', 'with-destinations', requestId] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useLettersWithDestinations(requestId: string | undefined) {
  return useQuery({
    queryKey: ['letters', 'with-destinations', requestId],
    queryFn: () => lettersApi.getLettersWithDestinations(requestId!),
    enabled: !!requestId,
  })
}

export function useMasterLetter(requestId: string | undefined) {
  return useQuery({
    queryKey: ['letters', 'master', requestId],
    queryFn: () => lettersApi.getMasterLetter(requestId!),
    enabled: !!requestId,
  })
}

export function useLetterForDestination(requestId: string | undefined, destinationId: string | undefined) {
  return useQuery({
    queryKey: ['letters', 'destination', requestId, destinationId],
    queryFn: () => lettersApi.getLetterForDestination(requestId!, destinationId!),
    enabled: !!requestId && !!destinationId,
  })
}

export function useSyncMasterToDestinations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (requestId: string) => lettersApi.syncMasterToDestinations(requestId),
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['letters', 'request', requestId] })
      queryClient.invalidateQueries({ queryKey: ['letters', 'with-destinations', requestId] })
    },
  })
}

export function useUpdateLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      lettersApi.updateLetter(id, content),
    onSuccess: (letter) => {
      queryClient.invalidateQueries({ queryKey: ['letters', letter.id] })
      queryClient.invalidateQueries({ queryKey: ['letters', 'request', letter.requestId] })
    },
  })
}

export function useDeleteLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => lettersApi.deleteLetter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] })
    },
  })
}

export function useFinalizeLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => lettersApi.finalizeLetter(id),
    onSuccess: (letter) => {
      queryClient.invalidateQueries({ queryKey: ['letters', letter.id] })
      queryClient.invalidateQueries({ queryKey: ['letters', 'request', letter.requestId] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useUnfinalizeLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => lettersApi.unfinalizeLetter(id),
    onSuccess: (letter) => {
      queryClient.invalidateQueries({ queryKey: ['letters', letter.id] })
      queryClient.invalidateQueries({ queryKey: ['letters', 'request', letter.requestId] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useGeneratePdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => lettersApi.generatePdf(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['letters', id] })
    },
  })
}

export function useDownloadPdf() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const blob = await lettersApi.downloadPdf(id)
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}

export function usePdfStatus(id: string | undefined) {
  return useQuery({
    queryKey: ['letters', id, 'pdf-status'],
    queryFn: () => lettersApi.getPdfStatus(id!),
    enabled: !!id,
  })
}

export function useSendLetter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ letterId, destinationId }: { letterId: string; destinationId: string }) =>
      lettersApi.sendLetter(letterId, destinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useMarkDestinationSent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (destinationId: string) => lettersApi.markDestinationSent(destinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useMarkDestinationConfirmed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (destinationId: string) => lettersApi.markDestinationConfirmed(destinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useResetDestinationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (destinationId: string) => lettersApi.resetDestinationStatus(destinationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useEmailStatus() {
  return useQuery({
    queryKey: ['email-status'],
    queryFn: lettersApi.getEmailStatus,
    staleTime: 60000, // Cache for 1 minute
  })
}
