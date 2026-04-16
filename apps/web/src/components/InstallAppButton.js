import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useInstallPrompt } from '../lib/installPrompt';
export default function InstallAppButton({ className = 'btn-secondary', label = 'Install App', busyLabel = 'Opening...', }) {
    const { canInstall, manualInstallHint, promptInstall } = useInstallPrompt();
    const [isInstalling, setIsInstalling] = useState(false);
    const [showManualInstallHint, setShowManualInstallHint] = useState(false);
    if (!canInstall && !manualInstallHint) {
        return null;
    }
    const handleInstall = async () => {
        if (!canInstall) {
            setShowManualInstallHint(true);
            return;
        }
        setIsInstalling(true);
        try {
            await promptInstall();
        }
        finally {
            setIsInstalling(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => void handleInstall(), className: className, disabled: isInstalling, children: isInstalling ? busyLabel : label }), showManualInstallHint && manualInstallHint && (_jsx("div", { className: "modal-overlay install-hint-overlay", children: _jsxs("div", { className: "card modal-card install-hint-card max-w-md", children: [_jsx("p", { className: "section-kicker", children: "Install" }), _jsx("h2", { className: "mt-3 text-3xl font-bold tracking-tight", children: manualInstallHint.title }), _jsx("p", { className: "mt-3 text-sm leading-6 text-black/60", children: "Add MyBand to your home screen to open it like an app and keep the browser chrome out of the way." }), _jsx("div", { className: "mt-6 space-y-3 rounded-[24px] border border-black/10 bg-white/70 px-5 py-5", children: manualInstallHint.steps.map((step, index) => (_jsxs("p", { className: "text-sm leading-6 text-black/70", children: [_jsxs("span", { className: "mr-2 font-semibold text-black", children: [index + 1, "."] }), step] }, step))) }), _jsx("div", { className: "mt-6 flex justify-end max-sm:justify-stretch", children: _jsx("button", { type: "button", onClick: () => setShowManualInstallHint(false), className: "btn-secondary max-sm:w-full", children: "Close" }) })] }) }))] }));
}
//# sourceMappingURL=InstallAppButton.js.map