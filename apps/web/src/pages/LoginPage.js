import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import '../styles/auth.css';
export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authApi.login(formData.email, formData.password);
            localStorage.setItem('token', response.token);
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.message || 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center", children: _jsxs("div", { className: "card w-full max-w-md", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: "Login to MyBand" }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Email" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, className: "input-field", required: true, placeholder: "you@example.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Password" }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleChange, className: "input-field", required: true, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full btn-primary disabled:opacity-50", children: loading ? 'Logging in...' : 'Login' })] }), _jsxs("p", { className: "text-center mt-6", children: ["Don't have an account?", ' ', _jsx("a", { href: "/auth/register", className: "text-blue-600 font-bold hover:underline", children: "Sign up" })] })] }) }));
}
//# sourceMappingURL=LoginPage.js.map