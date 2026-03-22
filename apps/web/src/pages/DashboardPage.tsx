import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, groupApi } from '../lib/api'
import GroupList from '../components/GroupList'
import CreateGroupModal from '../components/CreateGroupModal'
import '../styles/dashboard.css'

interface User {
  id: string
  email: string
  name: string
}

interface Group {
  id: string
  name: string
  description?: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/auth/login')
        return
      }

      const profileRes = await authApi.getProfile()
      setUser(profileRes.user)
      setGroups(profileRes.user.groups || [])
    } catch (err) {
      localStorage.removeItem('token')
      navigate('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      const newGroup = await groupApi.createGroup(name, description)
      setGroups([...groups, newGroup])
      setShowCreateModal(false)
    } catch (err) {
      alert('Failed to create group')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container-app flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎸 MyBand</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name || user?.email}</span>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container-app">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Your Bands</h2>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + New Band
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No bands yet. Create one to get started!</p>
          </div>
        ) : (
          <GroupList groups={groups} />
        )}
      </main>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  )
}
