import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { groupApi, setlistApi } from '../lib/api'
import '../styles/setlist.css'

interface Group {
  id: string
  name: string
  description?: string
}

interface Setlist {
  id: string
  name: string
  items: Array<{ id: string }>
}

interface StatusMessage {
  tone: 'success' | 'error'
  text: string
}

export default function SetlistsPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()

  const [group, setGroup] = useState<Group | null>(null)
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [newSetlistName, setNewSetlistName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingSetlistId, setDeletingSetlistId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null)

  useEffect(() => {
    if (!groupId) {
      navigate('/dashboard')
      return
    }

    void loadPage(groupId)
  }, [groupId, navigate])

  const loadPage = async (currentGroupId: string) => {
    try {
      const [groupData, setlistData] = await Promise.all([
        groupApi.getGroup(currentGroupId),
        setlistApi.getGroupSetlists(currentGroupId),
      ])

      setGroup(groupData)
      setSetlists(setlistData)
    } catch (err) {
      alert('Failed to load setlists')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSetlist = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedName = newSetlistName.trim()
    if (!trimmedName || !groupId) {
      return
    }

    setCreating(true)
    setStatusMessage(null)
    try {
      const newSetlist = await setlistApi.createSetlist(groupId, trimmedName)
      setSetlists((currentSetlists) => [...currentSetlists, newSetlist])
      setNewSetlistName('')
      navigate(`/groups/${groupId}/setlists/${newSetlist.id}`)
    } catch (err) {
      alert('Failed to create setlist')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSetlist = async (setlist: Setlist) => {
    if (!groupId) {
      return
    }

    const shouldDelete = confirm(`Delete "${setlist.name}"?`)
    if (!shouldDelete) {
      return
    }

    setDeletingSetlistId(setlist.id)
    setStatusMessage(null)

    try {
      await setlistApi.deleteSetlist(groupId, setlist.id)
      setSetlists((currentSetlists) =>
        currentSetlists.filter((currentSetlist) => currentSetlist.id !== setlist.id)
      )
      setStatusMessage({
        tone: 'success',
        text: `"${setlist.name}" was deleted.`,
      })
    } catch (error) {
      const apiError = error as Error
      setStatusMessage({
        tone: 'error',
        text: apiError.message || 'Failed to delete setlist',
      })
    } finally {
      setDeletingSetlistId(null)
    }
  }

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm text-center">
          <p className="section-kicker">Loading</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">Gathering your setlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-app">
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="app-link mb-5 inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Band</span>
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">Setlists</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                {group?.name} setlists
              </h1>
              {group?.description && (
                <p className="mt-4 text-sm leading-6 text-black/60 md:text-base">
                  {group.description}
                </p>
              )}
            </div>
            <span className="stat-pill">{setlists.length} total</span>
          </div>
        </div>
      </header>

      <main className="container-app space-y-8">
        <form onSubmit={handleCreateSetlist} className="card">
          <div>
            <p className="section-kicker">Create</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Build a new setlist</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">
              Start a new rehearsal or gig flow and add songs in the order you want to perform them.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              className="input-field flex-1"
              placeholder="e.g., Friday rehearsal"
              disabled={creating}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Setlist'}
            </button>
          </div>
        </form>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Library</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">All Setlists</h2>
            </div>
            <span className="soft-label">{setlists.length} total</span>
          </div>

          {statusMessage && (
            <div
              className={`mt-5 status-banner ${
                statusMessage.tone === 'success'
                  ? 'status-banner-strong'
                  : 'status-banner-muted'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {setlists.length === 0 ? (
            <div className="card mt-5 py-16 text-center">
              <p className="text-2xl font-semibold tracking-tight">No setlists yet</p>
              <p className="mt-3 text-sm leading-6 text-black/60">
                Create one to start arranging songs for rehearsal or performance.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
              {setlists.map((setlist, index) => (
                <div
                  key={setlist.id}
                  className="card h-full transition duration-200 hover:-translate-y-1 hover:border-orange-400/50"
                >
                  <p className="section-kicker">Setlist {String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight">{setlist.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-black/60">
                    {setlist.items.length} {setlist.items.length === 1 ? 'song' : 'songs'}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/groups/${groupId}/setlists/${setlist.id}`)}
                      className="btn-secondary"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSetlist(setlist)}
                      className="btn-danger"
                      disabled={deletingSetlistId === setlist.id}
                    >
                      {deletingSetlistId === setlist.id ? 'Deleting...' : 'Delete Setlist'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
