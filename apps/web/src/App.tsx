import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import GroupPage from './pages/GroupPage'
import JoinGroupPage from './pages/JoinGroupPage'
import SetlistsPage from './pages/SetlistsPage'
import SetlistPage from './pages/SetlistPage'
import { InstallPromptProvider } from './lib/installPrompt'
import { isNativePlatform } from './lib/platform'

function App() {
  const Router = isNativePlatform ? HashRouter : BrowserRouter

  return (
    <Router>
      <InstallPromptProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/join/:token" element={<JoinGroupPage />} />
          <Route path="/groups/:groupId" element={<GroupPage />} />
          <Route path="/groups/:groupId/setlists" element={<SetlistsPage />} />
          <Route path="/groups/:groupId/setlists/:setlistId" element={<SetlistPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </InstallPromptProvider>
    </Router>
  )
}

export default App
