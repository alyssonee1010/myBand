import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment } from 'react';
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
const TRAILING_URL_PUNCTUATION = /[),.!?;:]/u;
const normalizeHref = (url) => {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    return `https://${url}`;
};
const splitTrailingPunctuation = (url) => {
    let cleanUrl = url;
    let trailingText = '';
    while (cleanUrl.length > 0) {
        const trailingCharacter = cleanUrl.charAt(cleanUrl.length - 1);
        if (!TRAILING_URL_PUNCTUATION.test(trailingCharacter)) {
            break;
        }
        trailingText = `${trailingCharacter}${trailingText}`;
        cleanUrl = cleanUrl.slice(0, -1);
    }
    return {
        cleanUrl,
        trailingText,
    };
};
export default function LinkifiedText({ text, className = '', linkClassName = 'font-medium text-orange-700 underline underline-offset-4 transition hover:text-orange-800 break-all', }) {
    const content = [];
    let lastIndex = 0;
    for (const match of text.matchAll(URL_PATTERN)) {
        const matchedText = match[0];
        const matchIndex = match.index ?? 0;
        if (matchIndex > lastIndex) {
            content.push(_jsx(Fragment, { children: text.slice(lastIndex, matchIndex) }, `text-${matchIndex}`));
        }
        const { cleanUrl, trailingText } = splitTrailingPunctuation(matchedText);
        if (cleanUrl) {
            content.push(_jsx("a", { href: normalizeHref(cleanUrl), target: "_blank", rel: "noreferrer", className: linkClassName, children: cleanUrl }, `link-${matchIndex}`));
        }
        if (trailingText) {
            content.push(_jsx(Fragment, { children: trailingText }, `trailing-${matchIndex}`));
        }
        lastIndex = matchIndex + matchedText.length;
    }
    if (lastIndex < text.length) {
        content.push(_jsx(Fragment, { children: text.slice(lastIndex) }, `text-${lastIndex}`));
    }
    return (_jsx("div", { className: `min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${className}`.trim(), children: content.length > 0 ? content : text }));
}
//# sourceMappingURL=LinkifiedText.js.map