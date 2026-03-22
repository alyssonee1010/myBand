import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

export default function SetlistsPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()

  const [group, setGroup] = useState<Group | null>(null)
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [newSetlistName, setNewSetlistName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container-app">
          <button
            onClick={() => navigate(`/groups/${groupId}`)}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Band
          </button>
          <h1 className="text-3xl font-bold">{group?.name} Setlists</h1>
          {group?.description && <p className="text-gray-600">{group.description}</p>}
        </div>
      </header>

      <main className="container-app space-y-8">
        <form onSubmit={handleCreateSetlist} className="card space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Create Setlist</h2>
            <p className="text-sm text-gray-500 mt-1">
              Start a new setlist for rehearsals or gigs.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
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
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={creating}
            >
              {creating ? 'Creating...' : '+ New Setlist'}
            </button>
          </div>
        </form>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">All Setlists</h2>
            <span className="text-sm text-gray-500">{setlists.length} total</span>
          </div>

          {setlists.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">No setlists yet. Create one to start adding songs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {setlists.map((setlist) => (
                <Link
                  key={setlist.id}
                  to={`/groups/${groupId}/setlists/${setlist.id}`}
                  className="card hover:shadow-lg transition"
                >
                  <h3 className="text-xl font-bold mb-2">{setlist.name}</h3>
                  <p className="text-gray-600 mb-4">
                    {setlist.items.length} {setlist.items.length === 1 ? 'song' : 'songs'}
                  </p>
                  <p className="text-blue-600 hover:underline">Open setlist →</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
