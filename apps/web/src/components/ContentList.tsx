import { Link } from 'react-router-dom'

interface Content {
  id: string
  title: string
  contentType: string
  description?: string
  createdBy: {
    name: string
    email: string
  }
}

interface Props {
  contents: Content[]
  onDelete: (contentId: string) => Promise<void>
  groupId: string
}

export default function ContentList({ contents, onDelete, groupId }: Props) {
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

  return (
    <div className="space-y-4">
      {contents.map((content, index) => (
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

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-black">{content.title}</h3>
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
              <Link
                to={`/groups/${groupId}/setlists`}
                className="btn-secondary text-center"
              >
                View Setlists
              </Link>
              <button
                onClick={() => void onDelete(content.id)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
