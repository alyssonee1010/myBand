const POST_AUTH_REDIRECT_KEY = 'myband-post-auth-redirect';
const POST_AUTH_REDIRECT_TTL_MS = 2 * 60 * 60 * 1000;
function getStorage() {
    if (typeof window === 'undefined') {
        return null;
    }
    return window.localStorage;
}
function readRedirect() {
    const storage = getStorage();
    const rawValue = storage?.getItem(POST_AUTH_REDIRECT_KEY);
    if (!rawValue) {
        return null;
    }
    try {
        const parsedValue = JSON.parse(rawValue);
        if (!parsedValue ||
            typeof parsedValue.path !== 'string' ||
            !parsedValue.path.startsWith('/') ||
            typeof parsedValue.expiresAt !== 'number') {
            storage?.removeItem(POST_AUTH_REDIRECT_KEY);
            return null;
        }
        if (parsedValue.expiresAt <= Date.now()) {
            storage?.removeItem(POST_AUTH_REDIRECT_KEY);
            return null;
        }
        return parsedValue;
    }
    catch {
        storage?.removeItem(POST_AUTH_REDIRECT_KEY);
        return null;
    }
}
export function setPostAuthRedirect(path) {
    if (!path.startsWith('/')) {
        return;
    }
    const storage = getStorage();
    storage?.setItem(POST_AUTH_REDIRECT_KEY, JSON.stringify({
        path,
        expiresAt: Date.now() + POST_AUTH_REDIRECT_TTL_MS,
    }));
}
export function peekPostAuthRedirect() {
    return readRedirect()?.path || null;
}
export function consumePostAuthRedirect() {
    const redirectPath = readRedirect()?.path || null;
    clearPostAuthRedirect();
    return redirectPath;
}
export function clearPostAuthRedirect() {
    const storage = getStorage();
    storage?.removeItem(POST_AUTH_REDIRECT_KEY);
}
//# sourceMappingURL=postAuthRedirect.js.map