import { Link } from "easy-page-router/react";
import { useHead } from "../../services/common";

export default function NotFoundPage() {
    useHead({
        title: "Píseň nenalezena | Fílův zpěvník",
        description: "Osobní zpěvník Fíly! Obsahuje jak písně s akordy tak proložní básničkama. Je úplně bez reklam! A má auto scroll!"
    });

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
