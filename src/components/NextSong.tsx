import React from "react";
import { Link } from "../../easy-router";

import { useSongs } from "../../services/hooks";

export default function NextSong({ type }: { type: "song" | "poem" }) {
    const songs = useSongs();

    if (!songs || songs instanceof Error)
        return null;

    // Filter songs based on type
    const filteredSongs = songs.filter(song => song.type === type);

    // Check if there are any songs
    if (filteredSongs.length === 0) {
        return null;
    }

    // Get a random index within the filtered array
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);

    // Get the random song
    const song = filteredSongs[randomIndex];

    return <Link
        className="next-song"
        to={song.type === "song" ? `/${song.file}` : `/${song.file}/${encodeURIComponent(song.title)}`}
    >
        {"⇨ "}
        {song.title}
        {song.bookTitle && ` (${song.bookTitle})`}
    </Link>;
}