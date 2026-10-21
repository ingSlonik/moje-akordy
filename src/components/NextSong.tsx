import React, { useMemo } from "react";
import { Link } from "easy-page-router/react";
import { useSSRApi } from "../services/api";

export type NextSongProps = {
    type: "song" | "poem";
};

export default function NextSong({ type }: NextSongProps) {
    const [songs] = useSSRApi.getSongs({});

    const randomSong = useMemo(() => {
        if (!songs || songs.length === 0) return null;
        const filtered = songs.filter((s) => s.type === type);
        if (filtered.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * filtered.length);
        return filtered[randomIndex];
    }, [songs, type]);

    if (!randomSong) return null;

    const href = randomSong.type === "song"
        ? `/${randomSong.file}`
        : `/${randomSong.file}/${encodeURIComponent(randomSong.title)}`;

    return (
        <div className="next-song-container">
            <Link href={href} className="next-song">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="next-song-icon"
                >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </svg>
                <span>
                    {type === "song" ? "Další náhodná píseň: " : "Náhodná báseň pro radost: "}
                    <strong>{randomSong.title}</strong>
                    {randomSong.bookTitle ? ` (${randomSong.bookTitle})` : ` - ${randomSong.artist}`}
                </span>
            </Link>
        </div>
    );
}
