import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import process from "node:process";

import App from "./App.tsx";

const rootElement = document.getElementById("root") as HTMLElement;

if (process.env.NODE_ENV === "development") {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  hydrateRoot(rootElement, <App />);
}
