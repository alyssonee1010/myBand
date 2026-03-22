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
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "card w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Upload Content" }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Title *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "input-field", placeholder: "e.g., Song Lyrics", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "input-field resize-none h-20", placeholder: "Optional description..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "File (PDF or Image) *" }), _jsx("input", { type: "file", onChange: (e) => setFile(e.target.files?.[0] || null), className: "input-field", accept: ".pdf,image/*", required: true }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Max 10MB for PDFs, 5MB for images" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 btn-secondary", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 btn-primary disabled:opacity-50", disabled: loading, children: loading ? 'Uploading...' : 'Upload' })] })] })] }) }));
}
//# sourceMappingURL=UploadContentModal.js.map