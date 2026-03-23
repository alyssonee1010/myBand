import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, groupApi } from '../lib/api'
import GroupList from '../components/GroupList'
import CreateGroupModal from '../components/CreateGroupModal'
import '../styles/dashboard.css'

interface User {
  id: string
  email: string
  name?: string
}

interface Group {
  id: string
  name: string
  description?: string
}

interface PendingInvitation {
  id: string
  email: string
  createdAt: string
  group: Group
  invitedBy: User
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/auth/login')
        return
      }

      const profileRes = await authApi.getProfile()
      setUser(profileRes.user)
      setGroups(profileRes.user.groups || [])
      setPendingInvitations(profileRes.user.pendingInvitations || [])
    } catch (err) {
      localStorage.removeItem('token')
      navigate('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      const newGroup = await groupApi.createGroup(name, description)
      setGroups((currentGroups) => [...currentGroups, newGroup])
      setShowCreateModal(false)
    } catch (err) {
      alert('Failed to create group')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const handleAcceptInvitation = async (invitation: PendingInvitation) => {
    try {
      setAcceptingInvitationId(invitation.id)
      await groupApi.acceptInvitation(invitation.group.id, invitation.id)
      await loadData()
    } catch (err) {
      alert('Failed to accept invitation')
    } finally {
      setAcceptingInvitationId(null)
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
        <div className="container-app flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎸 MyBand</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container-app">
        {pendingInvitations.length > 0 && (
          <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-emerald-950">Pending Invitations</h2>
                <p className="text-sm text-emerald-800">
                  Accept an invitation to join a band. You will only be added after you confirm here.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-emerald-800">
                {pendingInvitations.length}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-xl border border-emerald-200 bg-white p-4"
                >
                  <p className="text-lg font-semibold text-gray-900">{invitation.group.name}</p>
                  {invitation.group.description && (
                    <p className="mt-1 text-sm text-gray-500">{invitation.group.description}</p>
                  )}
                  <p className="mt-3 text-sm text-gray-600">
                    Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                  </p>

                  <button
                    onClick={() => handleAcceptInvitation(invitation)}
                    className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={acceptingInvitationId === invitation.id}
                  >
                    {acceptingInvitationId === invitation.id ? 'Accepting...' : 'Accept Invitation'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Your Bands</h2>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + New Band
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No bands yet. Create one to get started!</p>
          </div>
        ) : (
          <GroupList groups={groups} />
        )}
      </main>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  )
}
