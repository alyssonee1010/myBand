import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ContentList({ contents, onDelete }) {
    const getTypeLabel = (contentType) => {
        switch (contentType) {
            case 'lyrics':
                return 'Lyrics';
            case 'chords':
                return 'Chords';
            case 'pdf':
                return 'PDF';
            case 'image':
                return 'Image';
            default:
                return 'File';
        }
    };
    return (_jsx("div", { className: "space-y-4", children: contents.map((content, index) => (_jsx("div", { className: "rounded-[26px] border border-black/10 bg-white/[0.82] p-5", children: _jsxs("div", { className: "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "rounded-full border border-orange-300/60 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: String(index + 1).padStart(2, '0') }), _jsx("span", { className: "rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70", children: getTypeLabel(content.contentType) })] }), _jsx("h3", { className: "mt-4 text-2xl font-bold tracking-tight text-black", children: content.title }), content.description && (_jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-black/60", children: content.description })), _jsxs("p", { className: "mt-4 text-xs uppercase tracking-[0.18em] text-black/40", children: ["Added by ", content.createdBy.name || content.createdBy.email] })] }), _jsx("div", { className: "flex flex-wrap gap-3", children: _jsx("button", { onClick: () => void onDelete(content.id), className: "btn-danger", children: "Delete" }) })] }) }, content.id))) }));
}
//# sourceMappingURL=ContentList.js.map