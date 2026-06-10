export type CompositionType = 'GEETHE' | 'KRUTHI' | 'KEERTANE' | 'VARNA'

export interface Composition {
  id: string
  type: CompositionType
  name: string
  tala: string
  description: string | null
  audioUrls: string[]
}

export interface Raga {
  id: string
  name: string
  janya: boolean
  janakaRagaId: string | null
  janakaRagaName: string | null
  melakarataNumber: number | null
  arohana: string | null
  arohanaAudioUrl: string | null
  avarohana: string | null
  avarohanaAudioUrl: string | null
  seeded: boolean
  compositions: Composition[]
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
