import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">🎸 MyBand</h1>
        <p className="text-xl mb-8">Collaborate with your band, one setlist at a time</p>
        <div className="space-x-4">
          <Link
            to="/auth/login"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            className="inline-block px-8 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
