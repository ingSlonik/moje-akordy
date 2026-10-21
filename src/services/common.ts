import { useHeaders } from "ssr-hook";
import { useTitle } from "easy-page-router/react";

type UseHeadProps = {
    title: string;
    description: string;
    image?: string;
    canonical?: string;
    lang?: string;
};

export function useHead({ title, description, image, canonical, lang }: UseHeadProps) {
    let resolvedImage = image || "";
        resolvedImage = image || (typeof window !== "undefined" ? window.location.origin + "/images/logo.png?h=256" : "/images/logo.png?h=256");
    
    useHeaders({
        title,
        description,
        image: resolvedImage,
        canonical: canonical || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""),
        lang,
    });
    useTitle(title);
}
