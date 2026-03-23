import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import '../styles/auth.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

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
    setLoading(true)

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await authApi.register(formData.email, formData.password, formData.name)

      if (!response.token) {
        throw new Error('No token received from server')
      }

      setSuccess('Account created. Redirecting to your dashboard...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Registration failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center">
      <main className="container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
        <section className="glass-card bg-[linear-gradient(145deg,rgba(10,10,10,0.96),rgba(52,52,52,0.88))]">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/60">MyBand</p>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl">
            Build a tighter <span className="app-brand">band workflow.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            Create your account, accept invitations, and start organizing rehearsals with a calmer
            interface.
          </p>
        </section>

        <section className="card bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(238,238,234,0.76))]">
          <p className="section-kicker">Sign Up</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Create your account</h2>

          {error && (
            <div className="mt-5 status-banner status-banner-muted">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 status-banner status-banner-strong">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-black/70">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
                placeholder="Your name"
              />
            </div>

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
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/40">
                At least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-sm text-black/60">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-semibold text-black underline-offset-4 hover:underline">
              Login
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
