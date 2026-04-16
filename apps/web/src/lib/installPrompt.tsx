import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isNativePlatform } from './platform'

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

interface InstallPromptContextValue {
  canInstall: boolean
  isInstalled: boolean
  promptInstall: () => Promise<InstallOutcome>
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null)

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean(navigatorWithStandalone.standalone)
  )
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isNativePlatform || isStandaloneMode())

  useEffect(() => {
    if (isNativePlatform) {
      setIsInstalled(true)
      return
    }

    const syncInstalledState = () => {
      setIsInstalled(isStandaloneMode())
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      syncInstalledState()
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)')
    const fullscreenMediaQuery = window.matchMedia('(display-mode: fullscreen)')

    syncInstalledState()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('focus', syncInstalledState)
    standaloneMediaQuery.addEventListener('change', syncInstalledState)
    fullscreenMediaQuery.addEventListener('change', syncInstalledState)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('focus', syncInstalledState)
      standaloneMediaQuery.removeEventListener('change', syncInstalledState)
      fullscreenMediaQuery.removeEventListener('change', syncInstalledState)
    }
  }, [])

  const promptInstall = async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) {
      return 'unavailable'
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      return outcome
    } finally {
      setDeferredPrompt(null)
    }
  }

  return (
    <InstallPromptContext.Provider
      value={{
        canInstall: !isNativePlatform && !isInstalled && deferredPrompt !== null,
        isInstalled,
        promptInstall,
      }}
    >
      {children}
    </InstallPromptContext.Provider>
  )
}

export function useInstallPrompt() {
  const context = useContext(InstallPromptContext)

  if (!context) {
    throw new Error('useInstallPrompt must be used within an InstallPromptProvider')
  }

  return context
}
