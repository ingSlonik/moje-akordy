import { useMemo, useState } from "react";
import { Link } from "easy-page-router/react";

import Ranking from "./Ranking";

import { Song } from "../../types";

export default function SongTable(props: { songs: Song[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<Array<"song" | "poem">>(["song"]);

  const songs = useMemo(() => {
    let songs = props.songs
      .filter((song) => type.includes(song.type))
      .map((s) => ({
        ...s,
        search: removeDiacritic(`${s.title} ${s.artist} ${s.bookTitle}`.toLocaleLowerCase()),
      }));

    if (search) {
      const searchWords = removeDiacritic(search.toLocaleLowerCase()).split(" ");
      for (const word of searchWords) {
        songs = songs.filter((song) => song.search.includes(word));
      }
    }

    return songs
      .sort((a, b) => b.rating - a.rating);
  }, [props.songs, search, type]);

  function handleType(typ: "song" | "poem") {
    if (type.includes(typ)) {
      setType(type.filter((t) => t !== typ));
    } else {
      setType([...type, typ]);
    }
  }

  return (
    <>
      <label>
        Píseň
        <input type="checkbox" checked={type.includes("song")} onChange={() => handleType("song")} />
      </label>
      <label>
        Báseň
        <input type="checkbox" checked={type.includes("poem")} onChange={() => handleType("poem")} />
      </label>

      <input
        type="text"
        placeholder="Hledat dle názvu a autora..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Umělec</th>
            <th>Umím</th>
            <th>Typ</th>
          </tr>
        </thead>
        <tbody>
          {songs.length < 1 && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center" }}>
                To co hledáš tu není...
              </td>
            </tr>
          )}
          {songs.map((song, i) => (
            <tr key={i}>
              <td>
                <Link to={song.type === "song" ? `/${song.file}` : `/${song.file}/${encodeURIComponent(song.title)}`}>
                  {song.title}
                  {song.bookTitle && ` (${song.bookTitle})`}
                </Link>
              </td>
              <td>{song.artist}</td>
              <td>
                <Ranking ranking={song.rating} />
              </td>
              <td>{song.type === "song" ? "Píseň" : "Báseň"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function removeDiacritic(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
