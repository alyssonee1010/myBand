import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { groupApi, contentApi } from '../lib/api'
import ContentList from '../components/ContentList'
import UploadContentModal from '../components/UploadContentModal'
import '../styles/group.css'

interface Group {
  id: string
  name: string
  description?: string
}

interface Content {
  id: string
  title: string
  contentType: string
  description?: string
  createdBy: any
}

export default function GroupPage() {
  const navigate = useNavigate()
  const { groupId } = useParams()

  const [group, setGroup] = useState<Group | null>(null)
  const [contents, setContents] = useState<Content[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (groupId) {
      loadGroup()
    }
  }, [groupId])

  const loadGroup = async () => {
    try {
      const groupData = await groupApi.getGroup(groupId!)
      setGroup(groupData)
      const contentsData = await contentApi.getGroupContent(groupId!)
      setContents(contentsData.contents)
    } catch (err) {
      alert('Failed to load group')
      navigate('/dashboard')
    } finally {
      setLoading(false)
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
      setContents(contents.filter((c) => c.id !== contentId))
    } catch (err) {
      alert('Failed to delete content')
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Content Library</h2>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary">
            + Upload Content
          </button>
        </div>

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
