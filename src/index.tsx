import React from "react";
import { createRoot } from "react-dom/client";
import { hydrateRoot } from "react-dom/client";
import { handleError } from "./services/api";

import App from "./App";
import "./styles.css";

// Fix iOS safari issues with viewport
if (typeof window !== "undefined" && typeof document !== "undefined") {
    const updateViewport = () => {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            if (window.screen.width <= 600) {
                metaViewport.setAttribute('content', 'width=600, user-scalable=no');
            } else {
                metaViewport.setAttribute('content', 'width=device-width');
            }
        }
    }
    updateViewport();
    window.addEventListener('resize', updateViewport);
}
const rootElement = document.getElementById("root") as HTMLElement;

if (process.env.NODE_ENV === "development") {
    // We use createRoot because we often don't want to deal with full SSR hydration quirks 
    // during local frontend development (like Hot Module Replacement causing mismatches).
    createRoot(rootElement).render(<App />);
} else {
    // In production, the HTML is pre-rendered by the Express server.
    // hydrateRoot attaches React event listeners to the existing HTML without recreating it,
    // making the initial load much faster and seamless.
    hydrateRoot(rootElement, <App />, {
        onCaughtError: handleError,
        onUncaughtError: handleError,
        onRecoverableError: handleError,
    });
}
