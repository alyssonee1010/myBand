import { type ReactNode } from 'react';
type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';
interface InstallPromptContextValue {
    canInstall: boolean;
    isInstalled: boolean;
    manualInstallHint: {
        title: string;
        steps: string[];
    } | null;
    promptInstall: () => Promise<InstallOutcome>;
}
export declare function InstallPromptProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useInstallPrompt(): InstallPromptContextValue;
export {};
//# sourceMappingURL=installPrompt.d.ts.map