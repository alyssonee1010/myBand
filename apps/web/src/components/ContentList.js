import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export default function ContentList({ contents, onDelete, groupId }) {
    const getIcon = (contentType) => {
        switch (contentType) {
            case 'lyrics':
                return '📝';
            case 'chords':
                return '🎵';
            case 'pdf':
                return '📄';
            case 'image':
                return '🖼️';
            default:
                return '📦';
        }
    };
    return (_jsx("div", { className: "space-y-4", children: contents.map((content) => (_jsx("div", { className: "card", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("span", { className: "text-2xl", children: getIcon(content.contentType) }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-lg", children: content.title }), _jsx("p", { className: "text-sm text-gray-500 capitalize", children: content.contentType })] })] }), content.description && (_jsx("p", { className: "text-gray-600 mb-2", children: content.description })), _jsxs("p", { className: "text-xs text-gray-400", children: ["by ", content.createdBy.name || content.createdBy.email] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Link, { to: `/groups/${groupId}/setlists`, children: _jsx("button", { className: "btn-secondary text-sm inline-block", children: "View Setlists" }) }), _jsx("button", { onClick: () => onDelete(content.id), className: "btn-danger text-sm", children: "Delete" })] })] }) }, content.id))) }));
}
//# sourceMappingURL=ContentList.js.map