import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api'
import { consumePostAuthRedirect } from '../lib/postAuthRedirect'
import '../styles/auth.css'

const EMAIL_VERIFICATION_RATE_LIMIT_CODE = 'EMAIL_VERIFICATION_RATE_LIMIT'
const EMAIL_VERIFICATION_COOLDOWN_STORAGE_PREFIX = 'myband-email-verification-cooldown'

type VerificationState = {
  verificationPreviewUrl?: string
  initialCooldownSeconds?: number
  initialMessage?: string
  initialTone?: 'success' | 'error'
} | null

function normalizeEmailKey(email: string) {
  return email.trim().toLowerCase()
}

function getCooldownStorageKey(email: string) {
  return `${EMAIL_VERIFICATION_COOLDOWN_STORAGE_PREFIX}:${normalizeEmailKey(email)}`
}

function readStoredCooldown(email: string) {
  if (!email.trim()) {
    return 0
  }

  try {
    const rawValue = window.localStorage.getItem(getCooldownStorageKey(email))

    if (!rawValue) {
      return 0
    }

    const expiresAt = Number.parseInt(rawValue, 10)

    if (!Number.isFinite(expiresAt)) {
      window.localStorage.removeItem(getCooldownStorageKey(email))
      return 0
    }

    const remainingMs = expiresAt - Date.now()

    if (remainingMs <= 0) {
      window.localStorage.removeItem(getCooldownStorageKey(email))
      return 0
    }

    return Math.ceil(remainingMs / 1000)
  } catch {
    return 0
  }
}

function persistCooldown(email: string, retryAfterSeconds: number) {
  if (!email.trim() || retryAfterSeconds <= 0) {
    return
  }

  try {
    window.localStorage.setItem(
      getCooldownStorageKey(email),
      String(Date.now() + retryAfterSeconds * 1000)
    )
  } catch {
    // Ignore storage failures and keep the in-memory countdown.
  }
}

function clearStoredCooldown(email: string) {
  if (!email.trim()) {
    return
  }

  try {
    window.localStorage.removeItem(getCooldownStorageKey(email))
  } catch {
    // Ignore storage failures when cleaning up expired cooldowns.
  }
}

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const initialEmail = searchParams.get('email')?.trim() || ''
  const navigationState = location.state as VerificationState

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(Boolean(token))
  const [resending, setResending] = useState(false)
  const [errorNoticeId, setErrorNoticeId] = useState(0)
  const [error, setError] = useState(
    navigationState?.initialTone === 'error' ? navigationState.initialMessage || '' : ''
  )
  const [success, setSuccess] = useState(() => {
    if (token) {
      return 'Verifying your email...'
    }

    if (navigationState?.initialTone === 'success') {
      return navigationState.initialMessage || 'Check your inbox for a verification link.'
    }

    return 'Check your inbox for a verification link.'
  })
  const [previewUrl, setPreviewUrl] = useState(navigationState?.verificationPreviewUrl || '')
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const showError = (message: string) => {
    setErrorNoticeId((current) => current + 1)
    setError(message)
  }

  useEffect(() => {
    const initialCooldownSeconds = navigationState?.initialCooldownSeconds || 0
    const storedCooldown = readStoredCooldown(email)
    const nextCooldown = Math.max(initialCooldownSeconds, storedCooldown)

    if (initialCooldownSeconds > 0) {
      persistCooldown(email, initialCooldownSeconds)
    }

    if (nextCooldown > 0) {
      setCooldownRemaining((current) => Math.max(current, nextCooldown))
    }
  }, [email, navigationState?.initialCooldownSeconds])

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      clearStoredCooldown(email)
      return
    }

    const interval = window.setInterval(() => {
      setCooldownRemaining((current) => {
        if (current <= 1) {
          clearStoredCooldown(email)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [cooldownRemaining, email])

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const response = await authApi.verifyEmail(token)
        if (cancelled) {
          return
        }

        setSuccess(response.message || 'Email verified. Redirecting...')
        const nextPath = consumePostAuthRedirect() || '/dashboard'
        setTimeout(() => {
          navigate(nextPath)
        }, 800)
      } catch (err: any) {
        if (cancelled) {
          return
        }

        showError(err?.message || 'Verification failed')
        setSuccess('')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [navigate, token])

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setPreviewUrl('')

    if (!email.trim()) {
      showError('Enter your email address to resend the verification link.')
      return
    }

    setResending(true)

    try {
      const response = await authApi.resendVerificationEmail(email.trim())

      if (response.alreadyVerified) {
        setSuccess(response.message || 'This email is already activated. You can log in now.')
        setPreviewUrl('')
        setCooldownRemaining(0)
        clearStoredCooldown(email.trim())
        return
      }

      setSuccess(response.message || 'Verification email sent.')
      setPreviewUrl(response.verificationPreviewUrl || '')
      const nextCooldown = response.retryAfterSeconds || 30
      setCooldownRemaining(nextCooldown)
      persistCooldown(email.trim(), nextCooldown)
    } catch (err: any) {
      if (err?.status === 429 && err?.response?.code === EMAIL_VERIFICATION_RATE_LIMIT_CODE) {
        const nextCooldown = err?.response?.retryAfterSeconds || 30
        setCooldownRemaining(nextCooldown)
        persistCooldown(email.trim(), nextCooldown)
      }

      showError(err?.message || 'Failed to resend verification email')
      setSuccess('')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center">
      <main className="container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="glass-card">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/70">MyBand</p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Verify your <span className="app-brand text-orange-400">email.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/[0.74]">
            We only let verified accounts sign in. Open the link from your inbox, or request a new
            verification email below.
          </p>
        </section>

        <section className="card">
          <p className="section-kicker">Verify Email</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Confirm your address</h2>

          {error && <div key={`verify-error-${errorNoticeId}`} className="mt-5 status-banner status-banner-muted status-banner-attention">{error}</div>}

          {success && <div className="mt-5 status-banner status-banner-strong">{success}</div>}

          {previewUrl && (
            <div className="mt-4 text-sm leading-6 text-black/60">
              Development preview link:{' '}
              <a href={previewUrl} className="font-semibold text-orange-600 underline-offset-4 hover:underline">
                Open verification link
              </a>
            </div>
          )}

          {!loading && (
            <form onSubmit={handleResend} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-black/70">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input-field"
                  disabled={resending}
                  placeholder="you@example.com"
                />
              </div>

              {cooldownRemaining > 0 && (
                <p className="text-sm font-medium text-orange-700">
                  You can request another verification email in {cooldownRemaining}s.
                </p>
              )}

              <button
                type="submit"
                disabled={resending || cooldownRemaining > 0}
                className="btn-primary w-full"
              >
                {resending
                  ? 'Sending verification email...'
                  : cooldownRemaining > 0
                    ? `Resend in ${cooldownRemaining}s`
                    : 'Resend Verification Email'}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-black/60">
            Already verified?{' '}
            <Link to="/auth/login" className="font-semibold text-orange-600 underline-offset-4 hover:underline">
              Back to login
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
