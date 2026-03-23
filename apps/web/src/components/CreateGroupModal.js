import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function CreateGroupModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Band name is required');
            return;
        }
        setLoading(true);
        try {
            await onCreate(formData.name, formData.description);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "card modal-card max-w-md", children: [_jsx("p", { className: "section-kicker", children: "Create" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Create New Band" }), _jsx("p", { className: "mt-2 text-sm leading-6 text-black/60", children: "Start a fresh workspace for members, shared content, and setlists." }), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Band Name" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, className: "input-field", placeholder: "e.g., Midnight Echo", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Description" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, className: "input-field h-28 resize-none", placeholder: "What makes this project special?" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "btn-secondary flex-1", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn-primary flex-1", disabled: loading, children: loading ? 'Creating...' : 'Create' })] })] })] }) }));
}
//# sourceMappingURL=CreateGroupModal.js.map