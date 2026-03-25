import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
const EMAIL_VERIFICATION_RATE_LIMIT_CODE = 'EMAIL_VERIFICATION_RATE_LIMIT';
const EMAIL_VERIFICATION_COOLDOWN_STORAGE_PREFIX = 'myband-email-verification-cooldown';
function normalizeEmailKey(email) {
    return email.trim().toLowerCase();
}
function getCooldownStorageKey(email) {
    return `${EMAIL_VERIFICATION_COOLDOWN_STORAGE_PREFIX}:${normalizeEmailKey(email)}`;
}
function readStoredCooldown(email) {
    if (!email.trim()) {
        return 0;
    }
    try {
        const rawValue = window.localStorage.getItem(getCooldownStorageKey(email));
        if (!rawValue) {
            return 0;
        }
        const expiresAt = Number.parseInt(rawValue, 10);
        if (!Number.isFinite(expiresAt)) {
            window.localStorage.removeItem(getCooldownStorageKey(email));
            return 0;
        }
        const remainingMs = expiresAt - Date.now();
        if (remainingMs <= 0) {
            window.localStorage.removeItem(getCooldownStorageKey(email));
            return 0;
        }
        return Math.ceil(remainingMs / 1000);
    }
    catch {
        return 0;
    }
}
function persistCooldown(email, retryAfterSeconds) {
    if (!email.trim() || retryAfterSeconds <= 0) {
        return;
    }
    try {
        window.localStorage.setItem(getCooldownStorageKey(email), String(Date.now() + retryAfterSeconds * 1000));
    }
    catch {
        // Ignore storage failures and keep the in-memory countdown.
    }
}
function clearStoredCooldown(email) {
    if (!email.trim()) {
        return;
    }
    try {
        window.localStorage.removeItem(getCooldownStorageKey(email));
    }
    catch {
        // Ignore storage failures when cleaning up expired cooldowns.
    }
}
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
    const [error, setError] = useState(navigationState?.initialTone === 'error' ? navigationState.initialMessage || '' : '');
    const [success, setSuccess] = useState(() => {
        if (token) {
            return 'Verifying your email...';
        }
        if (navigationState?.initialTone === 'success') {
            return navigationState.initialMessage || 'Check your inbox for a verification link.';
        }
        return 'Check your inbox for a verification link.';
    });
    const [previewUrl, setPreviewUrl] = useState(navigationState?.verificationPreviewUrl || '');
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    useEffect(() => {
        const initialCooldownSeconds = navigationState?.initialCooldownSeconds || 0;
        const storedCooldown = readStoredCooldown(email);
        const nextCooldown = Math.max(initialCooldownSeconds, storedCooldown);
        if (initialCooldownSeconds > 0) {
            persistCooldown(email, initialCooldownSeconds);
        }
        if (nextCooldown > 0) {
            setCooldownRemaining((current) => Math.max(current, nextCooldown));
        }
    }, [email, navigationState?.initialCooldownSeconds]);
    useEffect(() => {
        if (cooldownRemaining <= 0) {
            clearStoredCooldown(email);
            return;
        }
        const interval = window.setInterval(() => {
            setCooldownRemaining((current) => {
                if (current <= 1) {
                    clearStoredCooldown(email);
                    return 0;
                }
                return current - 1;
            });
        }, 1000);
        return () => {
            window.clearInterval(interval);
        };
    }, [cooldownRemaining, email]);
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
            if (response.alreadyVerified) {
                setSuccess(response.message || 'This email is already activated. You can log in now.');
                setPreviewUrl('');
                setCooldownRemaining(0);
                clearStoredCooldown(email.trim());
                return;
            }
            setSuccess(response.message || 'Verification email sent.');
            setPreviewUrl(response.verificationPreviewUrl || '');
            const nextCooldown = response.retryAfterSeconds || 30;
            setCooldownRemaining(nextCooldown);
            persistCooldown(email.trim(), nextCooldown);
        }
        catch (err) {
            if (err?.status === 429 && err?.response?.code === EMAIL_VERIFICATION_RATE_LIMIT_CODE) {
                const nextCooldown = err?.response?.retryAfterSeconds || 30;
                setCooldownRemaining(nextCooldown);
                persistCooldown(email.trim(), nextCooldown);
            }
            setError(err?.message || 'Failed to resend verification email');
            setSuccess('');
        }
        finally {
            setResending(false);
        }
    };
    return (_jsx("div", { className: "app-shell flex min-h-screen items-center", children: _jsxs("main", { className: "container-app grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center", children: [_jsxs("section", { className: "glass-card", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.32em] text-white/70", children: "MyBand" }), _jsxs("h1", { className: "mt-5 text-5xl font-bold tracking-tight text-white md:text-6xl", children: ["Verify your ", _jsx("span", { className: "app-brand text-orange-400", children: "email." })] }), _jsx("p", { className: "mt-5 max-w-xl text-base leading-7 text-white/[0.74]", children: "We only let verified accounts sign in. Open the link from your inbox, or request a new verification email below." })] }), _jsxs("section", { className: "card", children: [_jsx("p", { className: "section-kicker", children: "Verify Email" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: "Confirm your address" }), error && _jsx("div", { className: "mt-5 status-banner status-banner-muted", children: error }), success && _jsx("div", { className: "mt-5 status-banner status-banner-strong", children: success }), previewUrl && (_jsxs("div", { className: "mt-4 text-sm leading-6 text-black/60", children: ["Development preview link:", ' ', _jsx("a", { href: previewUrl, className: "font-semibold text-orange-600 underline-offset-4 hover:underline", children: "Open verification link" })] })), !loading && (_jsxs("form", { onSubmit: handleResend, className: "mt-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-black/70", children: "Email" }), _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), className: "input-field", disabled: resending, placeholder: "you@example.com" })] }), cooldownRemaining > 0 && (_jsxs("p", { className: "text-sm font-medium text-orange-700", children: ["You can request another verification email in ", cooldownRemaining, "s."] })), _jsx("button", { type: "submit", disabled: resending || cooldownRemaining > 0, className: "btn-primary w-full", children: resending
                                        ? 'Sending verification email...'
                                        : cooldownRemaining > 0
                                            ? `Resend in ${cooldownRemaining}s`
                                            : 'Resend Verification Email' })] })), _jsxs("p", { className: "mt-6 text-sm text-black/60", children: ["Already verified?", ' ', _jsx(Link, { to: "/auth/login", className: "font-semibold text-orange-600 underline-offset-4 hover:underline", children: "Back to login" })] })] })] }) }));
}
//# sourceMappingURL=VerifyEmailPage.js.map