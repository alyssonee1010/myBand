import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../lib/api'
import '../styles/auth.css'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorNoticeId, setErrorNoticeId] = useState(0)
  const [success, setSuccess] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  useEffect(() => {
    if (!token) {
      setInvalidToken(true)
    }
  }, [token])

  const showError = (message: string) => {
    setErrorNoticeId((n) => n + 1)
    setError(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err: any) {
      const code = err?.response?.code
      if (code === 'PASSWORD_RESET_INVALID') {
        setInvalidToken(true)
      } else {
        showError(err?.message || 'Something went wrong. Please try again.')
      }
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
            Choose a new{' '}
            <span className="app-brand text-orange-400">password.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/[0.74]">
            Pick something strong and get back to the music.
          </p>
        </section>

        <section className="card">
          <p className="section-kicker">Reset Password</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            {success ? 'All done!' : 'Set a new password'}
          </h2>

          {invalidToken && (
            <div className="mt-6 space-y-4">
              <div className="status-banner status-banner-muted status-banner-attention">
                This reset link is invalid or has expired.
              </div>
              <Link to="/auth/forgot-password" className="btn-primary block w-full text-center">
                Request a new link
              </Link>
            </div>
          )}

          {!invalidToken && success && (
            <div className="mt-6 space-y-4">
              <div className="status-banner status-banner-strong">
                Password reset! Signing you in…
              </div>
            </div>
          )}

          {!invalidToken && !success && (
            <>
              {error && (
                <div
                  key={`rp-error-${errorNoticeId}`}
                  className="mt-5 status-banner status-banner-muted status-banner-attention"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black/70">
                    New password
                  </label>
                  <input
                    id="reset-password-new"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="At least 6 characters"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black/70">
                    Confirm new password
                  </label>
                  <input
                    id="reset-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Repeat your password"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  id="reset-password-submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Saving...' : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {!success && (
            <p className="mt-6 text-sm text-black/60">
              Back to{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-orange-600 underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
