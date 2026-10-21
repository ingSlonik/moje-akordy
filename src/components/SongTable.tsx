import React, { useMemo, useState } from "react";
import { Link } from "easy-page-router/react";
import { useUser } from "easy-user-auth/react";
import Ranking, { getEffectiveSongRating } from "./Ranking";
import { api } from "../services/api";
import { Song, UserProfile } from "../../types";

export type SongTableProps = {
    songs: Song[];
};

export default function SongTable({ songs }: SongTableProps) {
    const { isLoggedIn, userId, user, showUserDialog } = useUser<UserProfile>();

    const [search, setSearch] = useState("");
    const [types, setTypes] = useState<Array<"song" | "poem">>(["song"]);
    const [onlyMine, setOnlyMine] = useState(false);
    const [localRatings, setLocalRatings] = useState<Record<string, number>>({});

    function handleToggleType(type: "song" | "poem") {
        if (types.includes(type)) {
            // Keep at least one type active or allow both
            if (types.length > 1) {
                setTypes(types.filter((t) => t !== type));
            } else {
                setTypes(type === "song" ? ["poem"] : ["song"]);
            }
        } else {
            setTypes([...types, type]);
        }
    }

    async function handleRateSong(file: string, newRating: number) {
        if (!isLoggedIn) {
            showUserDialog();
            return;
        }

        setLocalRatings((prev) => ({ ...prev, [file]: newRating }));
        const [res, err] = await api.updateSongRating({ file, rating: newRating });
        if (err) {
            console.error("Failed to update song rating:", err);
        } else if (res) {
            setLocalRatings((prev) => ({ ...prev, [file]: res.rating }));
        }
    }

    const filteredSongs = useMemo(() => {
        let list = (songs || []).filter((s) => types.includes(s.type));

        if (isLoggedIn && onlyMine && userId) {
            list = list.filter((s) => s.authorId === userId);
        }

        if (search.trim()) {
            const searchWords = removeDiacritics(search).split(/\s+/).filter(Boolean);
            list = list.filter((s) => {
                const combined = removeDiacritics(
                    `${s.title} ${s.artist} ${s.bookTitle || ""} ${s.authorName || ""}`
                );
                return searchWords.every((word) => combined.includes(word));
            });
        }

        return [...list].sort((a, b) => {
            const ratingA = localRatings[a.file] !== undefined
                ? localRatings[a.file]
                : getEffectiveSongRating(a, userId, isLoggedIn);
            const ratingB = localRatings[b.file] !== undefined
                ? localRatings[b.file]
                : getEffectiveSongRating(b, userId, isLoggedIn);

            if (ratingB !== ratingA) {
                return ratingB - ratingA;
            }
            return a.title.localeCompare(b.title, "cs");
        });
    }, [songs, types, onlyMine, isLoggedIn, userId, search, localRatings]);

    return (
        <div className="song-table-wrapper">
            <div className="filter-row">
                <div className="chips-group">
                    <label className={`chip-badge ${types.includes("song") ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={types.includes("song")}
                            onChange={() => handleToggleType("song")}
                        />
                        <span>Písně</span>
                    </label>

                    <label className={`chip-badge ${types.includes("poem") ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={types.includes("poem")}
                            onChange={() => handleToggleType("poem")}
                        />
                        <span>Básně</span>
                    </label>

                    {isLoggedIn && (
                        <label className={`chip-badge mine-chip ${onlyMine ? "active" : ""}`}>
                            <input
                                type="checkbox"
                                checked={onlyMine}
                                onChange={(e) => setOnlyMine(e.target.checked)}
                            />
                            <span>Moje písně</span>
                        </label>
                    )}
                </div>

                <div className="table-actions">
                    <Link href="/editor" className="btn-add-song">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="icon-inline-svg"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Přidat píseň
                    </Link>
                </div>
            </div>

            <div className="search-container">
                <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <input
                    type="text"
                    placeholder="Hledat podle názvu, umělce či autora..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="song-table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Název</th>
                            <th>Umělec</th>
                            <th>Přidal</th>
                            <th>Umím</th>
                            <th>Typ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSongs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="empty-message">
                                    To, co hledáš, tu (zatím) není... Zkus hledat líp!
                                </td>
                            </tr>
                        ) : (
                            filteredSongs.map((song, i) => {
                                const effectiveRating = localRatings[song.file] !== undefined
                                    ? localRatings[song.file]
                                    : getEffectiveSongRating(song, userId, isLoggedIn);

                                const href = song.type === "song"
                                    ? `/${song.file}`
                                    : `/${song.file}/${encodeURIComponent(song.title)}`;

                                const canEdit = isLoggedIn && song.type === "song" && (
                                    song.authorId === userId || user?.role === "admin"
                                );

                                return (
                                    <tr key={`${song.type}-${song.file}-${i}`}>
                                        <td className="song-title-cell">
                                            <Link href={href} className="song-link">
                                                <span className="title-text">{song.title}</span>
                                                {song.bookTitle && (
                                                    <span className="book-subtitle">({song.bookTitle})</span>
                                                )}
                                            </Link>
                                        </td>
                                        <td className="artist-cell">{song.artist}</td>
                                        <td className="author-cell">{song.authorName || "Fíla"}</td>
                                        <td className="rating-cell">
                                            {song.type === "song" ? (
                                                <Ranking
                                                    ranking={effectiveRating}
                                                    interactive
                                                    onChange={(r) => handleRateSong(song.file, r)}
                                                />
                                            ) : (
                                                <span className="poem-dash">—</span>
                                            )}
                                        </td>
                                        <td className="type-cell">
                                            <span className={`type-badge type-${song.type}`}>
                                                {song.type === "song" ? "Píseň" : "Báseň"}
                                            </span>
                                            {canEdit && (
                                                <Link href={`/editor/${song.file}`} className="table-edit-btn" title="Upravit píseň">
                                                    Upravit
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function removeDiacritics(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
