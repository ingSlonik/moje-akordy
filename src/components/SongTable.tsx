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
      <div className="filter-row">
        <label className="chip-wrapper" style={{ margin: 0 }}>
          <input 
            type="checkbox" 
            className="chip-input"
            checked={type.includes("song")} 
            onChange={() => handleType("song")} 
          />
          <span className="chip-label">Písně</span>
        </label>
        
        <label className="chip-wrapper" style={{ margin: 0 }}>
          <input 
            type="checkbox" 
            className="chip-input"
            checked={type.includes("poem")} 
            onChange={() => handleType("poem")} 
          />
          <span className="chip-label">Básně</span>
        </label>
      </div>

      <div className="search-container">
        <svg className="search-icon" xmlns="http://www.w3.org/000000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Hledat dle názvu a autora..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
              <td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>
                To co hledáš tu není...
              </td>
            </tr>
          )}
          {songs.map((song, i) => (
            <tr key={i}>
              <td>
                <Link to={song.type === "song" ? `/${song.file}` : `/${song.file}/${encodeURIComponent(song.title)}`}>
                  {song.title}
                  {song.bookTitle && <span className="book-title">{song.bookTitle}</span>}
                </Link>
              </td>
              <td style={{ color: "var(--color-text-muted)" }}>{song.artist}</td>
              <td>
                <Ranking ranking={song.rating} />
              </td>
              <td>
                <span className={`type-badge type-${song.type}`}>
                  {song.type === "song" ? "Píseň" : "Báseň"}
                </span>
              </td>
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
