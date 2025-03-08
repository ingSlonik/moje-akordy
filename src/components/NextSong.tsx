import { Link } from "easy-page-router/react.js";

import { useSSRHook } from "ssr-hook";
import { Song } from "../../types.js";

export default function NextSong({ type }: { type: "song" | "poem" }) {
  const [songs, error, isLoading, reload] = useSSRHook<Song[]>(`/api/songs`);

  if (!songs) {
    return null;
  }

  // Filter songs based on type
  const filteredSongs = songs.filter((song) => song.type === type);

  // Check if there are any songs
  if (filteredSongs.length === 0) {
    return null;
  }

  // Get a random index within the filtered array
  const randomIndex = Math.floor(Math.random() * filteredSongs.length);

  // Get the random song
  const song = filteredSongs[randomIndex];

  return (
    <Link
      className="next-song"
      to={song.type === "song" ? `/${song.file}` : `/${song.file}/${encodeURIComponent(song.title)}`}
    >
      {"⇨ "}
      {song.title}
      {song.bookTitle && ` (${song.bookTitle})`}
    </Link>
  );
}
