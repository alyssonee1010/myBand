import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }
        try {
            const response = await authApi.register(formData.email, formData.password, formData.name);
            setSuccess(response.message || 'Account created. Check your inbox to verify your email.');
            setTimeout(() => {
                navigate(`/auth/verify-email?email=${encodeURIComponent(formData.email.trim())}`, {
                    state: {
                        verificationPreviewUrl: response.verificationPreviewUrl,
                    },
                });
            }, 800);
        }
        catch (err) {
            const errorMsg = err?.message || err?.toString() || 'Registration failed';
            setError(errorMsg);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card bg-[linear-gradient(145deg,rgba(10,10,10,0.96),rgba(52,52,52,0.88))]", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/60", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Build a tighter ", _jsx("span", { className: "app-brand", children: "band workflow." })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/70", children: "Create your account, accept invitations, and start organizing rehearsals with a calmer interface." })] }), _jsxs("section", { className: "card bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(238,238,234,0.76))]", children: [_jsx("p", { className: "section-kicker", children: "Sign Up" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Create your account" }), error && (_jsx("div", { className: "mt-5 status-banner status-banner-muted", children: error })), success && (_jsx("div", { className: "mt-5 status-banner status-banner-strong", children: success })), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Name" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, className: "input-field", disabled: loading, placeholder: "Your name" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Email" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, className: "input-field", required: true, disabled: loading, placeholder: "you@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Password" }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleChange, className: "input-field", required: true, disabled: loading, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("p", { className: "mt-2 text-xs uppercase tracking-[0.18em] text-black/40", children: "At least 6 characters" })] }), _jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full", children: loading ? 'Creating account...' : 'Sign Up' })] }), _jsxs("p", { className: "mt-6 text-sm text-black/60", children: ["Already have an account?", ' ', _jsx(Link, { to: "/auth/login", className: "font-semibold text-black underline-offset-4 hover:underline", children: "Login" })] })] })] }) }));
}
//# sourceMappingURL=RegisterPage.js.map