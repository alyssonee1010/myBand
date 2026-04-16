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
  manualInstallHint: {
    title: string
    steps: string[]
  } | null
  promptInstall: () => Promise<InstallOutcome>
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null)

function isIosBrowser() {
  if (typeof window === 'undefined') {
    return false
  }

  const platform = window.navigator.platform
  const userAgent = window.navigator.userAgent

  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

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

function subscribeToMediaQuery(mediaQueryList: MediaQueryList, onChange: () => void) {
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', onChange)

    return () => {
      mediaQueryList.removeEventListener('change', onChange)
    }
  }

  mediaQueryList.addListener(onChange)

  return () => {
    mediaQueryList.removeListener(onChange)
  }
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
    const cleanupStandaloneListener = subscribeToMediaQuery(standaloneMediaQuery, syncInstalledState)
    const cleanupFullscreenListener = subscribeToMediaQuery(fullscreenMediaQuery, syncInstalledState)

    syncInstalledState()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('focus', syncInstalledState)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('focus', syncInstalledState)
      cleanupStandaloneListener()
      cleanupFullscreenListener()
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
        manualInstallHint:
          !isNativePlatform && !isInstalled && deferredPrompt === null && isIosBrowser()
            ? {
                title: 'Install MyBand',
                steps: [
                  'Open the browser share menu on this page.',
                  'Choose Add to Home Screen.',
                  'Open MyBand from your home screen to use it without the browser address bar.',
                ],
              }
            : null,
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
