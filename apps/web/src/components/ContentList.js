import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import LinkifiedText from './LinkifiedText';
export default function ContentList({ contents, onDelete, onEdit, onPreview }) {
    const [editingContentId, setEditingContentId] = useState(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [savingContentId, setSavingContentId] = useState(null);
    const [editError, setEditError] = useState('');
    const getTypeLabel = (contentType) => {
        switch (contentType) {
            case 'lyrics':
                return 'Lyrics';
            case 'chords':
                return 'Chords';
            case 'pdf':
                return 'PDF';
            case 'image':
                return 'Image';
            default:
                return 'File';
        }
    };
    const startRenaming = (content) => {
        setEditingContentId(content.id);
        setDraftTitle(content.title);
        setDraftDescription(content.description || '');
        setEditError('');
    };
    const cancelRenaming = () => {
        setEditingContentId(null);
        setDraftTitle('');
        setDraftDescription('');
        setEditError('');
    };
    const handleSaveDetails = async (contentId) => {
        const trimmedTitle = draftTitle.trim();
        const trimmedDescription = draftDescription.trim();
        if (!trimmedTitle) {
            setEditError('Title is required');
            return;
        }
        setSavingContentId(contentId);
        setEditError('');
        try {
            await onEdit(contentId, trimmedTitle, trimmedDescription);
            cancelRenaming();
        }
        catch (error) {
            setEditError(error?.message || 'Failed to save this item');
        }
        finally {
            setSavingContentId(null);
        }
    };
    return (_jsx("div", { className: "space-y-4", children: contents.map((content, index) => {
            const isEditing = editingContentId === content.id;
            const isSaving = savingContentId === content.id;
            const canPreview = Boolean(content.fileUrl) && (content.contentType === 'image' || content.contentType === 'pdf');
            return (_jsx("div", { className: "rounded-[26px] border border-black/10 bg-white/[0.82] p-5", children: _jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: String(index + 1).padStart(2, '0') }), _jsx("span", { className: "rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: getTypeLabel(content.contentType) })] }), isEditing ? (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsx("input", { type: "text", value: draftTitle, onChange: (event) => setDraftTitle(event.target.value), className: "input-field", placeholder: "Song title", disabled: isSaving, autoFocus: true }), _jsx("textarea", { value: draftDescription, onChange: (event) => setDraftDescription(event.target.value), className: "input-field min-h-[7.5rem] resize-y", placeholder: "Add notes, links, or arrangement details", disabled: isSaving }), _jsx("p", { className: "text-xs uppercase tracking-[0.18em] text-black/40", children: "Links like https://... or www... will be clickable after saving." }), editError && _jsx("p", { className: "text-sm text-red-700", children: editError })] })) : (_jsx("div", { className: "mt-4", children: canPreview ? (_jsx("button", { type: "button", onClick: () => onPreview(content), className: "max-w-full text-left text-2xl font-bold tracking-tight text-black transition hover:text-orange-600 [overflow-wrap:anywhere]", children: content.title })) : (_jsx("h3", { className: "text-2xl font-bold tracking-tight text-black [overflow-wrap:anywhere]", children: content.title })) })), content.description && (_jsx(LinkifiedText, { text: content.description, className: "mt-3 max-w-2xl text-sm leading-6 text-black/60" })), _jsxs("p", { className: "mt-4 text-xs uppercase tracking-[0.18em] text-black/40", children: ["Added by ", content.createdBy.name || content.createdBy.email] })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [canPreview && !isEditing && (_jsx("button", { type: "button", onClick: () => onPreview(content), className: "btn-primary", children: "Preview" })), isEditing ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => void handleSaveDetails(content.id), className: "btn-primary", disabled: isSaving, children: isSaving ? 'Saving...' : 'Save Changes' }), _jsx("button", { onClick: cancelRenaming, className: "btn-secondary", disabled: isSaving, children: "Cancel" })] })) : (_jsx("button", { onClick: () => startRenaming(content), className: "btn-secondary", children: "Edit Details" })), _jsx("button", { onClick: () => void onDelete(content.id), className: "btn-danger", disabled: isSaving, children: "Delete" })] })] }) }, content.id));
        }) }));
}
//# sourceMappingURL=ContentList.js.map