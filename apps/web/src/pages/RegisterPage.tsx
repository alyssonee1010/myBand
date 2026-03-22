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

    // Client-side validation
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
      console.log('📡 Attempting registration with:', { email: formData.email, name: formData.name })
      const response = await authApi.register(formData.email, formData.password, formData.name)
      
      if (!response.token) {
        throw new Error('No token received from server')
      }
      
      console.log('✅ Registration successful, token stored')
      setSuccess('Account created! Redirecting to dashboard...')
      
      // Wait a moment to show success message, then navigate
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err: any) {
      console.error('❌ Registration error:', err)
      // Handle both Error objects and plain error objects
      const errorMsg = err?.message || err?.toString() || 'Registration failed'
      setError(errorMsg)
      console.log('Error message displayed:', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Join MyBand</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">Registration Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-600 text-green-800 rounded">
            <p className="font-semibold">Success!</p>
            <p className="text-sm mt-1">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name (optional)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
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
            <label className="block text-sm font-medium mb-2">Password</label>
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
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-center mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-blue-600 font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
