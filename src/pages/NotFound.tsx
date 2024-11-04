import { Link, useTitle } from "easy-page-router/react";

export default function NotFoundPage() {
    useTitle("Píseň nenalezena | Fílův zpěvník");

    return (
        <main>
            <div className="content">
                <h1>404 | Píseň nenalezena</h1>
                <p>
                    <Link to="/">Seznam písní</Link>
                </p>
            </div>
        </main>
    );
}
