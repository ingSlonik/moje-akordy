import React from "react";
import { createRoot, hydrateRoot } from 'react-dom/client';

import App from "./App";

const rootElement = document.getElementById('root') as HTMLElement;
const initialChildren = <React.StrictMode>
    <App />
</React.StrictMode>;

if (process.env.NODE_ENV === "development") {
    createRoot(rootElement).render(initialChildren);
} else {
    hydrateRoot(rootElement, initialChildren);
}