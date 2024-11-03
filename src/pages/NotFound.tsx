import { Link } from "easy-page-router/react.js";

export default function NotFoundPage() {
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
