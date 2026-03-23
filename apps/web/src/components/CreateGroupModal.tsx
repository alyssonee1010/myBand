import { useState } from 'react'

interface Props {
  onClose: () => void
  onCreate: (name: string, description: string) => Promise<void>
}

export default function CreateGroupModal({ onClose, onCreate }: Props) {
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Band name is required')
      return
    }

    setLoading(true)
    try {
      await onCreate(formData.name, formData.description)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="card modal-card max-w-md">
        <p className="section-kicker">Create</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Create New Band</h2>
        <p className="mt-2 text-sm leading-6 text-black/60">
          Start a fresh workspace for members, shared content, and setlists.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black/70">Band Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Midnight Echo"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black/70">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field h-28 resize-none"
              placeholder="What makes this project special?"
            />
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
