import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useInstallPrompt } from '../lib/installPrompt'

interface Props {
  className?: string
  label?: string
  busyLabel?: string
}

export default function InstallAppButton({
  className = 'btn-secondary',
  label = 'Install App',
  busyLabel = 'Opening...',
}: Props) {
  const { canInstall, manualInstallHint, promptInstall } = useInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)
  const [showManualInstallHint, setShowManualInstallHint] = useState(false)

  useEffect(() => {
    if (!showManualInstallHint || typeof document === 'undefined') {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [showManualInstallHint])

  if (!canInstall && !manualInstallHint) {
    return null
  }

  const handleInstall = async () => {
    if (!canInstall) {
      setShowManualInstallHint(true)
      return
    }

    setIsInstalling(true)

    try {
      await promptInstall()
    } finally {
      setIsInstalling(false)
    }
  }

  const manualInstallModal =
    showManualInstallHint &&
    manualInstallHint &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="modal-overlay install-hint-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-hint-title"
      >
        <div className="card modal-card install-hint-card max-w-md">
          <p className="section-kicker">Install</p>
          <h2 id="install-hint-title" className="mt-3 text-3xl font-bold tracking-tight">
            {manualInstallHint.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Add MyBand to your home screen to open it like an app and keep the browser chrome out
            of the way.
          </p>
          <div className="mt-6 space-y-3 rounded-[24px] border border-black/10 bg-white/70 px-5 py-5">
            {manualInstallHint.steps.map((step, index) => (
              <p key={step} className="text-sm leading-6 text-black/70">
                <span className="mr-2 font-semibold text-black">{index + 1}.</span>
                {step}
              </p>
            ))}
          </div>
          <div className="mt-6 flex justify-end max-sm:justify-stretch">
            <button
              type="button"
              onClick={() => setShowManualInstallHint(false)}
              className="btn-secondary max-sm:w-full"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstall()}
        className={className}
        disabled={isInstalling}
      >
        {isInstalling ? busyLabel : label}
      </button>
      {manualInstallModal}
    </>
  )
}
