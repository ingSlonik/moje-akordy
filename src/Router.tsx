import React, { useEffect, useState } from "react";

import HomePage from "./pages/Home";
import SongPage from "./pages/Song";
import PoemPage from "./pages/Poem";
import NotFoundPage from "./pages/NotFound";

export default function PageRouter() {
    const { file, title } = useParams();

    if (file === "404") {
        return <NotFoundPage />;
    } else if (file && title) {
        return <PoemPage />;
    } else if (file) {
        return <SongPage />;
    } else {
        return <HomePage />;
    }
}


const listeners: ((to: string) => void)[] = [];

export function setServerRenderingHref(href: string) {
    if (href) return href;

    return window.location.href;
}

export type Params = { file: null | string, title: null | string };
export function useParams(): Params {
    const [url, setUrl] = useState(window.location.href);

    const params = url.split("/");
    const file = params[3] || null;
    const title = params[4] || null;

    useEffect(() => {
        function listener() {
            setUrl(window.location.href);
        }

        listeners.push(listener);

        window.addEventListener('popstate', listener);
        window.addEventListener('hashchange', listener);

        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1)
                listeners.splice(index, 1);

            window.removeEventListener("popstate", listener);
            window.removeEventListener("hashchange", listener);
        };
    }, []);

    return { file, title };
}

type LinkProps = {
    to: string,
    className?: string,
    children: React.ReactNode,
}
export function Link({ to, className, children }: LinkProps) {
    return <a href={to} className={className} onClick={e => {
        e.preventDefault();
        window.history.pushState({ to }, "", to);
        listeners.forEach(listener => listener(to))
    }}>{children}</a>;
}
