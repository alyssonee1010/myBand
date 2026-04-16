import LinkifiedText from './LinkifiedText'

interface PreviewContent {
  id: string
  title: string
  description?: string
  contentType: string
}

interface Props {
  content: PreviewContent
  fileUrl: string | null
  loading: boolean
  error: string
  onClose: () => void
}

export default function ContentPreviewModal({ content, fileUrl, loading, error, onClose }: Props) {
  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex min-h-[20rem] items-center justify-center rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-6 py-10 text-center text-black/60">
          Loading preview...
        </div>
      )
    }

    if (error) {
      return (
        <div className="status-banner status-banner-muted status-banner-attention">
          {error}
        </div>
      )
    }

    if (!fileUrl) {
      return (
        <div className="status-banner status-banner-muted">
          Preview unavailable for this file.
        </div>
      )
    }

    if (content.contentType === 'image') {
      return (
        <div className="flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[24px] border border-black/10 bg-black/5 p-3">
          <img
            src={fileUrl}
            alt={content.title}
            className="max-h-[70vh] w-auto max-w-full rounded-[18px] object-contain"
          />
        </div>
      )
    }

    return (
      <div className="overflow-hidden rounded-[24px] border border-black/10 bg-black/5">
        <object data={fileUrl} type="application/pdf" className="h-[70vh] w-full">
          <iframe
            key={fileUrl}
            src={fileUrl}
            title={content.title}
            className="h-[70vh] w-full"
          />
        </object>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="card modal-card max-h-[90vh] max-w-5xl overflow-y-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="section-kicker">Preview</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{content.title}</h2>
            {content.description && (
              <LinkifiedText
                text={content.description}
                className="mt-3 max-w-3xl text-sm leading-6 text-black/60"
              />
            )}
          </div>

          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>

        <div className="mt-6">
          {renderPreview()}
        </div>
      </div>
    </div>
  )
}
