import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function UploadContentModal({ onClose, onUpload }) {
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!file) {
            setError('Please select a file');
            return;
        }
        setLoading(true);
        try {
            await onUpload(formData.title, formData.description, file);
        }
        catch (err) {
            setError(err.message || 'Upload failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "card modal-card max-w-md", children: [_jsx("p", { className: "section-kicker", children: "Upload" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Add Shared Content" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Upload a PDF or image so the whole band can access it in one place." }), error && (_jsx("div", { className: "mt-5 status-banner status-banner-muted", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Title" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "input-field", placeholder: "e.g., Intro arrangement", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "input-field h-24 resize-none", placeholder: "A short note for the band..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "File" }), _jsx("input", { type: "file", onChange: (e) => setFile(e.target.files?.[0] || null), className: "input-field", accept: ".pdf,image/*", required: true }), _jsx("p", { className: "mt-2 text-xs uppercase tracking-[0.18em] text-black/40", children: "Max 10MB for PDFs, 5MB for images" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn-primary flex-1", disabled: loading, children: loading ? 'Uploading...' : 'Upload' })] })] })] }) }));
}
//# sourceMappingURL=UploadContentModal.js.map