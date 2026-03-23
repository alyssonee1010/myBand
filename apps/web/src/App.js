import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupPage from './pages/GroupPage';
import SetlistsPage from './pages/SetlistsPage';
import SetlistPage from './pages/SetlistPage';
import { isNativePlatform } from './lib/platform';
function App() {
    const Router = isNativePlatform ? HashRouter : BrowserRouter;
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/auth/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/auth/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/groups/:groupId", element: _jsx(GroupPage, {}) }), _jsx(Route, { path: "/groups/:groupId/setlists", element: _jsx(SetlistsPage, {}) }), _jsx(Route, { path: "/groups/:groupId/setlists/:setlistId", element: _jsx(SetlistPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/" }) })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map