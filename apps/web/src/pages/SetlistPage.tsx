import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (groupId && setlistId) {
      loadSetlist()
      loadAvailableContent()
    }
  }, [groupId, setlistId])

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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            Songs ({setlist?.items.length || 0})
          </h2>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            + Add Song
          </button>
        </div>

        {setlist && setlist.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No songs in this setlist yet.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="setlist">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50 p-4 rounded' : ''}`}
                >
                  {setlist?.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`card cursor-move ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold">{index + 1}. {item.content.title}</p>
                              <p className="text-sm text-gray-500">{item.content.contentType}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="btn-danger text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Content</h2>
            <div className="space-y-2">
              {availableContent
                .filter((c) => !setlist?.items.some((item) => item.contentId === c.id))
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
