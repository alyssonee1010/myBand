import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
export default function ContentList({ contents, onDelete, onRename, onPreview }) {
    const [editingContentId, setEditingContentId] = useState(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [savingContentId, setSavingContentId] = useState(null);
    const [renameError, setRenameError] = useState('');
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
        setRenameError('');
    };
    const cancelRenaming = () => {
        setEditingContentId(null);
        setDraftTitle('');
        setRenameError('');
    };
    const handleRename = async (contentId) => {
        const trimmedTitle = draftTitle.trim();
        if (!trimmedTitle) {
            setRenameError('Title is required');
            return;
        }
        setSavingContentId(contentId);
        setRenameError('');
        try {
            await onRename(contentId, trimmedTitle);
            cancelRenaming();
        }
        catch (error) {
            setRenameError(error?.message || 'Failed to rename this item');
        }
        finally {
            setSavingContentId(null);
        }
    };
    return (_jsx("div", { className: "space-y-4", children: contents.map((content, index) => {
            const isEditing = editingContentId === content.id;
            const isSaving = savingContentId === content.id;
            const canPreview = Boolean(content.fileUrl) && (content.contentType === 'image' || content.contentType === 'pdf');
            return (_jsx("div", { className: "rounded-[26px] border border-black/10 bg-white/[0.82] p-5", children: _jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: String(index + 1).padStart(2, '0') }), _jsx("span", { className: "rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: getTypeLabel(content.contentType) })] }), isEditing ? (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsx("input", { type: "text", value: draftTitle, onChange: (event) => setDraftTitle(event.target.value), className: "input-field", placeholder: "Rename this item", disabled: isSaving, autoFocus: true }), renameError && (_jsx("p", { className: "text-sm text-red-700", children: renameError }))] })) : (_jsx("div", { className: "mt-4", children: canPreview ? (_jsx("button", { type: "button", onClick: () => onPreview(content), className: "text-left text-2xl font-bold tracking-tight text-black transition hover:text-orange-600", children: content.title })) : (_jsx("h3", { className: "text-2xl font-bold tracking-tight text-black", children: content.title })) })), content.description && (_jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-black/60", children: content.description })), _jsxs("p", { className: "mt-4 text-xs uppercase tracking-[0.18em] text-black/40", children: ["Added by ", content.createdBy.name || content.createdBy.email] })] }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [canPreview && !isEditing && (_jsx("button", { type: "button", onClick: () => onPreview(content), className: "btn-primary", children: "Preview" })), isEditing ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => void handleRename(content.id), className: "btn-primary", disabled: isSaving, children: isSaving ? 'Saving...' : 'Save Title' }), _jsx("button", { onClick: cancelRenaming, className: "btn-secondary", disabled: isSaving, children: "Cancel" })] })) : (_jsx("button", { onClick: () => startRenaming(content), className: "btn-secondary", children: "Rename" })), _jsx("button", { onClick: () => void onDelete(content.id), className: "btn-danger", disabled: isSaving, children: "Delete" })] })] }) }, content.id));
        }) }));
}
//# sourceMappingURL=ContentList.js.map