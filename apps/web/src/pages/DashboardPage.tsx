import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, groupApi } from '../lib/api'
import GroupList from '../components/GroupList'
import CreateGroupModal from '../components/CreateGroupModal'
import InstallAppButton from '../components/InstallAppButton'
import { clearToken, getToken } from '../lib/tokenStorage'
import '../styles/dashboard.css'

interface User {
  id: string
  email: string
  name?: string
  emailVerifiedAt?: string | null
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
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = await getToken()
      if (!token) {
        navigate('/auth/login')
        return
      }

      const profileRes = await authApi.getProfile()
      setUser(profileRes.user)
      setGroups(profileRes.user.groups || [])
      setPendingInvitations(profileRes.user.pendingInvitations || [])
    } catch (err) {
      await clearToken()
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

  const handleLogout = async () => {
    await clearToken()
    navigate('/')
  }

  const handleDeleteAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!deletePassword) {
      setDeleteStatus({
        tone: 'error',
        text: 'Enter your password to delete your account.',
      })
      return
    }

    const confirmed = confirm(
      'Delete your account permanently? This removes your memberships, your uploads, and any bands that only you belong to.'
    )

    if (!confirmed) {
      return
    }

    setDeleteLoading(true)
    setDeleteStatus(null)

    try {
      const response = await authApi.deleteAccount(deletePassword)
      await clearToken()
      setDeleteStatus({
        tone: 'success',
        text: response.message || 'Your account has been deleted.',
      })
      navigate('/')
    } catch (error) {
      const apiError = error as Error & { status?: number }
      setDeleteStatus({
        tone: 'error',
        text: apiError.message || 'Failed to delete your account.',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitation: PendingInvitation) => {
    try {
      setAcceptingInvitationId(invitation.id)
      await groupApi.acceptInvitation(invitation.group.id, invitation.id)
      await loadData()
    } catch (error) {
      const apiError = error as Error & { status?: number }

      if (apiError.status === 400 || apiError.status === 404) {
        await loadData()
        alert('This invitation is no longer available.')
      } else {
        alert('Failed to accept invitation')
      }
    } finally {
      setAcceptingInvitationId(null)
    }
  }

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm text-center">
          <p className="section-kicker">Loading</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">Pulling your latest band activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-app flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Dashboard</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-black md:text-5xl">
              Welcome back, {user?.name || user?.email?.split('@')[0]}.
            </h1>
            <p className="mt-4 text-sm leading-6 text-black/60 md:text-base">
              Keep your bands, invitations, and rehearsal prep in one focused workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="stat-pill">{pendingInvitations.length} pending</span>
            <InstallAppButton label="Install MyBand" />
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container-app space-y-8">
        {pendingInvitations.length > 0 && (
          <section className="glass-card">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
                  Pending Invitations
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">Requests waiting on you</h2>
                <p className="mt-2 text-sm leading-6 text-white/[0.74]">
                  Accept an invitation to join a band. Revoked requests disappear automatically and
                  can no longer be accepted.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                {pendingInvitations.length}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <p className="text-2xl font-semibold tracking-tight">{invitation.group.name}</p>
                  {invitation.group.description && (
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {invitation.group.description}
                    </p>
                  )}
                  <p className="mt-4 text-sm text-white/70">
                    Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                  </p>

                  <button
                    onClick={() => void handleAcceptInvitation(invitation)}
                    className="btn-primary mt-5 w-full"
                    disabled={acceptingInvitationId === invitation.id}
                  >
                    {acceptingInvitationId === invitation.id ? 'Accepting...' : 'Accept Invitation'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-kicker">Your Bands</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white/75">Everything you’re building</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Open a band to manage members, shared files, and setlists.
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create New Band
          </button>
        </section>

        {groups.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-2xl font-semibold tracking-tight">No bands yet</p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-black/60">
              Create your first band to start inviting members, uploading charts, and building
              setlists together.
            </p>
          </div>
        ) : (
          <GroupList groups={groups} />
        )}

        <section className="card">
          <p className="section-kicker">Account</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Your account</h2>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Signed in as {user?.email}. Email status:{' '}
            {user?.emailVerifiedAt ? 'verified' : 'not verified'}.
          </p>

          <div className="mt-8 rounded-[24px] border border-red-200 bg-red-50/80 p-5">
            <p className="text-lg font-semibold tracking-tight text-red-900">Delete account</p>
            <p className="mt-2 text-sm leading-6 text-red-900/70">
              This permanently deletes your account, your uploaded content, and any bands that only
              you belong to. If you are the only admin in a shared band, another member will be
              promoted automatically.
            </p>

            {deleteStatus && (
              <div
                className={`mt-5 status-banner ${
                  deleteStatus.tone === 'success' ? 'status-banner-strong' : 'status-banner-muted'
                }`}
              >
                {deleteStatus.text}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-red-900/80">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  disabled={deleteLoading}
                />
              </div>

              <button type="submit" className="btn-danger" disabled={deleteLoading}>
                {deleteLoading ? 'Deleting account...' : 'Delete Account'}
              </button>
            </form>
          </div>
        </section>
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
