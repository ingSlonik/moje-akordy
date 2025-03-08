import { useHeaders } from "ssr-hook";
import { useTitle } from "easy-page-router/react";

export const location = process.env.NODE_ENV === "development" ? "http://localhost:1010" : "https://akordy.paulu.cz";

export function useHead({ title, description }: { title: string; description: string }) {
    useHeaders({
        lang: "cs",
        title,
        description,
        image: window.location.origin + "/logo.png",
        canonical: window.location.origin + window.location.pathname,
    });
    useTitle(title);
}
