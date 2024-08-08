import { location } from "@/services/common";
import Link from "next/link";

import { Song } from "../../types";

export default async function NextSong({ type }: { type: "song" | "poem" }) {
    try {
        const res = await fetch(location + '/api/song', { cache: "no-store" });
        const songs = await res.json() as Song[];

        console.log({ songs })

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

        return <Link className="next-song" href={song.type === "song" ? `/song/${song.file}` : `/poem/${song.file}/${encodeURIComponent(song.title)}`}>
            {"⇨ "}
            {song.title}
            {song.bookTitle && ` (${song.bookTitle})`}
        </Link>;

    } catch (e) {
        return null;
    }
}