import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi, contentApi, groupApi } from '../lib/api'
import ContentList from '../components/ContentList'
import UploadContentModal from '../components/UploadContentModal'
import '../styles/group.css'

interface User {
  id: string
  email: string
  name?: string
}

interface GroupMember {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: User
}

interface GroupInvitation {
  id: string
  email: string
  status: string
  createdAt: string
  inviteeId?: string | null
  invitedBy: User
  invitee?: User | null
}

interface Group {
  id: string
  name: string
  description?: string
  members: GroupMember[]
  invitations: GroupInvitation[]
}

interface Content {
  id: string
  title: string
  contentType: string
  description?: string
  createdBy: any
}

interface StatusMessage {
  tone: 'success' | 'error'
  text: string
}

export default function GroupPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [contents, setContents] = useState<Content[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<StatusMessage | null>(null)
  const [pendingInvitationStatus, setPendingInvitationStatus] = useState<StatusMessage | null>(null)
  const [removingInvitationId, setRemovingInvitationId] = useState<string | null>(null)

  useEffect(() => {
    if (groupId) {
      void loadGroup(true)
    }
  }, [groupId])

  const loadGroup = async (showPageLoader = false) => {
    if (showPageLoader) {
      setLoading(true)
    }

    try {
      const [groupData, contentsData, profileData] = await Promise.all([
        groupApi.getGroup(groupId!),
        contentApi.getGroupContent(groupId!),
        authApi.getProfile(),
      ])

      setCurrentUser(profileData.user)
      setGroup(groupData)
      setContents(contentsData.contents)
    } catch (err) {
      alert('Failed to load group')
      navigate('/dashboard')
    } finally {
      if (showPageLoader) {
        setLoading(false)
      }
    }
  }

  const handleUpload = async (title: string, description: string, file: File) => {
    try {
      await contentApi.uploadContent(groupId!, title, description, file)
      await loadGroup()
      setShowUploadModal(false)
    } catch (err) {
      alert('Failed to upload content')
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Delete this content?')) return
    try {
      await contentApi.deleteContent(groupId!, contentId)
      setContents((currentContents) => currentContents.filter((content) => content.id !== contentId))
    } catch (err) {
      alert('Failed to delete content')
    }
  }

  const handleInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = inviteEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      setInviteStatus({
        tone: 'error',
        text: 'Enter an email address to invite someone to this band.',
      })
      return
    }

    setInviteLoading(true)
    setInviteStatus(null)
    setPendingInvitationStatus(null)

    try {
      const invitation = await groupApi.inviteMember(groupId!, normalizedEmail)

      setGroup((currentGroup) => {
        if (!currentGroup) {
          return currentGroup
        }

        return {
          ...currentGroup,
          invitations: [
            invitation,
            ...currentGroup.invitations.filter((currentInvitation) => currentInvitation.id !== invitation.id),
          ],
        }
      })

      setInviteEmail('')
      setInviteStatus({
        tone: 'success',
        text: `Invitation sent to ${invitation.email}. They will join the band once they accept it.`,
      })
    } catch (error) {
      const apiError = error as Error & { status?: number }
      let message = apiError.message || 'Failed to send this invitation.'

      if (apiError.status === 403) {
        message = 'Only band admins can invite members.'
      } else if (apiError.status === 400 && message === 'User is already a member of this group') {
        message = `${normalizedEmail} is already in this band.`
      } else if (apiError.status === 400 && message === 'Invitation is already pending for this email') {
        message = `There is already a pending invitation for ${normalizedEmail}.`
      }

      setInviteStatus({
        tone: 'error',
        text: message,
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveInvitation = async (invitation: GroupInvitation) => {
    if (!groupId) {
      return
    }

    const shouldRemove = confirm(`Remove the pending request for ${invitation.email}?`)
    if (!shouldRemove) {
      return
    }

    setRemovingInvitationId(invitation.id)
    setPendingInvitationStatus(null)

    try {
      await groupApi.removeInvitation(groupId, invitation.id)
      setGroup((currentGroup) => {
        if (!currentGroup) {
          return currentGroup
        }

        return {
          ...currentGroup,
          invitations: currentGroup.invitations.filter(
            (currentInvitation) => currentInvitation.id !== invitation.id
          ),
        }
      })
      setPendingInvitationStatus({
        tone: 'success',
        text: `${invitation.email} has been removed from pending requests.`,
      })
    } catch (error) {
      const apiError = error as Error & { status?: number }
      let message = apiError.message || 'Failed to remove this pending request.'

      if (apiError.status === 403) {
        message = 'Only band admins can remove pending requests.'
      } else if (apiError.status === 400) {
        message = 'This request is no longer pending.'
      }

      setPendingInvitationStatus({
        tone: 'error',
        text: message,
      })
    } finally {
      setRemovingInvitationId(null)
    }
  }

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm text-center">
          <p className="section-kicker">Loading</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">Setting up your band workspace...</p>
        </div>
      </div>
    )
  }

  const currentMembership = group?.members.find((member) => member.user.id === currentUser?.id)
  const canInviteMembers = currentMembership?.role === 'admin'
  const sortedMembers = [...(group?.members || [])].sort((leftMember, rightMember) => {
    if (leftMember.role !== rightMember.role) {
      return leftMember.role === 'admin' ? -1 : 1
    }

    const leftLabel = leftMember.user.name || leftMember.user.email
    const rightLabel = rightMember.user.name || rightMember.user.email
    return leftLabel.localeCompare(rightLabel)
  })
  const pendingInvitations = group?.invitations || []

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-app">
          <button
            onClick={() => navigate('/dashboard')}
            className="app-link mb-5 inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Bands</span>
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">Band Workspace</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-black md:text-5xl">
                {group?.name}
              </h1>
              {group?.description && (
                <p className="mt-4 text-sm leading-6 text-black/60 md:text-base">
                  {group.description}
                </p>
              )}
            </div>

            <div className="card max-w-sm">
              <p className="section-kicker">Overview</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold tracking-tight">{sortedMembers.length}</p>
                  <p className="soft-label mt-1">members</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tracking-tight">{pendingInvitations.length}</p>
                  <p className="soft-label mt-1">pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_360px]">
          <section className="space-y-6">
            <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-kicker">Library</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">Content Library</h2>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  Keep charts, lyrics, recordings, and references in one place for everyone.
                </p>
              </div>

              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                Upload Content
              </button>
            </div>

            <div className="card">
              {contents.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-6 py-16 text-center">
                  <p className="text-xl font-semibold tracking-tight">No content yet</p>
                  <p className="mt-2 text-sm text-black/60">
                    Upload something to start building your shared band library.
                  </p>
                </div>
              ) : (
                <ContentList
                  contents={contents}
                  onDelete={handleDeleteContent}
                  groupId={groupId!}
                />
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-kicker">People</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Band Members</h2>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    Contact everyone in the band and keep roles visible.
                  </p>
                </div>
                <span className="stat-pill">{sortedMembers.length}</span>
              </div>

              <div className="mt-5 space-y-3">
                {sortedMembers.map((member) => {
                  const label = member.user.name || member.user.email
                  const isCurrentUser = member.user.id === currentUser?.id
                  const initials = label.charAt(0).toUpperCase()

                  return (
                    <div
                      key={member.id}
                      className="flex items-start gap-3 rounded-[24px] border border-black/10 bg-white/80 px-4 py-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/20 bg-black text-sm font-semibold text-white">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-black">{label}</p>
                          {isCurrentUser && (
                            <span className="rounded-full border border-orange-300/70 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                              You
                            </span>
                          )}
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                            {member.role}
                          </span>
                        </div>
                        <p className="truncate pt-1 text-sm text-black/50">{member.user.email}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="card">
              <p className="section-kicker">Invite</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Invite To Band</h2>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Send an invitation by email. They only become a band member after accepting it
                from their own MyBand account.
              </p>

              <form onSubmit={handleInviteMember} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-black/70">
                    Member email
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    className="input-field"
                    placeholder="bandmate@example.com"
                    disabled={inviteLoading || !canInviteMembers}
                  />
                </div>

                {!canInviteMembers && (
                  <p className="status-banner status-banner-muted">
                    Only band admins can invite members.
                  </p>
                )}

                {inviteStatus && (
                  <div
                    className={`status-banner ${
                      inviteStatus.tone === 'success'
                        ? 'status-banner-strong'
                        : 'status-banner-muted'
                    }`}
                  >
                    {inviteStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={inviteLoading || !canInviteMembers}
                >
                  {inviteLoading ? 'Sending invitation...' : 'Send Invitation'}
                </button>
              </form>
            </section>

            <section className="card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-kicker">Pending</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Pending Invitations</h2>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    These people will appear as members only after they accept.
                  </p>
                </div>
                <span className="stat-pill">{pendingInvitations.length}</span>
              </div>

              {pendingInvitationStatus && (
                <div
                  className={`mt-5 status-banner ${
                    pendingInvitationStatus.tone === 'success'
                      ? 'status-banner-strong'
                      : 'status-banner-muted'
                  }`}
                >
                  {pendingInvitationStatus.text}
                </div>
              )}

              {pendingInvitations.length === 0 ? (
                <p className="mt-5 rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-4 py-6 text-sm text-black/60">
                  No pending invitations right now.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="rounded-[24px] border border-black/10 bg-white/80 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-black">{invitation.email}</p>
                        <span className="rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                          Pending
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-black/60">
                        {invitation.invitee
                          ? `Waiting for ${invitation.invitee.name || invitation.invitee.email} to accept in their dashboard.`
                          : 'No account found yet. They can sign up with this email and accept the invite afterward.'}
                      </p>

                      {canInviteMembers && (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleRemoveInvitation(invitation)}
                            className="btn-danger"
                            disabled={removingInvitationId === invitation.id}
                          >
                            {removingInvitationId === invitation.id ? 'Removing...' : 'Remove Request'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      {showUploadModal && (
        <UploadContentModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  )
}
