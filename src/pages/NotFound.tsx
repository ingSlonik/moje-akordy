import { Link } from "../../easy-router/index.tsx";

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
