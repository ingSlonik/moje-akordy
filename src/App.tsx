import React from "react";

import PageRouter, { Link } from "./Router";

export default function App() {
    return <>
        <nav>
            <div className="content">
                <Link to="/">
                    <span className="logo" />
                    <span>Fílův zpěvník</span>
                </Link>
            </div>
        </nav>

        <PageRouter />
    </>;
}