import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi, joinApi } from '../lib/api';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';
import { clearToken, getToken } from '../lib/tokenStorage';
import '../styles/auth.css';
export default function JoinGroupPage() {
    const navigate = useNavigate();
    const { token } = useParams();
    const [group, setGroup] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        void loadPage();
    }, [token]);
    const loadPage = async () => {
        if (!token) {
            setError('This band link is missing a token.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const previewData = await joinApi.getPreview(token);
            setGroup(previewData.group);
            const storedToken = await getToken();
            if (!storedToken) {
                setCurrentUser(null);
                return;
            }
            try {
                const profileData = await authApi.getProfile({ skipAuthRedirect: true });
                setCurrentUser(profileData.user);
            }
            catch {
                await clearToken();
                setCurrentUser(null);
            }
        }
        catch (err) {
            setGroup(null);
            setCurrentUser(null);
            setError(err?.message || 'This band link is not available.');
        }
        finally {
            setLoading(false);
        }
    };
    const startAuthFlow = (path) => {
        if (!token) {
            return;
        }
        setPostAuthRedirect(`/join/${token}`);
        navigate(path);
    };
    const handleJoinGroup = async () => {
        if (!token || !group) {
            return;
        }
        setJoining(true);
        setStatus(null);
        try {
            const response = await joinApi.joinGroup(token);
            setStatus({
                tone: 'success',
                text: response.alreadyMember
                    ? 'You are already in this band. Opening it now...'
                    : 'You joined the band. Opening it now...',
            });
            setTimeout(() => {
                navigate(`/groups/${response.group.id}`);
            }, 700);
        }
        catch (err) {
            setStatus({
                tone: 'error',
                text: err?.message || 'Failed to join this band.',
            });
        }
        finally {
            setJoining(false);
        }
    };
    const alreadyMember = Boolean(currentUser?.groups.some((currentGroup) => currentGroup.id === group?.id));
    if (loading) {
        return (_jsx("div", { className: "app-shell flex min-h-screen items-center justify-center px-4", children: _jsxs("div", { className: "card max-w-sm text-center", children: [_jsx("p", { className: "section-kicker", children: "Joining" }), _jsx("p", { className: "mt-3 text-xl font-semibold tracking-tight", children: "Checking this band link..." })] }) }));
    }
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/70", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Join this ", _jsx("span", { className: "app-brand text-orange-400", children: "band." })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/[0.74]", children: "Accept the link, sign in or create an account, and step into the shared workspace." })] }), _jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Band Link" }), !group ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Link unavailable" }), _jsx("div", { className: "mt-5 status-banner status-banner-muted status-banner-attention", children: error || 'This band link is invalid, expired, or has already been replaced.' }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx(Link, { to: "/", className: "btn-secondary", children: "Back Home" }), _jsx(Link, { to: "/auth/login", className: "btn-primary", children: "Log In" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: group.name }), group.description && (_jsx("p", { className: "mt-3 text-sm leading-6 text-black/60", children: group.description })), status && (_jsx("div", { className: `mt-5 status-banner ${status.tone === 'success' ? 'status-banner-strong' : 'status-banner-muted status-banner-attention'}`, children: status.text })), !currentUser && (_jsxs(_Fragment, { children: [_jsx("p", { className: "mt-5 text-sm leading-6 text-black/60", children: "You need a MyBand account before you can join. After sign up or login, we will bring you straight back here." }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx("button", { type: "button", onClick: () => startAuthFlow('/auth/register'), className: "btn-primary", children: "Sign Up To Join" }), _jsx("button", { type: "button", onClick: () => startAuthFlow('/auth/login'), className: "btn-secondary", children: "Log In" })] })] })), currentUser && alreadyMember && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "mt-5 text-sm leading-6 text-black/60", children: ["Signed in as ", currentUser.email, ". You are already a member of this band."] }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx("button", { type: "button", onClick: () => navigate(`/groups/${group.id}`), className: "btn-primary", children: "Open Band" }), _jsx(Link, { to: "/dashboard", className: "btn-secondary", children: "Back To Dashboard" })] })] })), currentUser && !alreadyMember && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "mt-5 text-sm leading-6 text-black/60", children: ["Signed in as ", currentUser.email, ". Confirm below to join this band and open the shared workspace."] }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx("button", { type: "button", onClick: () => void handleJoinGroup(), className: "btn-primary", disabled: joining, children: joining ? 'Joining Band...' : 'Join Band' }), _jsx(Link, { to: "/dashboard", className: "btn-secondary", children: "Not Now" })] })] }))] }))] })] }) }));
}
//# sourceMappingURL=JoinGroupPage.js.map