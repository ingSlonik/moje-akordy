import React from "react";

import { Link } from "@/Router";

export default function NotFoundPage() {
    return <main>
        <h1>404 | Píseň nenalezena</h1>
        <p><Link to="/">Seznam písní</Link></p>
    </main>;
}