import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export default function LandingPage() {
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-white", children: [_jsx("h1", { className: "text-5xl font-bold mb-4", children: "\uD83C\uDFB8 MyBand" }), _jsx("p", { className: "text-xl mb-8", children: "Collaborate with your band, one setlist at a time" }), _jsxs("div", { className: "space-x-4", children: [_jsx(Link, { to: "/auth/login", className: "inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition", children: "Login" }), _jsx(Link, { to: "/auth/register", className: "inline-block px-8 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 transition", children: "Sign Up" })] })] }) }));
}
//# sourceMappingURL=LandingPage.js.map