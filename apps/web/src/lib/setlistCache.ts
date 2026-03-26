import { Preferences } from '@capacitor/preferences'
import { isNativePlatform } from './platform'

const SETLIST_CACHE_NAME = 'myband-setlist-files-v1'
const SETLIST_CACHE_METADATA_KEY = 'myband_setlist_cache_metadata_v1'

interface SetlistCacheMetadataEntry {
  contentIds: string[]
  cachedAt: string
}

type SetlistCacheMetadata = Record<string, SetlistCacheMetadataEntry>

interface CacheableSetlistItem {
  content: {
    id: string
    title: string
    fileUrl?: string | null
  }
}

export interface SetlistCacheStatus {
  supported: boolean
  totalCount: number
  cachedCount: number
  isFullyCached: boolean
  cachedAt: string | null
}

export interface SetlistCacheProgress {
  completed: number
  total: number
  title: string
}

function getWindowStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

async function readCacheMetadata() {
  const storage = getWindowStorage()
  let rawValue: string | null = null

  if (isNativePlatform) {
    const { value } = await Preferences.get({ key: SETLIST_CACHE_METADATA_KEY })
    rawValue = value ?? storage?.getItem(SETLIST_CACHE_METADATA_KEY) ?? null
  } else {
    rawValue = storage?.getItem(SETLIST_CACHE_METADATA_KEY) ?? null
  }

  if (!rawValue) {
    return {}
  }

  try {
    return JSON.parse(rawValue) as SetlistCacheMetadata
  } catch (error) {
    console.error('Failed to parse setlist cache metadata', error)
    return {}
  }
}

async function writeCacheMetadata(metadata: SetlistCacheMetadata) {
  const storage = getWindowStorage()
  const serializedMetadata = JSON.stringify(metadata)

  if (isNativePlatform) {
    await Preferences.set({
      key: SETLIST_CACHE_METADATA_KEY,
      value: serializedMetadata,
    })
  }

  storage?.setItem(SETLIST_CACHE_METADATA_KEY, serializedMetadata)
}

function getSetlistCacheMetadataKey(groupId: string, setlistId: string) {
  return `${groupId}:${setlistId}`
}

function getContentCacheUrl(groupId: string, contentId: string) {
  return new URL(`/__setlist_cache__/${groupId}/${contentId}`, window.location.origin).toString()
}

export function isSetlistCacheSupported() {
  return typeof window !== 'undefined' && 'caches' in window
}

export function getCacheableSetlistItems<T extends CacheableSetlistItem>(items: T[]) {
  return items.filter((item) => Boolean(item.content.fileUrl))
}

export async function getCachedContentFile(groupId: string, contentId: string) {
  if (!isSetlistCacheSupported()) {
    return null
  }

  const cache = await window.caches.open(SETLIST_CACHE_NAME)
  const cachedResponse = await cache.match(getContentCacheUrl(groupId, contentId))

  if (!cachedResponse) {
    return null
  }

  return cachedResponse.blob()
}

export async function getSetlistCacheStatus(
  groupId: string,
  setlistId: string,
  contentIds: string[]
): Promise<SetlistCacheStatus> {
  if (!isSetlistCacheSupported()) {
    return {
      supported: false,
      totalCount: contentIds.length,
      cachedCount: 0,
      isFullyCached: false,
      cachedAt: null,
    }
  }

  const metadata = await readCacheMetadata()
  const metadataEntry = metadata[getSetlistCacheMetadataKey(groupId, setlistId)]
  const cachedContentIds = new Set(metadataEntry?.contentIds ?? [])
  const cachedCount = contentIds.filter((contentId) => cachedContentIds.has(contentId)).length

  return {
    supported: true,
    totalCount: contentIds.length,
    cachedCount,
    isFullyCached: contentIds.length > 0 && cachedCount === contentIds.length,
    cachedAt: metadataEntry?.cachedAt ?? null,
  }
}

export async function cacheSetlistFiles<T extends CacheableSetlistItem>(
  groupId: string,
  setlistId: string,
  items: T[],
  fetchContentFile: (groupId: string, contentId: string) => Promise<Blob>,
  onProgress?: (progress: SetlistCacheProgress) => void
) {
  if (!isSetlistCacheSupported()) {
    throw new Error('Caching is not available on this device.')
  }

  const cacheableItems = getCacheableSetlistItems(items)
  const metadata = await readCacheMetadata()
  const metadataKey = getSetlistCacheMetadataKey(groupId, setlistId)
  const existingContentIds = metadata[metadataKey]?.contentIds ?? []
  const nextContentIds = cacheableItems.map((item) => item.content.id)
  const nextContentIdSet = new Set(nextContentIds)
  const staleContentIds = existingContentIds.filter((contentId) => !nextContentIdSet.has(contentId))
  const cache = await window.caches.open(SETLIST_CACHE_NAME)

  await Promise.all(
    staleContentIds.map((contentId) => cache.delete(getContentCacheUrl(groupId, contentId)))
  )

  let completed = 0

  for (const item of cacheableItems) {
    const blob = await fetchContentFile(groupId, item.content.id)
    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
      },
    })

    await cache.put(getContentCacheUrl(groupId, item.content.id), response)

    completed += 1
    onProgress?.({
      completed,
      total: cacheableItems.length,
      title: item.content.title,
    })
  }

  metadata[metadataKey] = {
    contentIds: nextContentIds,
    cachedAt: new Date().toISOString(),
  }

  await writeCacheMetadata(metadata)

  return {
    cachedCount: nextContentIds.length,
    totalCount: nextContentIds.length,
  }
}

export async function clearSetlistCache(
  groupId: string,
  setlistId: string,
  contentIds: string[]
) {
  if (!isSetlistCacheSupported()) {
    return
  }

  const metadata = await readCacheMetadata()
  const metadataKey = getSetlistCacheMetadataKey(groupId, setlistId)
  const cachedContentIds = contentIds.length > 0 ? contentIds : metadata[metadataKey]?.contentIds ?? []
  const cache = await window.caches.open(SETLIST_CACHE_NAME)

  await Promise.all(
    cachedContentIds.map((contentId) => cache.delete(getContentCacheUrl(groupId, contentId)))
  )

  delete metadata[metadataKey]
  await writeCacheMetadata(metadata)
}
