import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, groupApi, contentApi } from '../lib/api';
import ContentList from '../components/ContentList';
import UploadContentModal from '../components/UploadContentModal';
import '../styles/group.css';
export default function GroupPage() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [group, setGroup] = useState(null);
    const [contents, setContents] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteStatus, setInviteStatus] = useState(null);
    useEffect(() => {
        if (groupId) {
            void loadGroup(true);
        }
    }, [groupId]);
    const loadGroup = async (showPageLoader = false) => {
        if (showPageLoader) {
            setLoading(true);
        }
        try {
            const [groupData, contentsData, profileData] = await Promise.all([
                groupApi.getGroup(groupId),
                contentApi.getGroupContent(groupId),
                authApi.getProfile(),
            ]);
            setCurrentUser(profileData.user);
            setGroup(groupData);
            setContents(contentsData.contents);
        }
        catch (err) {
            alert('Failed to load group');
            navigate('/dashboard');
        }
        finally {
            if (showPageLoader) {
                setLoading(false);
            }
        }
    };
    const handleUpload = async (title, description, file) => {
        try {
            await contentApi.uploadContent(groupId, title, description, file);
            await loadGroup();
            setShowUploadModal(false);
        }
        catch (err) {
            alert('Failed to upload content');
        }
    };
    const handleDeleteContent = async (contentId) => {
        if (!confirm('Delete this content?'))
            return;
        try {
            await contentApi.deleteContent(groupId, contentId);
            setContents((currentContents) => currentContents.filter((content) => content.id !== contentId));
        }
        catch (err) {
            alert('Failed to delete content');
        }
    };
    const handleInviteMember = async (event) => {
        event.preventDefault();
        const normalizedEmail = inviteEmail.trim().toLowerCase();
        if (!normalizedEmail) {
            setInviteStatus({
                tone: 'error',
                text: 'Enter an email address to invite someone to this band.',
            });
            return;
        }
        setInviteLoading(true);
        setInviteStatus(null);
        try {
            const invitation = await groupApi.inviteMember(groupId, normalizedEmail);
            setGroup((currentGroup) => {
                if (!currentGroup) {
                    return currentGroup;
                }
                return {
                    ...currentGroup,
                    invitations: [
                        invitation,
                        ...currentGroup.invitations.filter((currentInvitation) => currentInvitation.id !== invitation.id),
                    ],
                };
            });
            setInviteEmail('');
            setInviteStatus({
                tone: 'success',
                text: `Invitation sent to ${invitation.email}. They will join the band once they accept it.`,
            });
        }
        catch (error) {
            const apiError = error;
            let message = apiError.message || 'Failed to send this invitation.';
            if (apiError.status === 403) {
                message = 'Only band admins can invite members.';
            }
            else if (apiError.status === 400 && message === 'User is already a member of this group') {
                message = `${normalizedEmail} is already in this band.`;
            }
            else if (apiError.status === 400 && message === 'Invitation is already pending for this email') {
                message = `There is already a pending invitation for ${normalizedEmail}.`;
            }
            setInviteStatus({
                tone: 'error',
                text: message,
            });
        }
        finally {
            setInviteLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("p", { className: "text-xl", children: "Loading..." }) }));
    }
    const currentMembership = group?.members.find((member) => member.user.id === currentUser?.id);
    const canInviteMembers = currentMembership?.role === 'admin';
    const sortedMembers = [...(group?.members || [])].sort((leftMember, rightMember) => {
        if (leftMember.role !== rightMember.role) {
            return leftMember.role === 'admin' ? -1 : 1;
        }
        const leftLabel = leftMember.user.name || leftMember.user.email;
        const rightLabel = rightMember.user.name || rightMember.user.email;
        return leftLabel.localeCompare(rightLabel);
    });
    const pendingInvitations = group?.invitations || [];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "container-app", children: [_jsx("button", { onClick: () => navigate('/dashboard'), className: "text-blue-600 hover:underline mb-4", children: "\u2190 Back to Bands" }), _jsx("h1", { className: "text-3xl font-bold", children: group?.name }), group?.description && _jsx("p", { className: "text-gray-600", children: group.description })] }) }), _jsx("main", { className: "container-app", children: _jsxs("div", { className: "grid gap-8 xl:grid-cols-[minmax(0,2fr)_360px]", children: [_jsxs("section", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Content Library" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Keep charts, lyrics, recordings, and references in one place for everyone." })] }), _jsx("button", { onClick: () => setShowUploadModal(true), className: "btn-primary", children: "+ Upload Content" })] }), _jsx("div", { className: "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm", children: contents.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500 mb-4", children: "No content yet. Upload something to get started!" }) })) : (_jsx(ContentList, { contents: contents, onDelete: handleDeleteContent, groupId: groupId })) })] }), _jsxs("aside", { className: "space-y-6", children: [_jsxs("section", { className: "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold", children: "Band Members" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Contact everyone in the band and keep roles visible." })] }), _jsx("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700", children: sortedMembers.length })] }), _jsx("div", { className: "mt-5 space-y-3", children: sortedMembers.map((member) => {
                                                const label = member.user.name || member.user.email;
                                                const isCurrentUser = member.user.id === currentUser?.id;
                                                const initials = label.charAt(0).toUpperCase();
                                                return (_jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3", children: [_jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700", children: initials }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("p", { className: "font-semibold text-gray-900", children: label }), isCurrentUser && (_jsx("span", { className: "rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700", children: "You" })), _jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600", children: member.role })] }), _jsx("p", { className: "truncate text-sm text-gray-500", children: member.user.email })] })] }, member.id));
                                            }) })] }), _jsxs("section", { className: "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm", children: [_jsx("h2", { className: "text-xl font-bold", children: "Invite To Band" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-gray-500", children: "Send an invitation by email. They only become a band member after accepting it from their own MyBand account." }), _jsxs("form", { onSubmit: handleInviteMember, className: "mt-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "invite-email", className: "mb-2 block text-sm font-medium text-gray-700", children: "Member email" }), _jsx("input", { id: "invite-email", type: "email", value: inviteEmail, onChange: (event) => setInviteEmail(event.target.value), className: "input-field", placeholder: "bandmate@example.com", disabled: inviteLoading || !canInviteMembers })] }), !canInviteMembers && (_jsx("p", { className: "rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800", children: "Only band admins can invite members." })), inviteStatus && (_jsx("div", { className: `rounded-xl px-3 py-2 text-sm ${inviteStatus.tone === 'success'
                                                        ? 'bg-emerald-50 text-emerald-800'
                                                        : 'bg-red-50 text-red-700'}`, children: inviteStatus.text })), _jsx("button", { type: "submit", className: "btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60", disabled: inviteLoading || !canInviteMembers, children: inviteLoading ? 'Sending invitation...' : 'Send Invitation' })] })] }), _jsxs("section", { className: "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold", children: "Pending Invitations" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "These people will appear as members only after they accept." })] }), _jsx("span", { className: "rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700", children: pendingInvitations.length })] }), pendingInvitations.length === 0 ? (_jsx("p", { className: "mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500", children: "No pending invitations right now." })) : (_jsx("div", { className: "mt-5 space-y-3", children: pendingInvitations.map((invitation) => (_jsxs("div", { className: "rounded-xl border border-gray-200 px-4 py-3", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("p", { className: "font-semibold text-gray-900", children: invitation.email }), _jsx("span", { className: "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-700", children: "Pending" })] }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: invitation.invitee
                                                            ? `Waiting for ${invitation.invitee.name || invitation.invitee.email} to accept in their dashboard.`
                                                            : 'No account found yet. They can sign up with this email and accept the invite afterward.' })] }, invitation.id))) }))] })] })] }) }), showUploadModal && (_jsx(UploadContentModal, { onClose: () => setShowUploadModal(false), onUpload: handleUpload }))] }));
}
//# sourceMappingURL=GroupPage.js.map