import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type Actions = {
    push: (to: string) => void,
    back: () => void,
    forward: () => void,
};

export type PageState = "active" | "back" | "forward";

export type PageProps = {
    pageKey: string,
    href: string,
    path: string[],
    searchParams: Record<string, string>,
    state: PageState,
};

type RouterHistory = {
    index: number,
    pages: {
        pageKey: string,
        href: string,
    }[],
};

const defaultPage = {
    pageKey: new Date().toISOString(),
    href: window.location.href,
}

const defaultHistory: RouterHistory = {
    index: 0,
    pages: [ defaultPage ],
}


const defaultRouterContext: RouterHistory & Actions = {
    ...defaultHistory,
    push: () => {},
    back: () => {},
    forward: () => {},
};

const PageContext = createContext(getPageProps(defaultPage.pageKey, defaultPage.href, 0, 0));

const RouterContext = createContext(defaultRouterContext);


export function RouterProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState(defaultHistory);

    const { push, back, forward } = useMemo(() => {
        const push = (to: string) => {
            window.history.pushState({ to }, "", to);

            setHistory(history => {
                const origin = window.location.origin;
                const newHref = origin + to;

                const actualPage = history.pages[history.index];

                if (newHref === actualPage.href) return history;

                // remove forwarded pages
                const pages = history.pages.slice(history.index);

                const newPage = {
                    pageKey: new Date().toISOString(),
                    href: newHref,
                };

                return {
                    index: 0,
                    pages: [ newPage, ...pages ],
                };
            });
        };
        const back = () => {
            setHistory(history => {
                let index = history.index + 1;
                if (index >= history.pages.length) index = history.pages.length - 1;

                return {
                    ...history,
                    index,
                };
            });
        };
        const forward = () => {
            setHistory(history => {
                let index = history.index - 1;
                if (index < 0) index = 0;

                return {
                    ...history,
                    index,
                };
            });
        };

        return { push, back, forward };
    }, []);

    useEffect(() => {
        function popState() {
            // TODO: check forward button
            back();
        }
        function hashChange() {
            push(window.location.pathname + window.location.search);
        }

        window.addEventListener('popstate', popState);
        window.addEventListener('hashchange', hashChange);

        return () => {
            window.removeEventListener("popstate", popState);
            window.removeEventListener("hashchange", hashChange);
        };
    }, []);

    return <RouterContext.Provider value={{ ...history, push, back, forward }}>
        {children}
    </RouterContext.Provider>
}

export type RenderAnimationProps = PageProps & { page: ReactNode };

export type RouterProps = {
    renderPage: (props: PageProps) => ReactNode,
    renderAnimation?: (props: RenderAnimationProps) => ReactNode,
};

export function Router({ renderPage, renderAnimation }: RouterProps) {
    const { index, pages } = useContext(RouterContext);

    const Page = renderPage;
    const Animation = renderAnimation;

    if (Animation) {
        return <>
            {pages.map((page, i) => {
                const pageProps = getPageProps(page.pageKey, page.href, i, index);
    
                return <PageContext.Provider 
                    key={page.pageKey} 
                    value={pageProps}
                >
                    <Animation {...pageProps} page={<Page {...pageProps} />} />
                </PageContext.Provider>;
            })}
        </>;
    } else {

        const activePage = pages[index];
        const pageProps = getPageProps(activePage.pageKey, activePage.href, index, index);

        return <PageContext.Provider value={pageProps}>
            <Page {...pageProps} />
        </PageContext.Provider>;
    }
}

export type LinkProps = {
    to: string,
    className?: string,
    children: React.ReactNode,
}
export function Link({ to, className, children }: LinkProps) {
    const { push } = useContext(RouterContext);

    return <a href={to} className={className} onClick={e => {
        e.preventDefault();
        push(to);
    }}>{children}</a>;
}


export type RouterHook = PageProps & Actions;

export function useRouter(): RouterHook {
    const { push, back, forward} = useContext(RouterContext);
    const pageProps = useContext(PageContext);

    return { ...pageProps, push, back, forward };
}

function getPageProps(pageKey: string, href: string, index: number, actualIndex: number): PageProps {
    const url = new URL(href);

    return {
        pageKey,
        href,
        path: url.pathname.split("/").map(p => decodeURIComponent(p)).filter(Boolean),
        searchParams: Object.fromEntries(url.searchParams),
        state: index === actualIndex ? "active" : index > actualIndex ? "back" : "forward",
    };
}
