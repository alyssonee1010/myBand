import { useState } from 'react'

interface Props {
  onClose: () => void
  onUpload: (title: string, description: string, file: File) => Promise<void>
}

export default function UploadContentModal({ onClose, onUpload }: Props) {
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    try {
      await onUpload(formData.title, formData.description, file)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="card modal-card max-w-md">
        <p className="section-kicker">Upload</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Add Shared Content</h2>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Upload a PDF or image so the whole band can access it in one place.
        </p>

        {error && (
          <div className="mt-5 status-banner status-banner-muted">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black/70">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Intro arrangement"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black/70">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field h-24 resize-none"
              placeholder="A short note for the band..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black/70">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
              accept=".pdf,image/*"
              required
            />
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/40">
              Max 10MB for PDFs, 5MB for images
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
