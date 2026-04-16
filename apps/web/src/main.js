import { jsx as _jsx } from "react/jsx-runtime";
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isNativePlatform } from './lib/platform';
if (!isNativePlatform && 'serviceWorker' in navigator) {
    const registerServiceWorker = () => {
        void navigator.serviceWorker.register('/sw.js');
    };
    if (document.readyState === 'complete') {
        registerServiceWorker();
    }
    else {
        window.addEventListener('load', registerServiceWorker, { once: true });
    }
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(App, {}));
//# sourceMappingURL=main.js.map