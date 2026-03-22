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
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "card w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Create New Band" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Band Name *" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, className: "input-field", placeholder: "e.g., The Beatles", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, className: "input-field resize-none h-24", placeholder: "Optional band description..." })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 btn-secondary", disabled: loading, children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 btn-primary disabled:opacity-50", disabled: loading, children: loading ? 'Creating...' : 'Create' })] })] })] }) }));
}
//# sourceMappingURL=CreateGroupModal.js.map