import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api'
import '../styles/auth.css'

type VerificationState = {
  verificationPreviewUrl?: string
} | null

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(
    token ? 'Verifying your email...' : 'Check your inbox for a verification link.'
  )
  const [previewUrl, setPreviewUrl] = useState(navigationState?.verificationPreviewUrl || '')

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

        setSuccess(response.message || 'Email verified. Redirecting to your dashboard...')
        setTimeout(() => {
          navigate('/dashboard')
        }, 800)
      } catch (err: any) {
        if (cancelled) {
          return
        }

        setError(err?.message || 'Verification failed')
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
      setError('Enter your email address to resend the verification link.')
      return
    }

    setResending(true)

    try {
      const response = await authApi.resendVerificationEmail(email.trim())
      setSuccess(response.message || 'Verification email sent.')
      setPreviewUrl(response.verificationPreviewUrl || '')
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification email')
      setSuccess('')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center">
      <main className="container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="glass-card bg-[linear-gradient(145deg,rgba(10,10,10,0.96),rgba(52,52,52,0.88))]">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/60">MyBand</p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Verify your <span className="app-brand">email.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            We only let verified accounts sign in. Open the link from your inbox, or request a new
            verification email below.
          </p>
        </section>

        <section className="card bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(238,238,234,0.76))]">
          <p className="section-kicker">Verify Email</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Confirm your address</h2>

          {error && <div className="mt-5 status-banner status-banner-muted">{error}</div>}

          {success && <div className="mt-5 status-banner status-banner-strong">{success}</div>}

          {previewUrl && (
            <div className="mt-4 text-sm leading-6 text-black/60">
              Development preview link:{' '}
              <a href={previewUrl} className="font-semibold text-black underline-offset-4 hover:underline">
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

              <button type="submit" disabled={resending} className="btn-primary w-full">
                {resending ? 'Sending verification email...' : 'Resend Verification Email'}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-black/60">
            Already verified?{' '}
            <Link to="/auth/login" className="font-semibold text-black underline-offset-4 hover:underline">
              Back to login
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
