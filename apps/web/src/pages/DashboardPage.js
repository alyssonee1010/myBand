import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, groupApi } from '../lib/api';
import GroupList from '../components/GroupList';
import CreateGroupModal from '../components/CreateGroupModal';
import { clearToken, getToken } from '../lib/tokenStorage';
import '../styles/dashboard.css';
export default function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [acceptingInvitationId, setAcceptingInvitationId] = useState(null);
    useEffect(() => {
        void loadData();
    }, []);
    const loadData = async () => {
        try {
            const token = await getToken();
            if (!token) {
                navigate('/auth/login');
                return;
            }
            const profileRes = await authApi.getProfile();
            setUser(profileRes.user);
            setGroups(profileRes.user.groups || []);
            setPendingInvitations(profileRes.user.pendingInvitations || []);
        }
        catch (err) {
            await clearToken();
            navigate('/auth/login');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateGroup = async (name, description) => {
        try {
            const newGroup = await groupApi.createGroup(name, description);
            setGroups((currentGroups) => [...currentGroups, newGroup]);
            setShowCreateModal(false);
        }
        catch (err) {
            alert('Failed to create group');
        }
    };
    const handleLogout = async () => {
        await clearToken();
        navigate('/');
    };
    const handleAcceptInvitation = async (invitation) => {
        try {
            setAcceptingInvitationId(invitation.id);
            await groupApi.acceptInvitation(invitation.group.id, invitation.id);
            await loadData();
        }
        catch (error) {
            const apiError = error;
            if (apiError.status === 400 || apiError.status === 404) {
                await loadData();
                alert('This invitation is no longer available.');
            }
            else {
                alert('Failed to accept invitation');
            }
        }
        finally {
            setAcceptingInvitationId(null);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "app-shell flex min-h-screen items-center justify-center px-4", children: _jsxs("div", { className: "card max-w-sm text-center", children: [_jsx("p", { className: "section-kicker", children: "Loading" }), _jsx("p", { className: "mt-3 text-xl font-semibold tracking-tight", children: "Pulling your latest band activity..." })] }) }));
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { className: "app-header", children: _jsxs("div", { className: "container-app flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "max-w-3xl", children: [_jsx("p", { className: "section-kicker", children: "Dashboard" }), _jsxs("h1", { className: "mt-3 text-4xl font-bold tracking-tight text-black md:text-5xl", children: ["Welcome back, ", user?.name || user?.email?.split('@')[0], "."] }), _jsx("p", { className: "mt-4 text-sm leading-6 text-black/60 md:text-base", children: "Keep your bands, invitations, and rehearsal prep in one focused workspace." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("span", { className: "stat-pill", children: [pendingInvitations.length, " pending"] }), _jsx("button", { onClick: handleLogout, className: "btn-secondary", children: "Logout" })] })] }) }), _jsxs("main", { className: "container-app space-y-8", children: [pendingInvitations.length > 0 && (_jsxs("section", { className: "card bg-[linear-gradient(135deg,rgba(17,17,17,0.98),rgba(58,58,58,0.92))] text-white", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { className: "max-w-2xl", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.3em] text-white/60", children: "Pending Invitations" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Requests waiting on you" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-white/70", children: "Accept an invitation to join a band. Revoked requests disappear automatically and can no longer be accepted." })] }), _jsx("span", { className: "inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80", children: pendingInvitations.length })] }), _jsx("div", { className: "mt-6 grid gap-4 md:grid-cols-2", children: pendingInvitations.map((invitation) => (_jsxs("div", { className: "rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm", children: [_jsx("p", { className: "text-2xl font-semibold tracking-tight", children: invitation.group.name }), invitation.group.description && (_jsx("p", { className: "mt-2 text-sm leading-6 text-white/60", children: invitation.group.description })), _jsxs("p", { className: "mt-4 text-sm text-white/60", children: ["Invited by ", invitation.invitedBy.name || invitation.invitedBy.email] }), _jsx("button", { onClick: () => void handleAcceptInvitation(invitation), className: "btn-secondary mt-5 w-full border-white/20 bg-white text-black hover:border-white hover:bg-transparent hover:text-white", disabled: acceptingInvitationId === invitation.id, children: acceptingInvitationId === invitation.id ? 'Accepting...' : 'Accept Invitation' })] }, invitation.id))) })] })), _jsxs("section", { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "Your Bands" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Everything you\u2019re building" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Open a band to manage members, shared files, and setlists." })] }), _jsx("button", { onClick: () => setShowCreateModal(true), className: "btn-primary", children: "Create New Band" })] }), groups.length === 0 ? (_jsxs("div", { className: "card bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(228,228,224,0.72))] py-16 text-center", children: [_jsx("p", { className: "text-2xl font-semibold tracking-tight", children: "No bands yet" }), _jsx("p", { className: "mx-auto mt-3 max-w-lg text-sm leading-6 text-black/60", children: "Create your first band to start inviting members, uploading charts, and building setlists together." })] })) : (_jsx(GroupList, { groups: groups }))] }), showCreateModal && (_jsx(CreateGroupModal, { onClose: () => setShowCreateModal(false), onCreate: handleCreateGroup }))] }));
}
//# sourceMappingURL=DashboardPage.js.map