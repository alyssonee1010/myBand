import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorNoticeId, setErrorNoticeId] = useState(0);
    const [success, setSuccess] = useState(false);
    const [invalidToken, setInvalidToken] = useState(false);
    useEffect(() => {
        if (!token) {
            setInvalidToken(true);
        }
    }, [token]);
    const showError = (message) => {
        setErrorNoticeId((n) => n + 1);
        setError(message);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1800);
        }
        catch (err) {
            const code = err?.response?.code;
            if (code === 'PASSWORD_RESET_INVALID') {
                setInvalidToken(true);
            }
            else {
                showError(err?.message || 'Something went wrong. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/70", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Choose a new", ' ', _jsx("span", { className: "app-brand text-orange-400", children: "password." })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/[0.74]", children: "Pick something strong and get back to the music." })] }), _jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Reset Password" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: success ? 'All done!' : 'Set a new password' }), invalidToken && (_jsxs("div", { className: "mt-6 space-y-4", children: [_jsx("div", { className: "status-banner status-banner-muted status-banner-attention", children: "This reset link is invalid or has expired." }), _jsx(Link, { to: "/auth/forgot-password", className: "btn-primary block w-full text-center", children: "Request a new link" })] })), !invalidToken && success && (_jsx("div", { className: "mt-6 space-y-4", children: _jsx("div", { className: "status-banner status-banner-strong", children: "Password reset! Signing you in\u2026" }) })), !invalidToken && !success && (_jsxs(_Fragment, { children: [error && (_jsx("div", { className: "mt-5 status-banner status-banner-muted status-banner-attention", children: error }, `rp-error-${errorNoticeId}`)), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "New password" }), _jsx("input", { id: "reset-password-new", type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "input-field", placeholder: "At least 6 characters", required: true, disabled: loading, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Confirm new password" }), _jsx("input", { id: "reset-password-confirm", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "input-field", placeholder: "Repeat your password", required: true, disabled: loading })] }), _jsx("button", { type: "submit", id: "reset-password-submit", disabled: loading, className: "btn-primary w-full", children: loading ? 'Saving...' : 'Reset password' })] })] })), !success && (_jsxs("p", { className: "mt-6 text-sm text-black/60", children: ["Back to", ' ', _jsx(Link, { to: "/auth/login", className: "font-semibold text-orange-600 underline-offset-4 hover:underline", children: "Log in" })] }))] })] }) }));
}
//# sourceMappingURL=ResetPasswordPage.js.map