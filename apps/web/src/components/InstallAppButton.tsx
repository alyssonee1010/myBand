import { useState } from 'react'
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
      {showManualInstallHint && manualInstallHint && (
        <div className="modal-overlay">
          <div className="card modal-card max-w-md">
            <p className="section-kicker">Install</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{manualInstallHint.title}</h2>
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
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualInstallHint(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
