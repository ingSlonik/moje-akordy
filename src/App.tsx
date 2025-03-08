import { Link, RouterProvider } from "easy-page-router/react";
import PageRouter from "./Router";

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

export default function App() {
    return <RouterProvider>
        <nav>
            <div className="content">
                <Link to="/">
                    {/* <img
                        alt="Logo | Fílův zpěvník"
                        src={logo64.href}
                        srcSet={`${logo192.href} 3x, ${logo128.href} 2x, ${logo64.href} 1x`}
                    /> */}
                    <span className="logo" />
                    <span>Fílův zpěvník</span>
                </Link>
                <Link className="admin-button" to="/admin">Udělat změny</Link>
            </div>
        </nav>

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
