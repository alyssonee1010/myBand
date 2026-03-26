import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ContentPreviewModal({ content, fileUrl, loading, error, onClose }) {
    const renderPreview = () => {
        if (loading) {
            return (_jsx("div", { className: "flex min-h-[20rem] items-center justify-center rounded-[24px] border border-dashed border-orange-300/70 bg-[rgba(255,106,0,0.06)] px-6 py-10 text-center text-black/60", children: "Loading preview..." }));
        }
        if (error) {
            return (_jsx("div", { className: "status-banner status-banner-muted status-banner-attention", children: error }));
        }
        if (!fileUrl) {
            return (_jsx("div", { className: "status-banner status-banner-muted", children: "Preview unavailable for this file." }));
        }
        if (content.contentType === 'image') {
            return (_jsx("div", { className: "flex min-h-[20rem] items-center justify-center overflow-hidden rounded-[24px] border border-black/10 bg-black/5 p-3", children: _jsx("img", { src: fileUrl, alt: content.title, className: "max-h-[70vh] w-auto max-w-full rounded-[18px] object-contain" }) }));
        }
        return (_jsx("div", { className: "overflow-hidden rounded-[24px] border border-black/10 bg-black/5", children: _jsx("object", { data: fileUrl, type: "application/pdf", className: "h-[70vh] w-full", children: _jsx("iframe", { src: fileUrl, title: content.title, className: "h-[70vh] w-full" }, fileUrl) }) }));
    };
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "card modal-card max-h-[90vh] max-w-5xl overflow-y-auto", children: [_jsxs("div", { className: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "section-kicker", children: "Preview" }), _jsx("h2", { className: "mt-2 text-3xl font-bold tracking-tight", children: content.title }), content.description && (_jsx("p", { className: "mt-3 max-w-3xl text-sm leading-6 text-black/60", children: content.description }))] }), _jsx("button", { type: "button", onClick: onClose, className: "btn-secondary", children: "Close" })] }), _jsx("div", { className: "mt-6", children: renderPreview() })] }) }));
}
//# sourceMappingURL=ContentPreviewModal.js.map