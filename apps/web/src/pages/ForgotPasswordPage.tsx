import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../lib/api'
import '../styles/auth.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorNoticeId, setErrorNoticeId] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [nextStep, setNextStep] = useState<'reset-password' | 'verify-email'>('reset-password')

  const showError = (message: string) => {
    setErrorNoticeId((n) => n + 1)
    setError(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      showError('Please enter your email address')
      return
    }
    setLoading(true)
    try {
      const result = await authApi.forgotPassword(trimmed)
      setPreviewUrl(result.emailPreviewUrl || result.resetPreviewUrl || result.verificationPreviewUrl || '')
      setNextStep(result.nextStep === 'verify-email' ? 'verify-email' : 'reset-password')
      setSubmitted(true)
    } catch (err: any) {
      showError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center">
      <main className="container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="glass-card">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/70">MyBand</p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Locked out of the{' '}
            <span className="app-brand text-orange-400">session?</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/[0.74]">
            No worries. Enter your email and we'll send you a link to get back in.
          </p>
        </section>

        <section className="card">
          <p className="section-kicker">Forgot Password</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Reset your password</h2>

          {!submitted ? (
            <>
              {error && (
                <div
                  key={`fp-error-${errorNoticeId}`}
                  className="mt-5 status-banner status-banner-muted status-banner-attention"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black/70">
                    Email address
                  </label>
                  <input
                    id="forgot-password-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  id="forgot-password-submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="status-banner status-banner-strong">
                {nextStep === 'verify-email'
                  ? 'That account still needs verification, so we sent a verification link instead.'
                  : 'Check your inbox — if an account with that email exists, a reset link is on its way.'}
              </div>
              {previewUrl && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
                  <p className="font-medium text-orange-800">Development preview</p>
                  <a
                    href={previewUrl}
                    className="mt-1 block break-all text-orange-600 underline-offset-4 hover:underline"
                  >
                    {previewUrl}
                  </a>
                </div>
              )}
              {nextStep === 'verify-email' && (
                <Link
                  to={`/auth/verify-email?email=${encodeURIComponent(email.trim())}`}
                  className="btn-secondary block w-full text-center"
                >
                  Open verification page
                </Link>
              )}
              <button
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                  setPreviewUrl('')
                  setNextStep('reset-password')
                }}
                className="btn-secondary w-full"
              >
                Send to a different email
              </button>
            </div>
          )}

          <p className="mt-6 text-sm text-black/60">
            Remember your password?{' '}
            <Link
              to="/auth/login"
              className="font-semibold text-orange-600 underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
