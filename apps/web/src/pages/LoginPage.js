import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
        // Client-side validation
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }
        try {
            console.log('📡 Attempting login with:', { email: formData.email });
            const response = await authApi.login(formData.email, formData.password);
            if (!response.token) {
                throw new Error('No token received from server');
            }
            console.log('✅ Login successful, token stored');
            setSuccess('Login successful! Redirecting...');
            // Wait a moment to show success message, then navigate
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);
        }
        catch (err) {
            console.error('❌ Login error:', err);
            // Handle both Error objects and plain error objects
            const errorMsg = err?.message || err?.toString() || 'Login failed';
            setError(errorMsg);
            console.log('Error message displayed:', errorMsg);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center", children: _jsxs("div", { className: "card w-full max-w-md", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: "Login to MyBand" }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: "Login Failed" }), _jsx("p", { className: "text-sm mt-1", children: error })] }), _jsx("button", { type: "button", onClick: () => setError(''), className: "text-red-600 hover:text-red-800 font-bold", children: "\u2715" })] }) })), success && (_jsxs("div", { className: "mb-4 p-4 bg-green-50 border-l-4 border-green-600 text-green-800 rounded", children: [_jsx("p", { className: "font-semibold", children: "Success!" }), _jsx("p", { className: "text-sm mt-1", children: success })] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Email" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, className: "input-field", required: true, disabled: loading, placeholder: "you@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Password" }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleChange, className: "input-field", required: true, disabled: loading, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "inline-block animate-spin mr-2", children: "\u23F3" }), "Logging in..."] })) : ('Login') })] }), _jsxs("p", { className: "text-center mt-6", children: ["Don't have an account?", ' ', _jsx(Link, { to: "/auth/register", className: "text-blue-600 font-bold hover:underline", children: "Sign up" })] })] }) }));
}
//# sourceMappingURL=LoginPage.js.map