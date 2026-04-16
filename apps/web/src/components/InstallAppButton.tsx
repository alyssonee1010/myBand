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
  const { canInstall, promptInstall } = useInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)

  if (!canInstall) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)

    try {
      await promptInstall()
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      className={className}
      disabled={isInstalling}
    >
      {isInstalling ? busyLabel : label}
    </button>
  )
}
