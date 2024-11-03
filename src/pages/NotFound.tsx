import { Link } from "../../easy-router/index.tsx";

export default function NotFoundPage() {
    return (
        <main>
            <h1>404 | Píseň nenalezena</h1>
            <p>
                <Link to="/">Seznam písní</Link>
            </p>
        </main>
    );
}
