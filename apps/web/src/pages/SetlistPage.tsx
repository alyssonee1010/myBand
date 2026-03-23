import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { setlistApi, contentApi } from '../lib/api'
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

export default function SetlistPage() {
  const navigate = useNavigate()
  const { groupId, setlistId } = useParams()

  const [setlist, setSetlist] = useState<Setlist | null>(null)
  const [availableContent, setAvailableContent] = useState<any[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null)
  const [isActiveFileLoading, setIsActiveFileLoading] = useState(false)
  const [isPerformanceMode, setIsPerformanceMode] = useState(false)

  const touchStartX = useRef<number | null>(null)
  const performanceModeRef = useRef<HTMLDivElement | null>(null)

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
        const blob = await contentApi.getContentFile(groupId, activeItem.content.id)
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

  const handleViewerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null
  }

  const handleViewerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return

    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const deltaX = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(deltaX) < 50) return

    if (deltaX < 0) {
      handleNext()
      return
    }

    handlePrevious()
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

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result

    if (!destination) return
    if (source.index === destination.index) return
    if (!setlist) return

    const items = Array.from(setlist.items)
    const [reorderedItem] = items.splice(source.index, 1)
    items.splice(destination.index, 0, reorderedItem)

    setSetlist({
      ...setlist,
      items,
    })

    try {
      const itemsToSend = items.map((item, index) => ({
        itemId: item.id,
        position: index,
      }))
      await setlistApi.reorderSetlistItems(groupId!, setlistId!, itemsToSend)
    } catch (err) {
      alert('Failed to reorder items')
      await loadSetlist()
    }
  }

  const handleAddContent = async (contentId: string) => {
    try {
      await setlistApi.addItemToSetlist(groupId!, setlistId!, contentId)
      await loadSetlist()
      setShowAddModal(false)
    } catch (err) {
      alert('Failed to add content')
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container-app">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">{setlist?.name}</h1>
        </div>
      </header>

      <main className="container-app">
        <div className="flex justify-between items-center mb-8 gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">
            Songs ({setlist?.items.length || 0})
          </h2>
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={enterPerformanceMode}
              className="btn-secondary"
              disabled={!activeItem}
            >
              Performance Mode
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add Song
            </button>
          </div>
        </div>

        {setlist && setlist.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No songs in this setlist yet.</p>
          </div>
        ) : (
          <div className="setlist-layout">
            <section className="card setlist-viewer">
              <div className="setlist-viewer-header">
                <div>
                  <p className="setlist-viewer-label">Now Viewing</p>
                  <h3 className="text-2xl font-bold">{activeItem?.content.title || 'Select a song'}</h3>
                  <p className="text-sm text-gray-500">
                    {activeIndex >= 0 ? `${activeIndex + 1} of ${setlist?.items.length}` : 'No active song'}
                  </p>
                </div>

                <div className="setlist-viewer-actions">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div
                className="setlist-viewer-body"
                onTouchStart={handleViewerTouchStart}
                onTouchEnd={handleViewerTouchEnd}
              >
                {renderActiveContent()}
              </div>

              {activeItem && (
                <div className="setlist-viewer-footer">
                  <p className="text-sm text-gray-500">
                    Swipe on touch screens, use the buttons here, or open Performance Mode for fullscreen navigation.
                  </p>
                </div>
              )}
            </section>

            <section>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="setlist">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50 p-4 rounded' : ''}`}
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
                                className={`card cursor-move transition ${
                                  snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''
                                } ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => setActiveItemId(item.id)}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div>
                                    <p className="font-bold">{index + 1}. {item.content.title}</p>
                                    <p className="text-sm text-gray-500">{item.content.contentType}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      void handleRemoveItem(item.id)
                                    }}
                                    className="btn-danger text-sm"
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
          onTouchEnd={handleViewerTouchEnd}
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
            Swipe between songs on iPad. Use keyboard left/right arrows on laptop.
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Content</h2>
            <div className="space-y-2">
              {availableContent
                .filter((content) => !setlist?.items.some((item) => item.contentId === content.id))
                .map((content) => (
                  <div key={content.id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{content.title}</p>
                        <p className="text-sm text-gray-500">{content.contentType}</p>
                      </div>
                      <button
                        onClick={() => handleAddContent(content.id)}
                        className="btn-primary text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
