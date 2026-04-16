import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import { contentApi, setlistApi } from '../lib/api'
import LinkifiedText from '../components/LinkifiedText'
import {
  cacheSetlistFiles,
  clearSetlistCache,
  getCachedContentFile,
  getCacheableSetlistItems,
  getSetlistCacheStatus,
  isSetlistCacheSupported,
  SetlistCacheStatus,
} from '../lib/setlistCache'
import '../styles/setlist.css'

interface SetlistItem {
  id: string
  contentId: string
  position: number
  content: {
    id: string
    title: string
    contentType: string
    description?: string
    fileUrl?: string
    fileName?: string
    textContent?: string
  }
}

interface Setlist {
  id: string
  name: string
  items: SetlistItem[]
}

interface AvailableContent {
  id: string
  title: string
  contentType: string
  description?: string
}

interface StatusMessage {
  tone: 'success' | 'error' | 'info'
  text: string
}

interface ViewerTouchGesture {
  startX: number | null
  startY: number | null
  lastX: number | null
  lastY: number | null
  hadMultipleTouches: boolean
}

const MIN_SWIPE_DISTANCE_PX = 96
const SWIPE_DIRECTION_RATIO = 1.35

export default function SetlistPage() {
  const navigate = useNavigate()
  const { groupId, setlistId } = useParams()

  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [availableContent, setAvailableContent] = useState<AvailableContent[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null)
  const [isActiveFileLoading, setIsActiveFileLoading] = useState(false)
  const [isPerformanceMode, setIsPerformanceMode] = useState(false)
  const [addingContentIds, setAddingContentIds] = useState<string[]>([])
  const [addStatus, setAddStatus] = useState<StatusMessage | null>(null)
  const [cacheStatus, setCacheStatus] = useState<SetlistCacheStatus | null>(null)
  const [cacheStatusMessage, setCacheStatusMessage] = useState<StatusMessage | null>(null)
  const [isCachingSetlist, setIsCachingSetlist] = useState(false)

  const viewerTouchGestureRef = useRef<ViewerTouchGesture>({
    startX: null,
    startY: null,
    lastX: null,
    lastY: null,
    hadMultipleTouches: false,
  })
  const performanceModeRef = useRef<HTMLDivElement | null>(null)
  const addingContentIdsRef = useRef(new Set<string>())
  const isCacheSupported = isSetlistCacheSupported()
  const cacheableContentIds = setlist
    ? getCacheableSetlistItems(setlist.items).map((item) => item.content.id)
    : []
  const cacheableItemCount = cacheableContentIds.length
  const cacheableContentIdsKey = cacheableContentIds.join('|')

  useEffect(() => {
    if (groupId && setlistId) {
      void loadSetlist()
      void loadAvailableContent()
    }
  }, [groupId, setlistId])

  useEffect(() => {
    if (!setlist?.items.length) {
      setActiveItemId(null)
      return
    }

    const activeItemStillExists = setlist.items.some((item) => item.id === activeItemId)
    if (!activeItemStillExists) {
      setActiveItemId(setlist.items[0].id)
    }
  }, [setlist, activeItemId])

  const activeIndex =
    setlist && activeItemId
      ? setlist.items.findIndex((item) => item.id === activeItemId)
      : -1

  const activeItem = activeIndex >= 0 && setlist ? setlist.items[activeIndex] : null
  const canGoPrevious = activeIndex > 0
  const canGoNext = !!setlist && activeIndex >= 0 && activeIndex < setlist.items.length - 1

  useEffect(() => {
    if (!groupId || !activeItem?.content.fileUrl) {
      setActiveFileUrl((currentFileUrl) => {
        if (currentFileUrl) {
          URL.revokeObjectURL(currentFileUrl)
        }
        return null
      })
      setIsActiveFileLoading(false)
      return
    }

    let isCancelled = false

    const loadActiveFile = async () => {
      setIsActiveFileLoading(true)

      try {
        const cachedBlob = await getCachedContentFile(groupId, activeItem.content.id)
        if (isCancelled) return

        const blob = cachedBlob ?? await contentApi.getContentFile(groupId, activeItem.content.id)
        if (isCancelled) return

        const nextFileUrl = URL.createObjectURL(blob)
        setActiveFileUrl((currentFileUrl) => {
          if (currentFileUrl) {
            URL.revokeObjectURL(currentFileUrl)
          }
          return nextFileUrl
        })
      } catch (err) {
        if (!isCancelled) {
          setActiveFileUrl((currentFileUrl) => {
            if (currentFileUrl) {
              URL.revokeObjectURL(currentFileUrl)
            }
            return null
          })
        }
      } finally {
        if (!isCancelled) {
          setIsActiveFileLoading(false)
        }
      }
    }

    void loadActiveFile()

    return () => {
      isCancelled = true
    }
  }, [groupId, activeItem?.content.id, activeItem?.content.fileUrl])

  useEffect(() => {
    if (!groupId || !setlistId || !setlist) {
      setCacheStatus(null)
      return
    }

    let isCancelled = false

    const loadCacheStatus = async () => {
      const nextCacheStatus = await getSetlistCacheStatus(groupId, setlistId, cacheableContentIds)

      if (!isCancelled) {
        setCacheStatus(nextCacheStatus)
      }
    }

    void loadCacheStatus()

    return () => {
      isCancelled = true
    }
  }, [groupId, setlistId, setlist, cacheableContentIdsKey])

  useEffect(() => {
    return () => {
      if (activeFileUrl) {
        URL.revokeObjectURL(activeFileUrl)
      }
    }
  }, [activeFileUrl])

  useEffect(() => {
    if (!isPerformanceMode) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePrevious()
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        void exitPerformanceMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPerformanceMode, activeIndex, setlist])

  useEffect(() => {
    if (!isPerformanceMode || !performanceModeRef.current) return

    const element = performanceModeRef.current

    const handleFullscreenChange = () => {
      if (document.fullscreenElement !== element) {
        setIsPerformanceMode(false)
      }
    }

    const requestFullscreen = async () => {
      try {
        if (document.fullscreenElement !== element) {
          await element.requestFullscreen()
        }
      } catch (err) {
        console.error('Fullscreen request failed', err)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    void requestFullscreen()

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isPerformanceMode])

  const loadSetlist = async () => {
    try {
      const data = await setlistApi.getSetlist(groupId!, setlistId!)
      setSetlist(data)
    } catch (err) {
      alert('Failed to load setlist')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableContent = async () => {
    try {
      const data = await contentApi.getGroupContent(groupId!)
      setAvailableContent(data.contents)
    } catch (err) {
      console.error('Failed to load content')
    }
  }

  const goToItemAtIndex = (index: number) => {
    if (!setlist || index < 0 || index >= setlist.items.length) return
    setActiveItemId(setlist.items[index].id)
  }

  const handlePrevious = () => {
    if (canGoPrevious) {
      goToItemAtIndex(activeIndex - 1)
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      goToItemAtIndex(activeIndex + 1)
    }
  }

  const resetViewerTouchGesture = () => {
    viewerTouchGestureRef.current = {
      startX: null,
      startY: null,
      lastX: null,
      lastY: null,
      hadMultipleTouches: false,
    }
  }

  const handleViewerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const primaryTouch = e.touches[0] ?? e.changedTouches[0]

    if (!primaryTouch) {
      resetViewerTouchGesture()
      return
    }

    if (viewerTouchGestureRef.current.startX !== null) {
      viewerTouchGestureRef.current.lastX = primaryTouch.clientX
      viewerTouchGestureRef.current.lastY = primaryTouch.clientY
      viewerTouchGestureRef.current.hadMultipleTouches = true
      return
    }

    viewerTouchGestureRef.current = {
      startX: primaryTouch.clientX,
      startY: primaryTouch.clientY,
      lastX: primaryTouch.clientX,
      lastY: primaryTouch.clientY,
      hadMultipleTouches: e.touches.length > 1 || e.changedTouches.length > 1,
    }
  }

  const handleViewerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const primaryTouch = e.touches[0] ?? e.changedTouches[0]

    if (viewerTouchGestureRef.current.startX === null || !primaryTouch) {
      return
    }

    viewerTouchGestureRef.current.lastX = primaryTouch.clientX
    viewerTouchGestureRef.current.lastY = primaryTouch.clientY

    if (e.touches.length > 1 || e.changedTouches.length > 1) {
      viewerTouchGestureRef.current.hadMultipleTouches = true
    }
  }

  const handleViewerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touchGesture = viewerTouchGestureRef.current

    if (touchGesture.startX === null || touchGesture.startY === null) {
      return
    }

    const primaryTouch = e.changedTouches[0] ?? e.touches[0]
    if (primaryTouch) {
      touchGesture.lastX = primaryTouch.clientX
      touchGesture.lastY = primaryTouch.clientY
    }

    if (e.changedTouches.length > 1 || e.touches.length > 0) {
      touchGesture.hadMultipleTouches = true
    }

    if (touchGesture.hadMultipleTouches) {
      if (e.touches.length === 0) {
        resetViewerTouchGesture()
      }
      return
    }

    const endX = touchGesture.lastX ?? touchGesture.startX
    const endY = touchGesture.lastY ?? touchGesture.startY
    const deltaX = endX - touchGesture.startX
    const deltaY = endY - touchGesture.startY
    resetViewerTouchGesture()

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE_PX) return
    if (Math.abs(deltaX) <= Math.abs(deltaY) * SWIPE_DIRECTION_RATIO) return

    if (deltaX < 0) {
      handleNext()
      return
    }

    handlePrevious()
  }

  const handleViewerTouchCancel = () => {
    resetViewerTouchGesture()
  }

  const enterPerformanceMode = () => {
    setIsPerformanceMode(true)
  }

  const exitPerformanceMode = async () => {
    setIsPerformanceMode(false)

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.error('Fullscreen exit failed', err)
      }
    }
  }

  const saveReorderedItems = async (items: SetlistItem[]) => {
    if (!groupId || !setlistId || !setlist) {
      return
    }

    setSetlist({
      ...setlist,
      items,
    })

    try {
      const itemsToSend = items.map((item, index) => ({
        itemId: item.id,
        position: index,
      }))
      const updatedSetlist = await setlistApi.reorderSetlistItems(groupId, setlistId, itemsToSend)
      setSetlist(updatedSetlist)
    } catch (err) {
      alert('Failed to reorder items')
      await loadSetlist()
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return
    if (source.index === destination.index) return
    if (!setlist) return

    const reorderedItems = Array.from(setlist.items)
    const [reorderedItem] = reorderedItems.splice(source.index, 1)
    reorderedItems.splice(destination.index, 0, reorderedItem)

    const items = reorderedItems.map((item, index) => ({
      ...item,
      position: index,
    }))

    await saveReorderedItems(items)
  }

  const handleAddContent = async (content: AvailableContent) => {
    if (!groupId || !setlistId || !setlist) {
      return
    }

    if (
      addingContentIdsRef.current.has(content.id) ||
      setlist.items.some((item) => item.contentId === content.id)
    ) {
      return
    }

    addingContentIdsRef.current.add(content.id)
    setAddingContentIds(Array.from(addingContentIdsRef.current))
    setAddStatus({
      tone: 'info',
      text: `Adding "${content.title}" in the background...`,
    })

    try {
      const item = await setlistApi.addItemToSetlist(groupId, setlistId, content.id)

      setSetlist((currentSetlist) => {
        if (!currentSetlist) {
          return currentSetlist
        }

        if (currentSetlist.items.some((currentItem) => currentItem.contentId === item.contentId)) {
          return currentSetlist
        }

        return {
          ...currentSetlist,
          items: [...currentSetlist.items, item].sort((leftItem, rightItem) => leftItem.position - rightItem.position),
        }
      })

      setAddStatus({
        tone: 'success',
        text: `"${content.title}" was added. You can keep adding more songs.`,
      })
    } catch (error) {
      const apiError = error as Error & { status?: number }

      if (apiError.status === 409) {
        setAddStatus({
          tone: 'info',
          text: `"${content.title}" is already in this setlist.`,
        })
        await loadSetlist()
      } else {
        setAddStatus({
          tone: 'error',
          text: apiError.message || 'Failed to add content',
        })
      }
    } finally {
      addingContentIdsRef.current.delete(content.id)
      setAddingContentIds(Array.from(addingContentIdsRef.current))
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove from setlist?')) return
    try {
      await setlistApi.removeItemFromSetlist(groupId!, setlistId!, itemId)
      await loadSetlist()
    } catch (err) {
      alert('Failed to remove item')
    }
  }

  const handleCacheSetlist = async () => {
    if (!groupId || !setlistId || !setlist) {
      return
    }

    if (!isCacheSupported) {
      setCacheStatusMessage({
        tone: 'error',
        text: 'Caching is not available on this device.',
      })
      return
    }

    if (cacheableItemCount === 0) {
      setCacheStatusMessage({
        tone: 'info',
        text: 'This setlist only has text songs. There are no files to cache.',
      })
      return
    }

    setIsCachingSetlist(true)
    setCacheStatusMessage(null)

    try {
      if (cacheStatus?.isFullyCached) {
        await clearSetlistCache(groupId, setlistId, cacheableContentIds)
        setCacheStatus({
          supported: true,
          totalCount: cacheableItemCount,
          cachedCount: 0,
          isFullyCached: false,
          cachedAt: null,
        })
        setCacheStatusMessage({
          tone: 'success',
          text: 'Cached files were cleared for this setlist.',
        })
        return
      }

      await cacheSetlistFiles(
        groupId,
        setlistId,
        setlist.items,
        contentApi.getContentFile,
        ({ completed, total, title }) => {
          setCacheStatusMessage({
            tone: 'info',
            text: `Caching ${completed} of ${total}: "${title}"`,
          })
        }
      )

      const nextCacheStatus = await getSetlistCacheStatus(groupId, setlistId, cacheableContentIds)
      setCacheStatus(nextCacheStatus)
      setCacheStatusMessage({
        tone: 'success',
        text: `Cached ${nextCacheStatus.cachedCount} files for faster performance mode.`,
      })
    } catch (error) {
      const apiError = error as Error
      setCacheStatusMessage({
        tone: 'error',
        text: apiError.message || 'Failed to cache this setlist',
      })
    } finally {
      setIsCachingSetlist(false)
    }
  }

  const renderActiveContent = () => {
    if (!activeItem) {
      return (
        <div className="setlist-viewer-empty">
          <p>Select a song from the list to start viewing it.</p>
        </div>
      )
    }

    const { content } = activeItem

    if (content.fileUrl && isActiveFileLoading) {
      return (
        <div className="setlist-viewer-empty">
          <p>Loading song...</p>
        </div>
      )
    }

    if (content.contentType === 'image' && activeFileUrl) {
      return (
        <div className="setlist-viewer-media">
          <img src={activeFileUrl} alt={content.title} className="setlist-viewer-image" />
        </div>
      )
    }

    if (content.contentType === 'pdf' && activeFileUrl) {
      return (
        <div className="setlist-viewer-media">
          <object data={activeFileUrl} type="application/pdf" className="setlist-viewer-frame">
            <iframe
              key={activeFileUrl}
              src={activeFileUrl}
              title={content.title}
              className="setlist-viewer-frame"
            />
          </object>
        </div>
      )
    }

    if ((content.contentType === 'lyrics' || content.contentType === 'chords') && content.textContent) {
      return (
        <div className="setlist-viewer-text">
          <pre>{content.textContent}</pre>
        </div>
      )
    }

    return (
      <div className="setlist-viewer-empty">
        <p>Preview unavailable for this file.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm text-center">
          <p className="section-kicker">Loading</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">Preparing your setlist viewer...</p>
        </div>
      </div>
    )
  }

  const addedContentIds = new Set(setlist?.items.map((item) => item.contentId) ?? [])
  const addedContentCount = availableContent.filter((content) => addedContentIds.has(content.id)).length

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-app">
          <button
            onClick={() => navigate(`/groups/${groupId}/setlists`)}
            className="app-link mb-5 inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Setlists</span>
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">Setlist Viewer</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                {setlist?.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="stat-pill">{setlist?.items.length || 0} songs</span>
              <button
                type="button"
                onClick={enterPerformanceMode}
                className="btn-secondary"
                disabled={!activeItem}
              >
                Performance Mode
              </button>
              <button
                onClick={() => {
                  setAddStatus(null)
                  setShowAddModal(true)
                }}
                className="btn-primary"
              >
                Add Song
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app space-y-6">
        {(cacheStatusMessage || cacheStatus) && (
          <div className="card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-kicker">Offline Prep</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Setlist Cache</h2>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  Preload PDFs and images so performance mode can open them faster on this device.
                </p>
                {cacheStatus && !cacheStatus.supported && (
                  <p className="mt-2 text-sm text-black/60">
                    This browser does not expose the local cache storage API, so manual caching is unavailable here.
                  </p>
                )}
                {cacheStatus && (
                  <p className="mt-2 text-sm text-black/60">
                    {cacheStatus.cachedCount} of {cacheStatus.totalCount} file
                    {cacheStatus.totalCount === 1 ? '' : 's'} cached
                    {cacheStatus.cachedAt ? ` · last updated ${new Date(cacheStatus.cachedAt).toLocaleString()}` : ''}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleCacheSetlist()}
                className={cacheStatus?.isFullyCached ? 'btn-secondary' : 'btn-primary'}
                disabled={isCachingSetlist || !isCacheSupported || cacheableItemCount === 0}
              >
                {isCachingSetlist
                  ? 'Caching...'
                  : !isCacheSupported
                    ? 'Caching Unavailable'
                    : cacheableItemCount === 0
                      ? 'No Files to Cache'
                      : cacheStatus?.isFullyCached
                        ? 'Clear Cache'
                        : 'Cache Setlist'}
              </button>
            </div>

            {cacheStatusMessage && (
              <div
                className={`mt-5 status-banner ${
                  cacheStatusMessage.tone === 'success'
                    ? 'status-banner-strong'
                    : 'status-banner-muted'
                }`}
              >
                {cacheStatusMessage.text}
              </div>
            )}
          </div>
        )}

        {setlist && setlist.items.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-2xl font-semibold tracking-tight">No songs in this setlist yet</p>
            <p className="mt-3 text-sm leading-6 text-black/60">
              Add songs from your shared library to start building the running order.
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setAddStatus(null)
                  setShowAddModal(true)
                }}
                className="btn-primary"
              >
                Add Your First Song
              </button>
            </div>
          </div>
        ) : (
          <div className="setlist-layout">
            <section className="card setlist-viewer">
              <div className="setlist-viewer-header">
                <div>
                  <p className="setlist-viewer-label">Now Viewing</p>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {activeItem?.content.title || 'Select a song'}
                  </h3>
                  <p className="mt-2 text-sm text-black/60">
                    {activeIndex >= 0
                      ? `${activeIndex + 1} of ${setlist?.items.length}`
                      : 'No active song'}
                  </p>
                </div>

                <div className="setlist-viewer-actions">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="btn-primary"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div
                className="setlist-viewer-body"
                onTouchStart={handleViewerTouchStart}
                onTouchMove={handleViewerTouchMove}
                onTouchEnd={handleViewerTouchEnd}
                onTouchCancel={handleViewerTouchCancel}
              >
                {renderActiveContent()}
              </div>

              {activeItem && (
                <div className="setlist-viewer-footer">
                  <p className="text-sm text-black/60">
                    Use a clear one-finger swipe to change songs. Pinch to zoom will stay on the
                    current song.
                  </p>
                </div>
              )}
            </section>

            <section className="card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-kicker">Order</p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight">Running Order</h2>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Drag songs to rearrange the playing order.
                  </p>
                </div>
                <span className="stat-pill">{setlist?.items.length || 0}</span>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="setlist">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`mt-5 space-y-3 rounded-[28px] transition ${
                        snapshot.isDraggingOver ? 'bg-[rgba(255,106,0,0.08)] p-3' : ''
                      }`}
                    >
                      {setlist?.items.map((item, index) => {
                        const isActive = item.id === activeItemId

                        return (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`setlist-item-card ${
                                  snapshot.isDragging ? 'setlist-item-card-dragging' : ''
                                } ${isActive ? 'setlist-item-card-active' : ''}`}
                                onClick={() => setActiveItemId(item.id)}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                                        {String(index + 1).padStart(2, '0')}
                                      </span>
                                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                                        {item.content.contentType}
                                      </span>
                                    </div>
                                    <p className="mt-4 text-lg font-bold tracking-tight text-black">
                                      {item.content.title}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      void handleRemoveItem(item.id)
                                    }}
                                    className="btn-danger"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </section>
          </div>
        )}
      </main>

      {isPerformanceMode && activeItem && (
        <div
          ref={performanceModeRef}
          className="performance-mode-overlay"
          onTouchStart={handleViewerTouchStart}
          onTouchMove={handleViewerTouchMove}
          onTouchEnd={handleViewerTouchEnd}
          onTouchCancel={handleViewerTouchCancel}
        >
          <div className="performance-mode-topbar">
            <div>
              <p className="performance-mode-label">Performance Mode</p>
              <h2>{activeItem.content.title}</h2>
              <p>{activeIndex + 1} of {setlist?.items.length}</p>
            </div>
            <button
              type="button"
              onClick={() => void exitPerformanceMode()}
              className="performance-mode-close"
            >
              Close
            </button>
          </div>

          <div className="performance-mode-body">
            {renderActiveContent()}
          </div>

          <div className="performance-mode-hint">
            Use a clear one-finger swipe between songs. Pinch to zoom stays on the same song.
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="card modal-card max-h-[32rem] max-w-2xl overflow-y-auto">
            <p className="section-kicker">Add Content</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Add songs to this setlist</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">
              Stay on this page and keep tapping songs. New additions are saved in the background.
            </p>

            {addStatus && (
              <div
                className={`mt-5 status-banner ${
                  addStatus.tone === 'success'
                    ? 'status-banner-strong'
                    : 'status-banner-muted'
                }`}
              >
                {addStatus.text}
              </div>
            )}

            {availableContent.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-5 py-10 text-center">
                <p className="text-xl font-semibold tracking-tight">No songs in the band library yet</p>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  Add more content to the band library first, then come back here to build the setlist.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-black/10 bg-white/70 px-4 py-3 text-sm text-black/60">
                  <span>
                    {addedContentCount} of {availableContent.length} songs already in this setlist
                  </span>
                  <span>{addingContentIds.length > 0 ? 'Saving changes...' : 'Ready to add more'}</span>
                </div>

                {availableContent.map((content) => {
                  const isAlreadyAdded = addedContentIds.has(content.id)
                  const isAdding = addingContentIds.includes(content.id)

                  return (
                    <div
                      key={content.id}
                      className={`rounded-[24px] border p-4 transition ${
                        isAlreadyAdded
                          ? 'border-teal-200 bg-teal-50/70'
                          : 'border-black/10 bg-white/80'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">
                            {content.title}
                          </p>
                          <p className="mt-1 text-sm text-black/60">{content.contentType}</p>
                          {content.description && (
                            <LinkifiedText
                              text={content.description}
                              className="mt-2 text-sm leading-6 text-black/60"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleAddContent(content)}
                          className={isAlreadyAdded ? 'btn-secondary' : 'btn-primary'}
                          disabled={isAlreadyAdded || isAdding}
                        >
                          {isAdding ? 'Adding...' : isAlreadyAdded ? 'Already Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => {
                setShowAddModal(false)
                setAddStatus(null)
              }}
              className="btn-secondary mt-6 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
