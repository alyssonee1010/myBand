import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token')?.trim() || '';
    const initialEmail = searchParams.get('email')?.trim() || '';
    const navigationState = location.state;
    const [email, setEmail] = useState(initialEmail);
    const [loading, setLoading] = useState(Boolean(token));
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(token ? 'Verifying your email...' : 'Check your inbox for a verification link.');
    const [previewUrl, setPreviewUrl] = useState(navigationState?.verificationPreviewUrl || '');
    useEffect(() => {
        if (!token) {
            return;
        }
        let cancelled = false;
        const verify = async () => {
            try {
                const response = await authApi.verifyEmail(token);
                if (cancelled) {
                    return;
                }
                setSuccess(response.message || 'Email verified. Redirecting to your dashboard...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 800);
            }
            catch (err) {
                if (cancelled) {
                    return;
                }
                setError(err?.message || 'Verification failed');
                setSuccess('');
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void verify();
        return () => {
            cancelled = true;
        };
    }, [navigate, token]);
    const handleResend = async (event) => {
        event.preventDefault();
        setError('');
        setPreviewUrl('');
        if (!email.trim()) {
            setError('Enter your email address to resend the verification link.');
            return;
        }
        setResending(true);
        try {
            const response = await authApi.resendVerificationEmail(email.trim());
            setSuccess(response.message || 'Verification email sent.');
            setPreviewUrl(response.verificationPreviewUrl || '');
        }
        catch (err) {
            setError(err?.message || 'Failed to resend verification email');
            setSuccess('');
        }
        finally {
            setResending(false);
        }
    };
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card bg-[linear-gradient(145deg,rgba(10,10,10,0.96),rgba(52,52,52,0.88))]", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/60", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Verify your ", _jsx("span", { className: "app-brand", children: "email." })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/70", children: "We only let verified accounts sign in. Open the link from your inbox, or request a new verification email below." })] }), _jsxs("section", { className: "card bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(238,238,234,0.76))]", children: [_jsx("p", { className: "section-kicker", children: "Verify Email" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Confirm your address" }), error && _jsx("div", { className: "mt-5 status-banner status-banner-muted", children: error }), success && _jsx("div", { className: "mt-5 status-banner status-banner-strong", children: success }), previewUrl && (_jsxs("div", { className: "mt-4 text-sm leading-6 text-black/60", children: ["Development preview link:", ' ', _jsx("a", { href: previewUrl, className: "font-semibold text-black underline-offset-4 hover:underline", children: "Open verification link" })] })), !loading && (_jsxs("form", { onSubmit: handleResend, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), className: "input-field", disabled: resending, placeholder: "you@example.com" })] }), _jsx("button", { type: "submit", disabled: resending, className: "btn-primary w-full", children: resending ? 'Sending verification email...' : 'Resend Verification Email' })] })), _jsxs("p", { className: "mt-6 text-sm text-black/60", children: ["Already verified?", ' ', _jsx(Link, { to: "/auth/login", className: "font-semibold text-black underline-offset-4 hover:underline", children: "Back to login" })] })] })] }) }));
}
//# sourceMappingURL=VerifyEmailPage.js.map