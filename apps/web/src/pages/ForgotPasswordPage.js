import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorNoticeId, setErrorNoticeId] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [nextStep, setNextStep] = useState('reset-password');
    const showError = (message) => {
        setErrorNoticeId((n) => n + 1);
        setError(message);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const trimmed = email.trim();
        if (!trimmed) {
            showError('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            const result = await authApi.forgotPassword(trimmed);
            setPreviewUrl(result.emailPreviewUrl || result.resetPreviewUrl || result.verificationPreviewUrl || '');
            setNextStep(result.nextStep === 'verify-email' ? 'verify-email' : 'reset-password');
            setSubmitted(true);
        }
        catch (err) {
            showError(err?.message || 'Something went wrong. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/70", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Locked out of the", ' ', _jsx("span", { className: "app-brand text-orange-400", children: "session?" })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/[0.74]", children: "No worries. Enter your email and we'll send you a link to get back in." })] }), _jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Forgot Password" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Reset your password" }), !submitted ? (_jsxs(_Fragment, { children: [error && (_jsx("div", { className: "mt-5 status-banner status-banner-muted status-banner-attention", children: error }, `fp-error-${errorNoticeId}`)), _jsxs("form", { onSubmit: handleSubmit, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Email address" }), _jsx("input", { id: "forgot-password-email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "input-field", placeholder: "you@example.com", required: true, disabled: loading, autoFocus: true })] }), _jsx("button", { type: "submit", id: "forgot-password-submit", disabled: loading, className: "btn-primary w-full", children: loading ? 'Sending...' : 'Send reset link' })] })] })) : (_jsxs("div", { className: "mt-6 space-y-4", children: [_jsx("div", { className: "status-banner status-banner-strong", children: nextStep === 'verify-email'
                                        ? 'That account still needs verification, so we sent a verification link instead.'
                                        : 'Check your inbox — if an account with that email exists, a reset link is on its way.' }), previewUrl && (_jsxs("div", { className: "rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm", children: [_jsx("p", { className: "font-medium text-orange-800", children: "Development preview" }), _jsx("a", { href: previewUrl, className: "mt-1 block break-all text-orange-600 underline-offset-4 hover:underline", children: previewUrl })] })), nextStep === 'verify-email' && (_jsx(Link, { to: `/auth/verify-email?email=${encodeURIComponent(email.trim())}`, className: "btn-secondary block w-full text-center", children: "Open verification page" })), _jsx("button", { onClick: () => {
                                        setSubmitted(false);
                                        setEmail('');
                                        setPreviewUrl('');
                                        setNextStep('reset-password');
                                    }, className: "btn-secondary w-full", children: "Send to a different email" })] })), _jsxs("p", { className: "mt-6 text-sm text-black/60", children: ["Remember your password?", ' ', _jsx(Link, { to: "/auth/login", className: "font-semibold text-orange-600 underline-offset-4 hover:underline", children: "Log in" })] })] })] }) }));
}
//# sourceMappingURL=ForgotPasswordPage.js.map