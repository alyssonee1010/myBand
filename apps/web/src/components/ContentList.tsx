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
  const getIcon = (contentType: string) => {
    switch (contentType) {
      case 'lyrics':
        return '📝'
      case 'chords':
        return '🎵'
      case 'pdf':
        return '📄'
      case 'image':
        return '🖼️'
      default:
        return '📦'
    }
  }

  return (
    <div className="space-y-4">
      {contents.map((content) => (
        <div key={content.id} className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getIcon(content.contentType)}</span>
                <div>
                  <h3 className="font-bold text-lg">{content.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{content.contentType}</p>
                </div>
              </div>
              {content.description && (
                <p className="text-gray-600 mb-2">{content.description}</p>
              )}
              <p className="text-xs text-gray-400">
                by {content.createdBy.name || content.createdBy.email}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/groups/${groupId}/setlists`}
                className="btn-secondary text-sm inline-block"
              >
                View Setlists
              </Link>
              <button
                onClick={() => onDelete(content.id)}
                className="btn-danger text-sm"
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
