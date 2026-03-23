import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './platform';
const TOKEN_KEY = 'auth_token';
const LEGACY_TOKEN_KEY = 'token';
function getWindowStorage() {
    if (typeof window === 'undefined') {
        return null;
    }
    return window.localStorage;
}
export async function getToken() {
    if (isNativePlatform) {
        const { value } = await Preferences.get({ key: TOKEN_KEY });
        if (value) {
            return value;
        }
        const storage = getWindowStorage();
        const legacyToken = storage?.getItem(LEGACY_TOKEN_KEY);
        if (legacyToken) {
            await Preferences.set({ key: TOKEN_KEY, value: legacyToken });
            storage?.setItem(TOKEN_KEY, legacyToken);
            return legacyToken;
        }
        return null;
    }
    const storage = getWindowStorage();
    return storage?.getItem(TOKEN_KEY) || storage?.getItem(LEGACY_TOKEN_KEY) || null;
}
export async function setToken(token) {
    const storage = getWindowStorage();
    if (isNativePlatform) {
        await Preferences.set({ key: TOKEN_KEY, value: token });
    }
    storage?.setItem(TOKEN_KEY, token);
    storage?.setItem(LEGACY_TOKEN_KEY, token);
}
export async function clearToken() {
    const storage = getWindowStorage();
    if (isNativePlatform) {
        await Preferences.remove({ key: TOKEN_KEY });
    }
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(LEGACY_TOKEN_KEY);
}
//# sourceMappingURL=tokenStorage.js.map