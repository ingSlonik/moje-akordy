import React from "react";

import PageRouter, { Link } from "./Router";

const logo64 = new URL('/public/icon.png?as=webp&width=64&height=64', import.meta.url);
const logo128 = new URL('/public/icon.png?as=webp&width=128&height=128', import.meta.url);
const logo192 = new URL('/public/icon.png?as=webp&width=192&height=192', import.meta.url);

export default function App() {
    return <>
        <nav>
            <div className="content">
                <Link to="/">
                    <img
                        alt="Logo | Fílův zpěvník"
                        src={logo64.href} srcSet={`${logo192.href} 3x, ${logo128.href} 2x, ${logo64.href} 1x`}
                    />
                    {/* <span className="logo" /> */}
                    <span>Fílův zpěvník</span>
                </Link>
            </div>
        </nav>

        <PageRouter />
    </>;
}