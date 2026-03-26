import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi, joinApi } from '../lib/api'
import { setPostAuthRedirect } from '../lib/postAuthRedirect'
import { clearToken, getToken } from '../lib/tokenStorage'
import '../styles/auth.css'

interface GroupPreview {
  id: string
  name: string
  description?: string
}

interface UserGroup {
  id: string
  name: string
  description?: string
}

interface CurrentUser {
  id: string
  email: string
  name?: string
  groups: UserGroup[]
}

interface StatusMessage {
  tone: 'success' | 'error'
  text: string
}

export default function JoinGroupPage() {
  const navigate = useNavigate()
  const { token } = useParams()

  const [group, setGroup] = useState<GroupPreview | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadPage()
  }, [token])

  const loadPage = async () => {
    if (!token) {
      setError('This band link is missing a token.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const previewData = await joinApi.getPreview(token)
      setGroup(previewData.group)

      const storedToken = await getToken()

      if (!storedToken) {
        setCurrentUser(null)
        return
      }

      try {
        const profileData = await authApi.getProfile({ skipAuthRedirect: true })
        setCurrentUser(profileData.user)
      } catch {
        await clearToken()
        setCurrentUser(null)
      }
    } catch (err: any) {
      setGroup(null)
      setCurrentUser(null)
      setError(err?.message || 'This band link is not available.')
    } finally {
      setLoading(false)
    }
  }

  const startAuthFlow = (path: string) => {
    if (!token) {
      return
    }

    setPostAuthRedirect(`/join/${token}`)
    navigate(path)
  }

  const handleJoinGroup = async () => {
    if (!token || !group) {
      return
    }

    setJoining(true)
    setStatus(null)

    try {
      const response = await joinApi.joinGroup(token)
      setStatus({
        tone: 'success',
        text: response.alreadyMember
          ? 'You are already in this band. Opening it now...'
          : 'You joined the band. Opening it now...',
      })
      setTimeout(() => {
        navigate(`/groups/${response.group.id}`)
      }, 700)
    } catch (err: any) {
      setStatus({
        tone: 'error',
        text: err?.message || 'Failed to join this band.',
      })
    } finally {
      setJoining(false)
    }
  }

  const alreadyMember = Boolean(currentUser?.groups.some((currentGroup) => currentGroup.id === group?.id))

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm text-center">
          <p className="section-kicker">Joining</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">Checking this band link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex min-h-screen items-center">
      <main className="container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="glass-card">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/70">MyBand</p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Join this <span className="app-brand text-orange-400">band.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/[0.74]">
            Accept the link, sign in or create an account, and step into the shared workspace.
          </p>
        </section>

        <section className="card">
          <p className="section-kicker">Band Link</p>

          {!group ? (
            <>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Link unavailable</h2>
              <div className="mt-5 status-banner status-banner-muted status-banner-attention">
                {error || 'This band link is invalid, expired, or has already been replaced.'}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/" className="btn-secondary">
                  Back Home
                </Link>
                <Link to="/auth/login" className="btn-primary">
                  Log In
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">{group.name}</h2>
              {group.description && (
                <p className="mt-3 text-sm leading-6 text-black/60">
                  {group.description}
                </p>
              )}

              {status && (
                <div
                  className={`mt-5 status-banner ${
                    status.tone === 'success' ? 'status-banner-strong' : 'status-banner-muted status-banner-attention'
                  }`}
                >
                  {status.text}
                </div>
              )}

              {!currentUser && (
                <>
                  <p className="mt-5 text-sm leading-6 text-black/60">
                    You need a MyBand account before you can join. After sign up or login, we will
                    bring you straight back here.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startAuthFlow('/auth/register')}
                      className="btn-primary"
                    >
                      Sign Up To Join
                    </button>
                    <button
                      type="button"
                      onClick={() => startAuthFlow('/auth/login')}
                      className="btn-secondary"
                    >
                      Log In
                    </button>
                  </div>
                </>
              )}

              {currentUser && alreadyMember && (
                <>
                  <p className="mt-5 text-sm leading-6 text-black/60">
                    Signed in as {currentUser.email}. You are already a member of this band.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="btn-primary"
                    >
                      Open Band
                    </button>
                    <Link to="/dashboard" className="btn-secondary">
                      Back To Dashboard
                    </Link>
                  </div>
                </>
              )}

              {currentUser && !alreadyMember && (
                <>
                  <p className="mt-5 text-sm leading-6 text-black/60">
                    Signed in as {currentUser.email}. Confirm below to join this band and open the
                    shared workspace.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void handleJoinGroup()}
                      className="btn-primary"
                      disabled={joining}
                    >
                      {joining ? 'Joining Band...' : 'Join Band'}
                    </button>
                    <Link to="/dashboard" className="btn-secondary">
                      Not Now
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
