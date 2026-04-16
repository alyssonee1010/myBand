import { useState } from 'react'
import LinkifiedText from './LinkifiedText'

interface Content {
  id: string
  title: string
  contentType: string
  description?: string
  fileUrl?: string | null
  createdBy: {
    id: string
    name?: string
    email: string
  }
}

interface Props {
  contents: Content[]
  onDelete: (contentId: string) => Promise<void>
  onEdit: (contentId: string, title: string, description: string) => Promise<void>
  onPreview: (content: Content) => void
}

export default function ContentList({ contents, onDelete, onEdit, onPreview }: Props) {
  const [editingContentId, setEditingContentId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [savingContentId, setSavingContentId] = useState<string | null>(null)
  const [editError, setEditError] = useState('')

  const getTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'lyrics':
        return 'Lyrics'
      case 'chords':
        return 'Chords'
      case 'pdf':
        return 'PDF'
      case 'image':
        return 'Image'
      default:
        return 'File'
    }
  }

  const startRenaming = (content: Content) => {
    setEditingContentId(content.id)
    setDraftTitle(content.title)
    setDraftDescription(content.description || '')
    setEditError('')
  }

  const cancelRenaming = () => {
    setEditingContentId(null)
    setDraftTitle('')
    setDraftDescription('')
    setEditError('')
  }

  const handleSaveDetails = async (contentId: string) => {
    const trimmedTitle = draftTitle.trim()
    const trimmedDescription = draftDescription.trim()

    if (!trimmedTitle) {
      setEditError('Title is required')
      return
    }

    setSavingContentId(contentId)
    setEditError('')

    try {
      await onEdit(contentId, trimmedTitle, trimmedDescription)
      cancelRenaming()
    } catch (error: any) {
      setEditError(error?.message || 'Failed to save this item')
    } finally {
      setSavingContentId(null)
    }
  }

  return (
    <div className="space-y-4">
      {contents.map((content, index) => {
        const isEditing = editingContentId === content.id
        const isSaving = savingContentId === content.id
        const canPreview =
          Boolean(content.fileUrl) && (content.contentType === 'image' || content.contentType === 'pdf')

        return (
          <div
            key={content.id}
            className="rounded-[26px] border border-black/10 bg-white/[0.82] p-5"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70">
                    {getTypeLabel(content.contentType)}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      className="input-field"
                      placeholder="Song title"
                      disabled={isSaving}
                      autoFocus
                    />
                    <textarea
                      value={draftDescription}
                      onChange={(event) => setDraftDescription(event.target.value)}
                      className="input-field min-h-[7.5rem] resize-y"
                      placeholder="Add notes, links, or arrangement details"
                      disabled={isSaving}
                    />
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">
                      Links like https://... or www... will be clickable after saving.
                    </p>
                    {editError && <p className="text-sm text-red-700">{editError}</p>}
                  </div>
                ) : (
                  <div className="mt-4">
                    {canPreview ? (
                      <button
                        type="button"
                        onClick={() => onPreview(content)}
                        className="max-w-full text-left text-2xl font-bold tracking-tight text-black transition hover:text-orange-600 [overflow-wrap:anywhere]"
                      >
                        {content.title}
                      </button>
                    ) : (
                      <h3 className="text-2xl font-bold tracking-tight text-black [overflow-wrap:anywhere]">
                        {content.title}
                      </h3>
                    )}
                  </div>
                )}

                {content.description && (
                  <LinkifiedText
                    text={content.description}
                    className="mt-3 max-w-2xl text-sm leading-6 text-black/60"
                  />
                )}
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-black/40">
                  Added by {content.createdBy.name || content.createdBy.email}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {canPreview && !isEditing && (
                  <button
                    type="button"
                    onClick={() => onPreview(content)}
                    className="btn-primary"
                  >
                    Preview
                  </button>
                )}

                {isEditing ? (
                  <>
                    <button
                      onClick={() => void handleSaveDetails(content.id)}
                      className="btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelRenaming}
                      className="btn-secondary"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startRenaming(content)}
                    className="btn-secondary"
                  >
                    Edit Details
                  </button>
                )}

                <button
                  onClick={() => void onDelete(content.id)}
                  className="btn-danger"
                  disabled={isSaving}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
