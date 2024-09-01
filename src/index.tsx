import React from "react";
import { createRoot, hydrateRoot } from 'react-dom/client';

import App from "./App";

const rootElement = document.getElementById('root') as HTMLElement;

if (process.env.NODE_ENV === "development") {
    createRoot(rootElement).render(<React.StrictMode>
        <App />
    </React.StrictMode>);
} else {
    hydrateRoot(rootElement, <App />);
}