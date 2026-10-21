import React from "react";
import { Link, useRouter } from "easy-page-router/react";
import { Img } from "./Img";

export default function Footer() {
    const { path } = useRouter();

    // Do not show main website footer inside the admin panel (admin has its own footer)
    if (path[0] === "admin") {
        return null;
    }

    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="content footer-inner">
                <div className="footer-brand">
                    <Link href="/" className="footer-brand-link">
                        <Img src="/images/logo.png" w={28} h={28} alt="Logo" className="footer-logo" />
                        <span className="footer-brand-title">Fílův zpěvník</span>
                    </Link>
                    <span className="footer-divider" aria-hidden="true">•</span>
                    <span className="footer-tagline">Osobní zpěvník s akordy bez reklam</span>
                </div>

                <div className="footer-credits">
                    <span className="footer-credit-text">
                        Vyrobil{" "}
                        <a
                            href="https://paulu.cz/"
                            target="_blank"
                            rel="noopener"
                            className="footer-author-link"
                            title="Filip Paulů – paulu.cz"
                        >
                            <span className="footer-author-name">Filip</span>
                            <span className="footer-author-domain">paulu.cz</span>
                            <svg
                                className="footer-external-icon"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M7 17L17 7" />
                                <path d="M7 7h10v10" />
                            </svg>
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}
