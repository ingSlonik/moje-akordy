import React from "react";
import { Link } from "easy-page-router/react";
import { useHead } from "../services/common";

export default function NotFound() {
    useHead({
        title: "404 - Stránka nenalezena | Fílův zpěvník",
        description: "Požadovaná píseň nebo stránka nebyla nalezena.",
    });

    return (
        <main className="page-not-found">
            <div className="content">
                <div className="not-found-card">
                    <span className="not-found-code">404</span>
                    <h1>Tuhle píseň ještě nikdo nesložil...</h1>
                    <p>
                        Zdá se, že stránka, kterou hledáte, se někde zatoulala. Zkuste se podívat do seznamu
                        všech písní a básní na úvodní stránce.
                    </p>
                    <Link href="/" className="btn-primary btn-home">
                        ← Zpět na úvodní stránku
                    </Link>
                </div>
            </div>
        </main>
    );
}
