import Link from 'next/link'

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "404 | Fílův zpěvník",
    description: "404 | Píseň nenalezena | Fílův zpěvník",
};

export default function NotFound() {
    return <main>
        <h1>404 | Píseň nenalezena</h1>
        <p><Link href="/">Seznam písní</Link></p>
    </main>;
}
