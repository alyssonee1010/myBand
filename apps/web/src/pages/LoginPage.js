import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
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
        setUnverifiedEmail('');
        setLoading(true);
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }
        try {
            const response = await authApi.login(formData.email, formData.password);
            if (!response.token) {
                throw new Error('No token received from server');
            }
            setSuccess('Login successful. Redirecting...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);
        }
        catch (err) {
            const errorMsg = err?.message || err?.toString() || 'Login failed';
            if (err?.status === 403 && err?.response?.code === 'EMAIL_NOT_VERIFIED') {
                setUnverifiedEmail(formData.email.trim());
            }
            setError(errorMsg);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/70", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Step back into the ", _jsx("span", { className: "app-brand text-orange-400", children: "session." })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/[0.74]", children: "Open your bands, accept invites, and pick up where the last rehearsal left off." })] }), _jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Log In" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Welcome back" }), error && (_jsx("div", { className: "mt-5 status-banner status-banner-muted", children: error })), unverifiedEmail && (_jsxs("div", { className: "mt-4 text-sm text-black/60", children: ["Need a new verification link?", ' ', _jsx(Link, { to: `/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`, className: "font-semibold text-orange-600 underline-offset-4 hover:underline", children: "Verify your email" })] })), success && (_jsx("div", { className: "mt-5 status-banner status-banner-strong", children: success })), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Email" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, className: "input-field", required: true, disabled: loading, placeholder: "you@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Password" }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleChange, className: "input-field", required: true, disabled: loading, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: loading, className: "btn-primary w-full", children: loading ? 'Logging in...' : 'Login' })] }), _jsxs("p", { className: "mt-6 text-sm text-black/60", children: ["Don't have an account?", ' ', _jsx(Link, { to: "/auth/register", className: "font-semibold text-orange-600 underline-offset-4 hover:underline", children: "Sign up" })] })] })] }) }));
}
//# sourceMappingURL=LoginPage.js.map