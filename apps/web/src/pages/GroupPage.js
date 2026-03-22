import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupApi, contentApi } from '../lib/api';
import ContentList from '../components/ContentList';
import UploadContentModal from '../components/UploadContentModal';
import '../styles/group.css';
export default function GroupPage() {
    const navigate = useNavigate();
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [contents, setContents] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (groupId) {
            loadGroup();
        }
    }, [groupId]);
    const loadGroup = async () => {
        try {
            const groupData = await groupApi.getGroup(groupId);
            setGroup(groupData);
            const contentsData = await contentApi.getGroupContent(groupId);
            setContents(contentsData.contents);
        }
        catch (err) {
            alert('Failed to load group');
            navigate('/dashboard');
        }
        finally {
            setLoading(false);
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
            setContents(contents.filter((c) => c.id !== contentId));
        }
        catch (err) {
            alert('Failed to delete content');
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("p", { className: "text-xl", children: "Loading..." }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow", children: _jsxs("div", { className: "container-app", children: [_jsx("button", { onClick: () => navigate('/dashboard'), className: "text-blue-600 hover:underline mb-4", children: "\u2190 Back to Bands" }), _jsx("h1", { className: "text-3xl font-bold", children: group?.name }), group?.description && _jsx("p", { className: "text-gray-600", children: group.description })] }) }), _jsxs("main", { className: "container-app", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Content Library" }), _jsx("button", { onClick: () => setShowUploadModal(true), className: "btn-primary", children: "+ Upload Content" })] }), contents.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500 mb-4", children: "No content yet. Upload something to get started!" }) })) : (_jsx(ContentList, { contents: contents, onDelete: handleDeleteContent, groupId: groupId }))] }), showUploadModal && (_jsx(UploadContentModal, { onClose: () => setShowUploadModal(false), onUpload: handleUpload }))] }));
}
//# sourceMappingURL=GroupPage.js.map