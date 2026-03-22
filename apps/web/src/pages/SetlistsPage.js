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
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("p", { className: "text-xl", children: "Loading..." }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "container-app", children: [_jsx("button", { onClick: () => navigate(`/groups/${groupId}`), className: "text-blue-600 hover:underline mb-4", children: "\u2190 Back to Band" }), _jsxs("h1", { className: "text-3xl font-bold", children: [group?.name, " Setlists"] }), group?.description && _jsx("p", { className: "text-gray-600", children: group.description })] }) }), _jsxs("main", { className: "container-app space-y-8", children: [_jsxs("form", { onSubmit: handleCreateSetlist, className: "card space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Create Setlist" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Start a new setlist for rehearsals or gigs." })] }), _jsxs("div", { className: "flex flex-col gap-3 md:flex-row", children: [_jsx("input", { type: "text", value: newSetlistName, onChange: (e) => setNewSetlistName(e.target.value), className: "input-field flex-1", placeholder: "e.g., Friday rehearsal", disabled: creating, required: true }), _jsx("button", { type: "submit", className: "btn-primary disabled:opacity-50 disabled:cursor-not-allowed", disabled: creating, children: creating ? 'Creating...' : '+ New Setlist' })] })] }), _jsxs("section", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-2xl font-bold", children: "All Setlists" }), _jsxs("span", { className: "text-sm text-gray-500", children: [setlists.length, " total"] })] }), setlists.length === 0 ? (_jsx("div", { className: "card text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "No setlists yet. Create one to start adding songs." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: setlists.map((setlist) => (_jsxs(Link, { to: `/groups/${groupId}/setlists/${setlist.id}`, className: "card hover:shadow-lg transition", children: [_jsx("h3", { className: "text-xl font-bold mb-2", children: setlist.name }), _jsxs("p", { className: "text-gray-600 mb-4", children: [setlist.items.length, " ", setlist.items.length === 1 ? 'song' : 'songs'] }), _jsx("p", { className: "text-blue-600 hover:underline", children: "Open setlist \u2192" })] }, setlist.id))) }))] })] })] }));
}
//# sourceMappingURL=SetlistsPage.js.map