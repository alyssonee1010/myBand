import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi, contentApi, groupApi } from '../lib/api'
import ContentList from '../components/ContentList'
import ContentPreviewModal from '../components/ContentPreviewModal'
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

interface GroupJoinLink {
  id: string
  token: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: User | null
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
  fileUrl?: string | null
  fileName?: string | null
  createdBy: {
    id: string
    email: string
    name?: string
  }
}

interface StatusMessage {
  tone: 'success' | 'error'
  text: string
}

function buildJoinLinkUrl(token: string) {
  const joinPath = window.location.hash.startsWith('#/') ? `/#/join/${token}` : `/join/${token}`
  return new URL(joinPath, window.location.origin).toString()
}

export default function GroupPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [contents, setContents] = useState<Content[]>([])
  const [joinLink, setJoinLink] = useState<GroupJoinLink | null>(null)
  const [previewContent, setPreviewContent] = useState<Content | null>(null)
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joinLinkLoading, setJoinLinkLoading] = useState(false)
  const [joinLinkAction, setJoinLinkAction] = useState<'create' | 'copy' | 'disable' | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<StatusMessage | null>(null)
  const [joinLinkStatus, setJoinLinkStatus] = useState<StatusMessage | null>(null)
  const [pendingInvitationStatus, setPendingInvitationStatus] = useState<StatusMessage | null>(null)
  const [removingInvitationId, setRemovingInvitationId] = useState<string | null>(null)

  useEffect(() => {
    if (groupId) {
      void loadGroup(true)
    }
  }, [groupId])

  useEffect(() => {
    if (!groupId || !previewContent?.fileUrl) {
      setPreviewLoading(false)
      setPreviewError('')
      setPreviewFileUrl((currentPreviewFileUrl) => {
        if (currentPreviewFileUrl) {
          URL.revokeObjectURL(currentPreviewFileUrl)
        }

        return null
      })
      return
    }

    let cancelled = false

    const loadPreview = async () => {
      setPreviewLoading(true)
      setPreviewError('')

      try {
        const blob = await contentApi.getContentFile(groupId, previewContent.id)

        if (cancelled) {
          return
        }

        const nextPreviewFileUrl = URL.createObjectURL(blob)
        setPreviewFileUrl((currentPreviewFileUrl) => {
          if (currentPreviewFileUrl) {
            URL.revokeObjectURL(currentPreviewFileUrl)
          }

          return nextPreviewFileUrl
        })
      } catch (error: any) {
        if (!cancelled) {
          setPreviewError(error?.message || 'Failed to load this preview.')
          setPreviewFileUrl((currentPreviewFileUrl) => {
            if (currentPreviewFileUrl) {
              URL.revokeObjectURL(currentPreviewFileUrl)
            }

            return null
          })
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [groupId, previewContent?.fileUrl, previewContent?.id])

  useEffect(() => {
    return () => {
      if (previewFileUrl) {
        URL.revokeObjectURL(previewFileUrl)
      }
    }
  }, [previewFileUrl])

  const loadGroup = async (showPageLoader = false) => {
    if (!groupId) {
      return
    }

    if (showPageLoader) {
      setLoading(true)
    }

    try {
      const [groupData, contentsData, profileData] = await Promise.all([
        groupApi.getGroup(groupId),
        contentApi.getGroupContent(groupId),
        authApi.getProfile(),
      ])

      setCurrentUser(profileData.user)
      setGroup(groupData)
      setContents(contentsData.contents)

      const currentMembership = groupData.members.find(
        (member: GroupMember) => member.user.id === profileData.user.id
      )

      if (currentMembership?.role === 'admin') {
        setJoinLinkLoading(true)

        try {
          const activeJoinLink = await groupApi.getJoinLink(groupId)
          setJoinLink(activeJoinLink)
          setJoinLinkStatus(null)
        } catch {
          setJoinLink(null)
          setJoinLinkStatus({
            tone: 'error',
            text: 'Failed to load the band link controls.',
          })
        } finally {
          setJoinLinkLoading(false)
        }
      } else {
        setJoinLink(null)
        setJoinLinkLoading(false)
        setJoinLinkStatus(null)
      }
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

  const handleRenameContent = async (contentId: string, title: string) => {
    const updatedContent = await contentApi.updateContentTitle(groupId!, contentId, title)

    setContents((currentContents) =>
      currentContents.map((content) =>
        content.id === contentId
          ? {
              ...content,
              ...updatedContent,
              createdBy: updatedContent.createdBy || content.createdBy,
            }
          : content
      )
    )
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

  const handleOpenPreview = (content: Content) => {
    setPreviewContent(content)
    setPreviewError('')
  }

  const handleClosePreview = () => {
    setPreviewContent(null)
    setPreviewLoading(false)
    setPreviewError('')
    setPreviewFileUrl((currentPreviewFileUrl) => {
      if (currentPreviewFileUrl) {
        URL.revokeObjectURL(currentPreviewFileUrl)
      }

      return null
    })
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

  const handleCreateOrRegenerateJoinLink = async () => {
    if (!groupId) {
      return
    }

    if (
      joinLink &&
      !confirm('Regenerate the current band link? Anyone with the old link will lose access.')
    ) {
      return
    }

    setJoinLinkAction('create')
    setJoinLinkStatus(null)

    try {
      const nextJoinLink = await groupApi.createJoinLink(groupId)
      setJoinLink(nextJoinLink)
      setJoinLinkStatus({
        tone: 'success',
        text: joinLink
          ? 'Band link refreshed. Older links no longer work.'
          : 'Band link created. You can share it now.',
      })
    } catch (error) {
      const apiError = error as Error & { status?: number }
      setJoinLinkStatus({
        tone: 'error',
        text:
          apiError.status === 403
            ? 'Only band admins can manage the band link.'
            : apiError.message || 'Failed to create the band link.',
      })
    } finally {
      setJoinLinkAction(null)
    }
  }

  const handleCopyJoinLink = async () => {
    if (!joinLink) {
      return
    }

    setJoinLinkAction('copy')
    setJoinLinkStatus(null)

    try {
      await navigator.clipboard.writeText(buildJoinLinkUrl(joinLink.token))
      setJoinLinkStatus({
        tone: 'success',
        text: 'Band link copied to your clipboard.',
      })
    } catch {
      setJoinLinkStatus({
        tone: 'error',
        text: 'Copy failed on this device. You can still copy the link manually from the field below.',
      })
    } finally {
      setJoinLinkAction(null)
    }
  }

  const handleDisableJoinLink = async () => {
    if (!groupId) {
      return
    }

    if (!confirm('Disable the current band link? Anyone using it will stop being able to join.')) {
      return
    }

    setJoinLinkAction('disable')
    setJoinLinkStatus(null)

    try {
      await groupApi.disableJoinLink(groupId)
      setJoinLink(null)
      setJoinLinkStatus({
        tone: 'success',
        text: 'Band link disabled.',
      })
    } catch (error) {
      const apiError = error as Error & { status?: number }
      setJoinLinkStatus({
        tone: 'error',
        text:
          apiError.status === 403
            ? 'Only band admins can manage the band link.'
            : apiError.message || 'Failed to disable the band link.',
      })
    } finally {
      setJoinLinkAction(null)
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
  const shareableJoinLink = joinLink ? buildJoinLinkUrl(joinLink.token) : ''

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

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/groups/${groupId}/setlists`)}
                  className="btn-secondary"
                >
                  View Setlists
                </button>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                  Upload Content
                </button>
              </div>
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
                  onRename={handleRenameContent}
                  onPreview={handleOpenPreview}
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

            {canInviteMembers && (
              <section className="card">
                <p className="section-kicker">Band Link</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Reusable Join Link</h2>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  Share one link that lets anyone sign up, log in, and join this band from a
                  confirmation screen.
                </p>

                {joinLinkStatus && (
                  <div
                    className={`mt-5 status-banner ${
                      joinLinkStatus.tone === 'success'
                        ? 'status-banner-strong'
                        : 'status-banner-muted'
                    }`}
                  >
                    {joinLinkStatus.text}
                  </div>
                )}

                {joinLinkLoading ? (
                  <p className="mt-5 text-sm text-black/60">Loading the current band link...</p>
                ) : joinLink ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-black/70">
                        Shareable link
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={shareableJoinLink}
                        className="input-field"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleCopyJoinLink()}
                        className="btn-primary"
                        disabled={joinLinkAction !== null}
                      >
                        {joinLinkAction === 'copy' ? 'Copying...' : 'Copy Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCreateOrRegenerateJoinLink()}
                        className="btn-secondary"
                        disabled={joinLinkAction !== null}
                      >
                        {joinLinkAction === 'create' ? 'Refreshing...' : 'Regenerate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDisableJoinLink()}
                        className="btn-danger"
                        disabled={joinLinkAction !== null}
                      >
                        {joinLinkAction === 'disable' ? 'Disabling...' : 'Disable'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <p className="rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-4 py-6 text-sm text-black/60">
                      No band link yet. Create one when you want people to join from a shareable link.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleCreateOrRegenerateJoinLink()}
                      className="btn-primary w-full"
                      disabled={joinLinkAction !== null}
                    >
                      {joinLinkAction === 'create' ? 'Creating link...' : 'Create Band Link'}
                    </button>
                  </div>
                )}
              </section>
            )}

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

      {previewContent && (
        <ContentPreviewModal
          content={previewContent}
          fileUrl={previewFileUrl}
          loading={previewLoading}
          error={previewError}
          onClose={handleClosePreview}
        />
      )}
    </div>
  )
}
