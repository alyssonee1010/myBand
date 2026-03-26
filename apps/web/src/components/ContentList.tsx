import { useState } from 'react'

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
  onRename: (contentId: string, title: string) => Promise<void>
  onPreview: (content: Content) => void
}

export default function ContentList({ contents, onDelete, onRename, onPreview }: Props) {
  const [editingContentId, setEditingContentId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [savingContentId, setSavingContentId] = useState<string | null>(null)
  const [renameError, setRenameError] = useState('')

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
    setRenameError('')
  }

  const cancelRenaming = () => {
    setEditingContentId(null)
    setDraftTitle('')
    setRenameError('')
  }

  const handleRename = async (contentId: string) => {
    const trimmedTitle = draftTitle.trim()

    if (!trimmedTitle) {
      setRenameError('Title is required')
      return
    }

    setSavingContentId(contentId)
    setRenameError('')

    try {
      await onRename(contentId, trimmedTitle)
      cancelRenaming()
    } catch (error: any) {
      setRenameError(error?.message || 'Failed to rename this item')
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
                      placeholder="Rename this item"
                      disabled={isSaving}
                      autoFocus
                    />
                    {renameError && (
                      <p className="text-sm text-red-700">{renameError}</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    {canPreview ? (
                      <button
                        type="button"
                        onClick={() => onPreview(content)}
                        className="text-left text-2xl font-bold tracking-tight text-black transition hover:text-orange-600"
                      >
                        {content.title}
                      </button>
                    ) : (
                      <h3 className="text-2xl font-bold tracking-tight text-black">{content.title}</h3>
                    )}
                  </div>
                )}

                {content.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60">
                    {content.description}
                  </p>
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
                      onClick={() => void handleRename(content.id)}
                      className="btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Title'}
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
                    Rename
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
