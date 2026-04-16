import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import GroupPage from './pages/GroupPage';
import JoinGroupPage from './pages/JoinGroupPage';
import SetlistsPage from './pages/SetlistsPage';
import SetlistPage from './pages/SetlistPage';
import { InstallPromptProvider } from './lib/installPrompt';
import { isNativePlatform } from './lib/platform';
function App() {
    const Router = isNativePlatform ? HashRouter : BrowserRouter;
    return (_jsx(Router, { children: _jsx(InstallPromptProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/auth/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/auth/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/auth/verify-email", element: _jsx(VerifyEmailPage, {}) }), _jsx(Route, { path: "/auth/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/auth/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/join/:token", element: _jsx(JoinGroupPage, {}) }), _jsx(Route, { path: "/groups/:groupId", element: _jsx(GroupPage, {}) }), _jsx(Route, { path: "/groups/:groupId/setlists", element: _jsx(SetlistsPage, {}) }), _jsx(Route, { path: "/groups/:groupId/setlists/:setlistId", element: _jsx(SetlistPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] }) }) }));
}
export default App;
//# sourceMappingURL=App.js.map