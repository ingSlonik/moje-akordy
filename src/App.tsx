import { Link, RouterProvider, useRouter } from "easy-page-router/react";
import PageRouter from "./Router";

import { init } from "easy-analytics/client";

init("https://paulu.cz/api/easy-analytics");

/*
const logo64 = new URL(
    "/public/icon.png?as=webp&width=64&height=64",
    import.meta.url,
);
const logo128 = new URL(
    "/public/icon.png?as=webp&width=128&height=128",
    import.meta.url,
);
const logo192 = new URL(
    "/public/icon.png?as=webp&width=192&height=192",
    import.meta.url,
);
*/

function Nav() {
    const { path } = useRouter();
    if (path[0] === "admin") return null;

    return <nav>
        <div className="content">
            <Link to="/">
                <span className="logo" />
                <span>Fílův zpěvník</span>
            </Link>
            <Link className="admin-button" to="/admin">Udělat změny</Link>
        </div>
    </nav>;
}

export default function App() {
    return <RouterProvider>
        <Nav />
        <PageRouter />
    </RouterProvider>;
}

// Fix iOS safari issus with viewport
if (global.window && global.document) { // only for browser
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
