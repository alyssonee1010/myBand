import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authApi, contentApi, groupApi } from '../lib/api';
import ContentList from '../components/ContentList';
import UploadContentModal from '../components/UploadContentModal';
import '../styles/group.css';
function buildJoinLinkUrl(token) {
    const joinPath = window.location.hash.startsWith('#/') ? `/#/join/${token}` : `/join/${token}`;
    return new URL(joinPath, window.location.origin).toString();
}
export default function GroupPage() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [group, setGroup] = useState(null);
    const [contents, setContents] = useState([]);
    const [joinLink, setJoinLink] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [joinLinkLoading, setJoinLinkLoading] = useState(false);
    const [joinLinkAction, setJoinLinkAction] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteStatus, setInviteStatus] = useState(null);
    const [joinLinkStatus, setJoinLinkStatus] = useState(null);
    const [pendingInvitationStatus, setPendingInvitationStatus] = useState(null);
    const [removingInvitationId, setRemovingInvitationId] = useState(null);
    useEffect(() => {
        if (groupId) {
            void loadGroup(true);
        }
    }, [groupId]);
    const loadGroup = async (showPageLoader = false) => {
        if (!groupId) {
            return;
        }
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
            const currentMembership = groupData.members.find((member) => member.user.id === profileData.user.id);
            if (currentMembership?.role === 'admin') {
                setJoinLinkLoading(true);
                try {
                    const activeJoinLink = await groupApi.getJoinLink(groupId);
                    setJoinLink(activeJoinLink);
                    setJoinLinkStatus(null);
                }
                catch {
                    setJoinLink(null);
                    setJoinLinkStatus({
                        tone: 'error',
                        text: 'Failed to load the band link controls.',
                    });
                }
                finally {
                    setJoinLinkLoading(false);
                }
            }
            else {
                setJoinLink(null);
                setJoinLinkLoading(false);
                setJoinLinkStatus(null);
            }
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
    const handleRenameContent = async (contentId, title) => {
        const updatedContent = await contentApi.updateContentTitle(groupId, contentId, title);
        setContents((currentContents) => currentContents.map((content) => content.id === contentId
            ? {
                ...content,
                ...updatedContent,
                createdBy: updatedContent.createdBy || content.createdBy,
            }
            : content));
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
        setPendingInvitationStatus(null);
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
    const handleCreateOrRegenerateJoinLink = async () => {
        if (!groupId) {
            return;
        }
        if (joinLink &&
            !confirm('Regenerate the current band link? Anyone with the old link will lose access.')) {
            return;
        }
        setJoinLinkAction('create');
        setJoinLinkStatus(null);
        try {
            const nextJoinLink = await groupApi.createJoinLink(groupId);
            setJoinLink(nextJoinLink);
            setJoinLinkStatus({
                tone: 'success',
                text: joinLink
                    ? 'Band link refreshed. Older links no longer work.'
                    : 'Band link created. You can share it now.',
            });
        }
        catch (error) {
            const apiError = error;
            setJoinLinkStatus({
                tone: 'error',
                text: apiError.status === 403
                    ? 'Only band admins can manage the band link.'
                    : apiError.message || 'Failed to create the band link.',
            });
        }
        finally {
            setJoinLinkAction(null);
        }
    };
    const handleCopyJoinLink = async () => {
        if (!joinLink) {
            return;
        }
        setJoinLinkAction('copy');
        setJoinLinkStatus(null);
        try {
            await navigator.clipboard.writeText(buildJoinLinkUrl(joinLink.token));
            setJoinLinkStatus({
                tone: 'success',
                text: 'Band link copied to your clipboard.',
            });
        }
        catch {
            setJoinLinkStatus({
                tone: 'error',
                text: 'Copy failed on this device. You can still copy the link manually from the field below.',
            });
        }
        finally {
            setJoinLinkAction(null);
        }
    };
    const handleDisableJoinLink = async () => {
        if (!groupId) {
            return;
        }
        if (!confirm('Disable the current band link? Anyone using it will stop being able to join.')) {
            return;
        }
        setJoinLinkAction('disable');
        setJoinLinkStatus(null);
        try {
            await groupApi.disableJoinLink(groupId);
            setJoinLink(null);
            setJoinLinkStatus({
                tone: 'success',
                text: 'Band link disabled.',
            });
        }
        catch (error) {
            const apiError = error;
            setJoinLinkStatus({
                tone: 'error',
                text: apiError.status === 403
                    ? 'Only band admins can manage the band link.'
                    : apiError.message || 'Failed to disable the band link.',
            });
        }
        finally {
            setJoinLinkAction(null);
        }
    };
    const handleRemoveInvitation = async (invitation) => {
        if (!groupId) {
            return;
        }
        const shouldRemove = confirm(`Remove the pending request for ${invitation.email}?`);
        if (!shouldRemove) {
            return;
        }
        setRemovingInvitationId(invitation.id);
        setPendingInvitationStatus(null);
        try {
            await groupApi.removeInvitation(groupId, invitation.id);
            setGroup((currentGroup) => {
                if (!currentGroup) {
                    return currentGroup;
                }
                return {
                    ...currentGroup,
                    invitations: currentGroup.invitations.filter((currentInvitation) => currentInvitation.id !== invitation.id),
                };
            });
            setPendingInvitationStatus({
                tone: 'success',
                text: `${invitation.email} has been removed from pending requests.`,
            });
        }
        catch (error) {
            const apiError = error;
            let message = apiError.message || 'Failed to remove this pending request.';
            if (apiError.status === 403) {
                message = 'Only band admins can remove pending requests.';
            }
            else if (apiError.status === 400) {
                message = 'This request is no longer pending.';
            }
            setPendingInvitationStatus({
                tone: 'error',
                text: message,
            });
        }
        finally {
            setRemovingInvitationId(null);
        }
    };
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
    const shareableJoinLink = joinLink ? buildJoinLinkUrl(joinLink.token) : '';
    if (loading) {
        return (_jsx("div", { className: "app-shell flex min-h-screen items-center justify-center px-4", children: _jsxs("div", { className: "card max-w-sm text-center", children: [_jsx("p", { className: "section-kicker", children: "Loading" }), _jsx("p", { className: "mt-3 text-xl font-semibold tracking-tight", children: "Setting up your band workspace..." })] }) }));
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { className: "app-header", children: _jsxs("div", { className: "container-app", children: [_jsxs("button", { onClick: () => navigate('/dashboard'), className: "app-link mb-5 inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", children: "\u2190" }), _jsx("span", { children: "Back to Bands" })] }), _jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "max-w-3xl", children: [_jsx("p", { className: "section-kicker", children: "Band Workspace" }), _jsx("h1", { className: "mt-3 text-4xl font-bold tracking-tight text-black md:text-5xl", children: group?.name }), group?.description && (_jsx("p", { className: "mt-4 text-sm leading-6 text-black/60 md:text-base", children: group.description }))] }), _jsxs("div", { className: "card max-w-sm", children: [_jsx("p", { className: "section-kicker", children: "Overview" }), _jsxs("div", { className: "mt-4 grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-3xl font-bold tracking-tight", children: sortedMembers.length }), _jsx("p", { className: "soft-label mt-1", children: "members" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-3xl font-bold tracking-tight", children: pendingInvitations.length }), _jsx("p", { className: "soft-label mt-1", children: "pending" })] })] })] })] })] }) }), _jsx("main", { className: "container-app", children: _jsxs("div", { className: "grid gap-8 xl:grid-cols-[minmax(0,2fr)_360px]", children: [_jsxs("section", { className: "space-y-6", children: [_jsxs("div", { className: "card flex flex-col gap-4 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "Library" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Content Library" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Keep charts, lyrics, recordings, and references in one place for everyone." })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("button", { type: "button", onClick: () => navigate(`/groups/${groupId}/setlists`), className: "btn-secondary", children: "View Setlists" }), _jsx("button", { onClick: () => setShowUploadModal(true), className: "btn-primary", children: "Upload Content" })] })] }), _jsx("div", { className: "card", children: contents.length === 0 ? (_jsxs("div", { className: "rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-6 py-16 text-center", children: [_jsx("p", { className: "text-xl font-semibold tracking-tight", children: "No content yet" }), _jsx("p", { className: "mt-2 text-sm text-black/60", children: "Upload something to start building your shared band library." })] })) : (_jsx(ContentList, { contents: contents, onDelete: handleDeleteContent, onRename: handleRenameContent })) })] }), _jsxs("aside", { className: "space-y-6", children: [_jsxs("section", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "People" }), _jsx("h2", { className: "mt-2 text-2xl font-bold tracking-tight", children: "Band Members" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Contact everyone in the band and keep roles visible." })] }), _jsx("span", { className: "stat-pill", children: sortedMembers.length })] }), _jsx("div", { className: "mt-5 space-y-3", children: sortedMembers.map((member) => {
                                                const label = member.user.name || member.user.email;
                                                const isCurrentUser = member.user.id === currentUser?.id;
                                                const initials = label.charAt(0).toUpperCase();
                                                return (_jsxs("div", { className: "flex items-start gap-3 rounded-[24px] border border-black/10 bg-white/80 px-4 py-4", children: [_jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/20 bg-black text-sm font-semibold text-white", children: initials }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("p", { className: "font-semibold text-black", children: label }), isCurrentUser && (_jsx("span", { className: "rounded-full border border-orange-300/70 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: "You" })), _jsx("span", { className: "rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: member.role })] }), _jsx("p", { className: "truncate pt-1 text-sm text-black/50", children: member.user.email })] })] }, member.id));
                                            }) })] }), canInviteMembers && (_jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Band Link" }), _jsx("h2", { className: "mt-2 text-2xl font-bold tracking-tight", children: "Reusable Join Link" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Share one link that lets anyone sign up, log in, and join this band from a confirmation screen." }), joinLinkStatus && (_jsx("div", { className: `mt-5 status-banner ${joinLinkStatus.tone === 'success'
                                                ? 'status-banner-strong'
                                                : 'status-banner-muted'}`, children: joinLinkStatus.text })), joinLinkLoading ? (_jsx("p", { className: "mt-5 text-sm text-black/60", children: "Loading the current band link..." })) : joinLink ? (_jsxs("div", { className: "mt-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Shareable link" }), _jsx("input", { type: "text", readOnly: true, value: shareableJoinLink, className: "input-field" })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("button", { type: "button", onClick: () => void handleCopyJoinLink(), className: "btn-primary", disabled: joinLinkAction !== null, children: joinLinkAction === 'copy' ? 'Copying...' : 'Copy Link' }), _jsx("button", { type: "button", onClick: () => void handleCreateOrRegenerateJoinLink(), className: "btn-secondary", disabled: joinLinkAction !== null, children: joinLinkAction === 'create' ? 'Refreshing...' : 'Regenerate' }), _jsx("button", { type: "button", onClick: () => void handleDisableJoinLink(), className: "btn-danger", disabled: joinLinkAction !== null, children: joinLinkAction === 'disable' ? 'Disabling...' : 'Disable' })] })] })) : (_jsxs("div", { className: "mt-5 space-y-4", children: [_jsx("p", { className: "rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-4 py-6 text-sm text-black/60", children: "No band link yet. Create one when you want people to join from a shareable link." }), _jsx("button", { type: "button", onClick: () => void handleCreateOrRegenerateJoinLink(), className: "btn-primary w-full", disabled: joinLinkAction !== null, children: joinLinkAction === 'create' ? 'Creating link...' : 'Create Band Link' })] }))] })), _jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Invite" }), _jsx("h2", { className: "mt-2 text-2xl font-bold tracking-tight", children: "Invite To Band" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Send an invitation by email. They only become a band member after accepting it from their own MyBand account." }), _jsxs("form", { onSubmit: handleInviteMember, className: "mt-5 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "invite-email", className: "mb-2 block text-sm font-medium text-black/70", children: "Member email" }), _jsx("input", { id: "invite-email", type: "email", value: inviteEmail, onChange: (event) => setInviteEmail(event.target.value), className: "input-field", placeholder: "bandmate@example.com", disabled: inviteLoading || !canInviteMembers })] }), !canInviteMembers && (_jsx("p", { className: "status-banner status-banner-muted", children: "Only band admins can invite members." })), inviteStatus && (_jsx("div", { className: `status-banner ${inviteStatus.tone === 'success'
                                                        ? 'status-banner-strong'
                                                        : 'status-banner-muted'}`, children: inviteStatus.text })), _jsx("button", { type: "submit", className: "btn-primary w-full", disabled: inviteLoading || !canInviteMembers, children: inviteLoading ? 'Sending invitation...' : 'Send Invitation' })] })] }), _jsxs("section", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "Pending" }), _jsx("h2", { className: "mt-2 text-2xl font-bold tracking-tight", children: "Pending Invitations" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "These people will appear as members only after they accept." })] }), _jsx("span", { className: "stat-pill", children: pendingInvitations.length })] }), pendingInvitationStatus && (_jsx("div", { className: `mt-5 status-banner ${pendingInvitationStatus.tone === 'success'
                                                ? 'status-banner-strong'
                                                : 'status-banner-muted'}`, children: pendingInvitationStatus.text })), pendingInvitations.length === 0 ? (_jsx("p", { className: "mt-5 rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-4 py-6 text-sm text-black/60", children: "No pending invitations right now." })) : (_jsx("div", { className: "mt-5 space-y-3", children: pendingInvitations.map((invitation) => (_jsxs("div", { className: "rounded-[24px] border border-black/10 bg-white/80 px-4 py-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("p", { className: "font-semibold text-black", children: invitation.email }), _jsx("span", { className: "rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: "Pending" })] }), _jsx("p", { className: "mt-3 text-sm leading-6 text-black/60", children: invitation.invitee
                                                            ? `Waiting for ${invitation.invitee.name || invitation.invitee.email} to accept in their dashboard.`
                                                            : 'No account found yet. They can sign up with this email and accept the invite afterward.' }), canInviteMembers && (_jsx("div", { className: "mt-4 flex justify-end", children: _jsx("button", { type: "button", onClick: () => void handleRemoveInvitation(invitation), className: "btn-danger", disabled: removingInvitationId === invitation.id, children: removingInvitationId === invitation.id ? 'Removing...' : 'Remove Request' }) }))] }, invitation.id))) }))] })] })] }) }), showUploadModal && (_jsx(UploadContentModal, { onClose: () => setShowUploadModal(false), onUpload: handleUpload }))] }));
}
//# sourceMappingURL=GroupPage.js.map