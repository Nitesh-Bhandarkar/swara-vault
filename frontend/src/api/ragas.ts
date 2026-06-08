import client from './client'
import type { Raga, Page, Composition } from '../types'

export const searchRagas = (q?: string, janya?: boolean, page = 0, size = 20) =>
  client.get<Page<Raga>>('/ragas', { params: { q, janya, page, size } })

export const getMelakarataRagas = () =>
  client.get<Raga[]>('/ragas/melakarta')

export const getRaga = (id: string) =>
  client.get<Raga>(`/ragas/${id}`)

export const createRaga = (data: Partial<Raga> & { janakaRagaId?: string }) =>
  client.post<Raga>('/ragas', data)

export const updateRaga = (id: string, data: Partial<Raga> & { janakaRagaId?: string }) =>
  client.put<Raga>(`/ragas/${id}`, data)

export const deleteRaga = (id: string) =>
  client.delete(`/ragas/${id}`)

export const addComposition = (ragaId: string, data: Omit<Composition, 'id'>) =>
  client.post<Composition>(`/ragas/${ragaId}/compositions`, data)

export const updateComposition = (ragaId: string, compositionId: string, data: Omit<Composition, 'id'>) =>
  client.put<Composition>(`/ragas/${ragaId}/compositions/${compositionId}`, data)

export const deleteComposition = (ragaId: string, compositionId: string) =>
  client.delete(`/ragas/${ragaId}/compositions/${compositionId}`)

export const getUploadUrl = (ragaId: string, filename: string, contentType: string, compositionId?: string) =>
  client.post<{ uploadUrl: string; publicUrl: string; fileKey: string }>('/storage/upload-url', {
    ragaId, filename, contentType, compositionId,
  })

export const uploadToR2 = (uploadUrl: string, file: File) =>
  fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

export const importRagas = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<{ imported: number; ragas: Raga[] }>('/import/ragas', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
