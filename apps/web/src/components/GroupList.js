import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export default function GroupList({ groups }) {
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: groups.map((group) => (_jsx(Link, { to: `/groups/${group.id}`, children: _jsxs("div", { className: "card hover:shadow-lg transition cursor-pointer h-full", children: [_jsx("h3", { className: "text-xl font-bold mb-2", children: group.name }), group.description && (_jsx("p", { className: "text-gray-600 mb-4", children: group.description })), _jsx("p", { className: "text-blue-600 hover:underline", children: "View band \u2192" })] }) }, group.id))) }));
}
//# sourceMappingURL=GroupList.js.map