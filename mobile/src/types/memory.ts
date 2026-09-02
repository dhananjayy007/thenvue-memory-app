export type MemoryType = 'note' | 'moment' | 'story' | 'reflection' | 'Perspective'
export type SourceType = 'memory_capture' | 'past_import' | 'shared_perspective'

export type MediaAsset = {
  id: string
  url: string
  storagePath: string
  mediaType: 'image' | 'audio' | 'document'
  fileName: string
  fileSize: number
  createdAt: string
  perspectiveId?: string | null
  sourceType?: SourceType
}

export type PastImportQuota = {
  used: number
  limit: number
  remaining: number
}

export type ImportedAsset = {
  id: string
  userId: string
  importJobId?: string | null
  clusterId?: string | null
  memoryId?: string | null
  mediaId?: string | null
  storagePath: string
  sourceType: 'past_import'
  capturedAt?: string | null
  capturedDate?: string | null
  capturedTime?: string | null
  dateSource?: string | null
  dateStatus?: 'exact' | 'inferred' | 'unknown'
  importedAt?: string
  latitude?: number | null
  longitude?: number | null
  mimeType: string
  fileSize: number
  processingStatus: 'pending' | 'processed' | 'duplicate' | 'failed'
  createdAt: string
  url?: string
}

export type MemoryClusterCandidate = {
  id: string
  userId: string
  importJobId?: string | null
  title: string
  summary: string
  suggestedDate?: string | null
  suggestedTime?: string | null
  dateSource?: string | null
  dateStatus?: 'exact' | 'inferred' | 'unknown'
  locationName: string
  latitude?: number | null
  longitude?: number | null
  people: string[]
  topics: string[]
  mood: string
  photoCount: number
  confidence: number
  status: 'pending' | 'approved' | 'rejected' | 'edited'
  assets: ImportedAsset[]
  createdAt: string
}

export type ParticipantStatus = 'pending' | 'accepted' | 'declined' | 'removed' | 'left'

export type MemoryParticipant = {
  id: string
  memoryId: string
  userId: string
  invitedBy: string
  displayName: string
  status: ParticipantStatus
  createdAt: string
  updatedAt: string
}

export type MemoryPerspective = {
  id: string
  memoryId: string
  userId: string
  authorName: string
  text: string
  place: string
  people: string[]
  topics: string[]
  mood: string
  summary: string
  memoryType: string
  media: MediaAsset[]
  savedToPersonalMemory: boolean
  personalMemoryId?: string | null
  createdAt: string
  updatedAt: string
  isAuthor?: boolean
}

export type MemoryNotification = {
  id: string
  userId: string
  actorId: string
  actorName: string
  memoryId: string
  memoryTitle: string
  perspectiveId?: string | null
  type: 'invitation' | 'perspective_added'
  title: string
  body: string
  status: 'unread' | 'read'
  createdAt: string
}

export type UserSearchResult = {
  id: string
  displayName: string
  email: string
}

export type Memory = {
  id: string
  userId?: string
  title: string
  text: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  place: string
  people: string[]
  mood: string
  topics: string[]
  summary: string
  memoryType: MemoryType
  media: MediaAsset[]
  isOwner?: boolean
  sourceMemoryId?: string | null
  sharedContext?: string | null
  participants?: MemoryParticipant[]
  perspectives?: MemoryPerspective[]
}

export type ConnectedMemory = Memory & {
  similarity: number
  relationshipType: 'semantic' | 'people' | 'place' | 'topic' | 'time'
  connectionReason: string
}

export type AskSourceMemory = {
  id: string
  date: string
  title: string
  text: string
  place?: string
  people: string[]
  topics: string[]
  media: MediaAsset[]
  similarity: number
}

export type AskAnswer = {
  question: string
  answer: string
  grounded: boolean
  sourceMemories: AskSourceMemory[]
}
