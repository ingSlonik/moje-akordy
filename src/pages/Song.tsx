import React, { useRef } from "react";
import Song from "../components/Song";
import NextSong from "../components/NextSong";
import AutoScroll from "../components/AutoScroll";
import { useHead } from "../services/common";
import { useSSRApi } from "../services/api";

export type SongPageProps = {
    file: string;
    /** Live follow mode (rendered inside /live/<code>). */
    live?: { key?: string };
};

export default function SongPage({ file, live }: SongPageProps) {
    const refScroll = useRef<HTMLDivElement>(null);
    const decodedFile = decodeURIComponent(file);

    const [song, error, isLoading, reload] = useSSRApi.getSong({ file: decodedFile });

    const pageTitle = song
        ? `${song.title} - ${song.artist} | Fílův zpěvník`
        : "Píseň | Fílův zpěvník";

    const description = song
        ? `${song.title} - ${song.artist}\n${song.text.filter(t => t.type === "text").map(t => t.value).join("").slice(0, 120)}`
        : pageTitle;

    useHead({
        title: pageTitle,
        description,
    });

    return (
        <>
            {song && song.scrollSpeed > 0 && (
                <AutoScroll
                    key={song.file}
                    speed={song.scrollSpeed}
                    refScroll={refScroll}
                />
            )}
            <main ref={refScroll} className="page-song">
                <div className="content">
                    {isLoading && <p className="loading-state">Ladím kytaru a načítám píseň...</p>}
                    {error && <p className="error-state">{error.message}</p>}
                    {song && (
                        <Song
                            {...song}
                            live={live}
                            onRatingChange={() => reload()}
                        />
                    )}
                </div>
            </main>
            {!live && <NextSong type="poem" />}
        </>
    );
}
