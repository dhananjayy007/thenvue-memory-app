'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Memory } from '@/types/memory'
import { getMemoriesPageAction } from '@/app/memories/actions'

export interface UseTimelineMemoriesResult {
  memories: Memory[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  optimisticAdd: (memory: Memory) => void
  optimisticUpdate: (memory: Partial<Memory> & { id: string }) => void
  optimisticRemove: (id: string) => void
  updateEnrichment: (memory: Memory) => void
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>
  clearCache: () => void
}

export function useTimelineMemories(initialMemories: Memory[] = [], userId?: string): UseTimelineMemoriesResult {
  const [memories, setMemories] = useState<Memory[]>(initialMemories)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(initialMemories.length >= 20)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  
  const lastFetchedRef = useRef<number>(Date.now())
  const activeUserRef = useRef<string | undefined>(userId)

  // Reset/clear cache if user changes
  useEffect(() => {
    if (activeUserRef.current !== userId) {
      activeUserRef.current = userId
      setMemories(initialMemories)
      setNextCursor(null)
      setHasMore(initialMemories.length >= 20)
      lastFetchedRef.current = Date.now()
    }
  }, [userId, initialMemories])

  // Initial cursor initialization
  useEffect(() => {
    if (initialMemories.length > 0 && !nextCursor) {
      const last = initialMemories[initialMemories.length - 1]
      const lastCursor = (last as any).occurred_at || `${last.date}T${last.time || '12:00:00'}Z`
      setNextCursor(lastCursor)
    }
  }, [initialMemories, nextCursor])

  // Load next page
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return
    setIsLoadingMore(true)
    try {
      const res = await getMemoriesPageAction({ limit: 20, cursor: nextCursor })
      if (res.memories.length > 0) {
        setMemories((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newItems = res.memories.filter((m) => !existingIds.has(m.id))
          return [...prev, ...newItems]
        })
      }
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      lastFetchedRef.current = Date.now()
    } catch (err) {
      console.error('Failed to load more memories:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, nextCursor])

  // Force refresh first page only (pull-to-refresh)
  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMemoriesPageAction({ limit: 20 })
      setMemories((prev) => {
        // Keep any actively processing memories that haven't saved to server yet
        const processing = prev.filter((m) => m.isProcessing)
        const processingIds = new Set(processing.map((p) => p.id))
        const serverItems = res.memories.filter((m) => !processingIds.has(m.id))
        return [...processing, ...serverItems]
      })
      setNextCursor(res.nextCursor)
      setHasMore(res.hasMore)
      lastFetchedRef.current = Date.now()
    } catch (err) {
      console.error('Failed to refresh memories:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Optimistic Add: prepend new memory immediately (<1ms)
  const optimisticAdd = useCallback((newMemory: Memory) => {
    setMemories((prev) => {
      // Avoid duplicate by ID
      const filtered = prev.filter((m) => m.id !== newMemory.id)
      return [newMemory, ...filtered]
    })
  }, [])

  // Optimistic Update: update in place without refetch
  const optimisticUpdate = useCallback((updated: Partial<Memory> & { id: string }) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === updated.id ? ({ ...m, ...updated } as Memory) : m))
    )
  }, [])

  // Optimistic Remove: remove by ID immediately without refetch
  const optimisticRemove = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
  }, [])

  // In-place enrichment update
  const updateEnrichment = useCallback((enriched: Memory) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === enriched.id
          ? {
              ...m,
              ...enriched,
              isProcessing: false,
              processingStatus: 'completed',
            }
          : m
      )
    )
  }, [])

  // Clear cache completely (logout)
  const clearCache = useCallback(() => {
    setMemories([])
    setNextCursor(null)
    setHasMore(false)
    lastFetchedRef.current = 0
  }, [])

  return {
    memories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    updateEnrichment,
    setMemories,
    clearCache,
  }
}
