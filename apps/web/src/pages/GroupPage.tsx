import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi, groupApi, contentApi } from '../lib/api'
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container-app">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to Bands
          </button>
          <h1 className="text-3xl font-bold">{group?.name}</h1>
          {group?.description && <p className="text-gray-600">{group.description}</p>}
        </div>
      </header>

      <main className="container-app">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_360px]">
          <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Content Library</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Keep charts, lyrics, recordings, and references in one place for everyone.
                </p>
              </div>

              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                + Upload Content
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {contents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No content yet. Upload something to get started!</p>
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
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Band Members</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact everyone in the band and keep roles visible.
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {sortedMembers.length}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {sortedMembers.map((member) => {
                  const label = member.user.name || member.user.email
                  const isCurrentUser = member.user.id === currentUser?.id
                  const initials = label.charAt(0).toUpperCase()

                  return (
                    <div
                      key={member.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">{label}</p>
                          {isCurrentUser && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              You
                            </span>
                          )}
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600">
                            {member.role}
                          </span>
                        </div>
                        <p className="truncate text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Invite To Band</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Send an invitation by email. They only become a band member after accepting it
                from their own MyBand account.
              </p>

              <form onSubmit={handleInviteMember} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-gray-700">
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
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Only band admins can invite members.
                  </p>
                )}

                {inviteStatus && (
                  <div
                    className={`rounded-xl px-3 py-2 text-sm ${
                      inviteStatus.tone === 'success'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {inviteStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={inviteLoading || !canInviteMembers}
                >
                  {inviteLoading ? 'Sending invitation...' : 'Send Invitation'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Pending Invitations</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    These people will appear as members only after they accept.
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  {pendingInvitations.length}
                </span>
              </div>

              {pendingInvitations.length === 0 ? (
                <p className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  No pending invitations right now.
                </p>
              ) : (
                <div className="mt-5 space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900">{invitation.email}</p>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-700">
                          Pending
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500">
                        {invitation.invitee
                          ? `Waiting for ${invitation.invitee.name || invitation.invitee.email} to accept in their dashboard.`
                          : 'No account found yet. They can sign up with this email and accept the invite afterward.'}
                      </p>
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
