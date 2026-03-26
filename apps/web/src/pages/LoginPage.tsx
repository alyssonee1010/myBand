import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import '../styles/auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [errorNoticeId, setErrorNoticeId] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [unverifiedEmail, setUnverifiedEmail] = useState('')

  const showError = (message: string) => {
    setErrorNoticeId((current) => current + 1)
    setError(message)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setUnverifiedEmail('')
    setLoading(true)

    if (!formData.email.trim() || !formData.password.trim()) {
      showError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      const response = await authApi.login(formData.email, formData.password)

      if (!response.token) {
        throw new Error('No token received from server')
      }

      setSuccess('Login successful. Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Login failed'
      if (err?.status === 403 && err?.response?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(formData.email.trim())
      }
      showError(errorMsg)
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
            Step back into the <span className="app-brand text-orange-400">session.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/[0.74]">
            Open your bands, accept invites, and pick up where the last rehearsal left off.
          </p>
        </section>

        <section className="card">
          <p className="section-kicker">Log In</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Welcome back</h2>

          {error && (
            <div key={`login-error-${errorNoticeId}`} className="mt-5 status-banner status-banner-muted status-banner-attention">
              {error}
            </div>
          )}

          {unverifiedEmail && (
            <div className="mt-4 text-sm text-black/60">
              Need a new verification link?{' '}
              <Link
                to={`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="font-semibold text-orange-600 underline-offset-4 hover:underline"
              >
                Verify your email
              </Link>
            </div>
          )}

          {success && (
            <div className="mt-5 status-banner status-banner-strong">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-sm text-black/60">
            Don&apos;t have an account?{' '}
            <Link to="/auth/register" className="font-semibold text-orange-600 underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
