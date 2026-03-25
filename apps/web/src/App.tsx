import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import GroupPage from './pages/GroupPage'
import SetlistsPage from './pages/SetlistsPage'
import SetlistPage from './pages/SetlistPage'
import { isNativePlatform } from './lib/platform'

function App() {
  const Router = isNativePlatform ? HashRouter : BrowserRouter

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/groups/:groupId" element={<GroupPage />} />
        <Route path="/groups/:groupId/setlists" element={<SetlistsPage />} />
        <Route path="/groups/:groupId/setlists/:setlistId" element={<SetlistPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
