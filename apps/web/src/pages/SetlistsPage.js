import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { groupApi, setlistApi } from '../lib/api';
import '../styles/setlist.css';
export default function SetlistsPage() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [setlists, setSetlists] = useState([]);
    const [newSetlistName, setNewSetlistName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    useEffect(() => {
        if (!groupId) {
            navigate('/dashboard');
            return;
        }
        void loadPage(groupId);
    }, [groupId, navigate]);
    const loadPage = async (currentGroupId) => {
        try {
            const [groupData, setlistData] = await Promise.all([
                groupApi.getGroup(currentGroupId),
                setlistApi.getGroupSetlists(currentGroupId),
            ]);
            setGroup(groupData);
            setSetlists(setlistData);
        }
        catch (err) {
            alert('Failed to load setlists');
            navigate('/dashboard');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateSetlist = async (e) => {
        e.preventDefault();
        const trimmedName = newSetlistName.trim();
        if (!trimmedName || !groupId) {
            return;
        }
        setCreating(true);
        try {
            const newSetlist = await setlistApi.createSetlist(groupId, trimmedName);
            setSetlists((currentSetlists) => [...currentSetlists, newSetlist]);
            setNewSetlistName('');
            navigate(`/groups/${groupId}/setlists/${newSetlist.id}`);
        }
        catch (err) {
            alert('Failed to create setlist');
        }
        finally {
            setCreating(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "app-shell flex min-h-screen items-center justify-center px-4", children: _jsxs("div", { className: "card max-w-sm text-center", children: [_jsx("p", { className: "section-kicker", children: "Loading" }), _jsx("p", { className: "mt-3 text-xl font-semibold tracking-tight", children: "Gathering your setlists..." })] }) }));
    }
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { className: "app-header", children: _jsxs("div", { className: "container-app", children: [_jsxs("button", { onClick: () => navigate(`/groups/${groupId}`), className: "app-link mb-5 inline-flex items-center gap-2", children: [_jsx("span", { "aria-hidden": "true", children: "\u2190" }), _jsx("span", { children: "Back to Band" })] }), _jsxs("div", { className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "max-w-3xl", children: [_jsx("p", { className: "section-kicker", children: "Setlists" }), _jsxs("h1", { className: "mt-3 text-4xl font-bold tracking-tight md:text-5xl", children: [group?.name, " setlists"] }), group?.description && (_jsx("p", { className: "mt-4 text-sm leading-6 text-black/60 md:text-base", children: group.description }))] }), _jsxs("span", { className: "stat-pill", children: [setlists.length, " total"] })] })] }) }), _jsxs("main", { className: "container-app space-y-8", children: [_jsxs("form", { onSubmit: handleCreateSetlist, className: "card", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "Create" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Build a new setlist" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Start a new rehearsal or gig flow and add songs in the order you want to perform them." })] }), _jsxs("div", { className: "mt-6 flex flex-col gap-3 md:flex-row", children: [_jsx("input", { type: "text", value: newSetlistName, onChange: (e) => setNewSetlistName(e.target.value), className: "input-field flex-1", placeholder: "e.g., Friday rehearsal", disabled: creating, required: true }), _jsx("button", { type: "submit", className: "btn-primary", disabled: creating, children: creating ? 'Creating...' : 'Create Setlist' })] })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-end justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "section-kicker", children: "Library" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "All Setlists" })] }), _jsxs("span", { className: "soft-label", children: [setlists.length, " total"] })] }), setlists.length === 0 ? (_jsxs("div", { className: "card mt-5 py-16 text-center", children: [_jsx("p", { className: "text-2xl font-semibold tracking-tight", children: "No setlists yet" }), _jsx("p", { className: "mt-3 text-sm leading-6 text-black/60", children: "Create one to start arranging songs for rehearsal or performance." })] })) : (_jsx("div", { className: "mt-5 grid grid-cols-1 gap-6 md:grid-cols-2", children: setlists.map((setlist, index) => (_jsx(Link, { to: `/groups/${groupId}/setlists/${setlist.id}`, className: "group block", children: _jsxs("div", { className: "card h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-orange-400/50", children: [_jsxs("p", { className: "section-kicker", children: ["Setlist ", String(index + 1).padStart(2, '0')] }), _jsx("h3", { className: "mt-4 text-2xl font-bold tracking-tight", children: setlist.name }), _jsxs("p", { className: "mt-3 text-sm leading-6 text-black/60", children: [setlist.items.length, " ", setlist.items.length === 1 ? 'song' : 'songs'] }), _jsxs("div", { className: "mt-8 flex items-center justify-between", children: [_jsx("span", { className: "stat-pill", children: "Open" }), _jsx("span", { className: "text-lg text-orange-600 transition group-hover:translate-x-1 group-hover:text-black", children: "\u2192" })] })] }) }, setlist.id))) }))] })] })] }));
}
//# sourceMappingURL=SetlistsPage.js.map