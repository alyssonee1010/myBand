import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, groupApi } from '../lib/api';
import GroupList from '../components/GroupList';
import CreateGroupModal from '../components/CreateGroupModal';
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
        loadData();
    }, []);
    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
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
            localStorage.removeItem('token');
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
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };
    const handleAcceptInvitation = async (invitation) => {
        try {
            setAcceptingInvitationId(invitation.id);
            await groupApi.acceptInvitation(invitation.group.id, invitation.id);
            await loadData();
        }
        catch (err) {
            alert('Failed to accept invitation');
        }
        finally {
            setAcceptingInvitationId(null);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("p", { className: "text-xl", children: "Loading..." }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "container-app flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\uD83C\uDFB8 MyBand" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-gray-600", children: user?.name || user?.email }), _jsx("button", { onClick: handleLogout, className: "btn-secondary", children: "Logout" })] })] }) }), _jsxs("main", { className: "container-app", children: [pendingInvitations.length > 0 && (_jsxs("section", { className: "mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm", children: [_jsxs("div", { className: "flex flex-col gap-2 md:flex-row md:items-end md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-emerald-950", children: "Pending Invitations" }), _jsx("p", { className: "text-sm text-emerald-800", children: "Accept an invitation to join a band. You will only be added after you confirm here." })] }), _jsx("span", { className: "rounded-full bg-white px-3 py-1 text-sm font-medium text-emerald-800", children: pendingInvitations.length })] }), _jsx("div", { className: "mt-5 grid gap-4 md:grid-cols-2", children: pendingInvitations.map((invitation) => (_jsxs("div", { className: "rounded-xl border border-emerald-200 bg-white p-4", children: [_jsx("p", { className: "text-lg font-semibold text-gray-900", children: invitation.group.name }), invitation.group.description && (_jsx("p", { className: "mt-1 text-sm text-gray-500", children: invitation.group.description })), _jsxs("p", { className: "mt-3 text-sm text-gray-600", children: ["Invited by ", invitation.invitedBy.name || invitation.invitedBy.email] }), _jsx("button", { onClick: () => handleAcceptInvitation(invitation), className: "btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60", disabled: acceptingInvitationId === invitation.id, children: acceptingInvitationId === invitation.id ? 'Accepting...' : 'Accept Invitation' })] }, invitation.id))) })] })), _jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsx("h2", { className: "text-3xl font-bold", children: "Your Bands" }), _jsx("button", { onClick: () => setShowCreateModal(true), className: "btn-primary", children: "+ New Band" })] }), groups.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500 mb-4", children: "No bands yet. Create one to get started!" }) })) : (_jsx(GroupList, { groups: groups }))] }), showCreateModal && (_jsx(CreateGroupModal, { onClose: () => setShowCreateModal(false), onCreate: handleCreateGroup }))] }));
}
//# sourceMappingURL=DashboardPage.js.map