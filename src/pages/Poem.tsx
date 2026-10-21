import React from "react";
import NextSong from "../components/NextSong";
import { useHead } from "../services/common";
import { useSSRApi } from "../services/api";

export type PoemPageProps = {
    file: string;
    title: string;
};

export default function PoemPage({ file, title }: PoemPageProps) {
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
                            </div>

                            <p className="poem-body">{poem.text}</p>
                        </article>
                    )}
                </div>
            </main>
            <NextSong type="song" />
        </>
    );
}
