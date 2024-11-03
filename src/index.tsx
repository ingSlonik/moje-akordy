// deno-lint-ignore-file no-process-globals
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import App from "./App.tsx";

const rootElement = document.getElementById("root") as HTMLElement;

declare global {
  // deno-lint-ignore no-explicit-any
  const process: any;
}

if (process.env.NODE_ENV === "development") {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  hydrateRoot(rootElement, <App />);
}
