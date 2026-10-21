import React, { useState } from "react";
import NextSong from "../components/NextSong";
import ShareModal from "../components/ShareModal";
import { useHead } from "../services/common";
import { useSSRApi } from "../services/api";

export type PoemPageProps = {
    file: string;
    title: string;
};

export default function PoemPage({ file, title }: PoemPageProps) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const decodedFile = decodeURIComponent(file);
    const decodedTitle = decodeURIComponent(title);

    const [poem, error, isLoading] = useSSRApi.getPoem({ file: decodedFile, title: decodedTitle });

    const pageTitle = poem
        ? `${poem.title} - ${poem.artist} (${poem.bookTitle}) | Fílův zpěvník`
        : "Báseň | Fílův zpěvník";

    useHead({
        title: pageTitle,
        description: poem
            ? `${poem.title} - ${poem.artist} (${poem.bookTitle})\n${poem.text.slice(0, 100)}`
            : pageTitle,
    });

    return (
        <>
            <main className="page-poem">
                <div className="content">
                    {isLoading && <p className="loading-state">Otevírám sbírku a načítám báseň...</p>}
                    {error && <p className="error-state">{error.message}</p>}
                    {poem && (
                        <article className="poem-card">
                            <h1 className="title">{poem.title}</h1>
                            {poem.bookTitle && <div className="book-title">{poem.bookTitle}</div>}
                            <h2 className="artist">{poem.artist}</h2>

                            <div className="poem-meta">
                                <span className="author-badge">
                                    Přidal: <strong>{poem.authorName || "Fíla"}</strong>
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setIsShareOpen(true)}
                                    className="btn-share-inline"
                                    title="Sdílet báseň a QR kód"
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="icon-inline-svg"
                                    >
                                        <circle cx="18" cy="5" r="3" />
                                        <circle cx="6" cy="12" r="3" />
                                        <circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                    Sdílet
                                </button>
                            </div>

                            <p className="poem-body">{poem.text}</p>

                            <ShareModal
                                isOpen={isShareOpen}
                                onClose={() => setIsShareOpen(false)}
                                file={`${file}/${encodeURIComponent(title)}`}
                                title={poem.title}
                                artist={poem.artist || "Báseň"}
                            />
                        </article>
                    )}
                </div>
            </main>
            <NextSong type="song" />
        </>
    );
}
