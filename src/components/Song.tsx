import React, { useState } from "react";
import { Link, useRouter } from "easy-page-router/react";
import { useUser } from "easy-user-auth/react";
import Ranking, { getEffectiveSongRating } from "./Ranking";
import ShareModal from "./ShareModal";
import { api } from "../services/api";
import { SongDetail, SongToken, UserProfile } from "../../types";

const chords = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B", "H"];

export type SongProps = SongDetail & {
    onRatingChange?: (newRating: number) => void;
    showActions?: boolean;
};

export default function Song(props: SongProps) {
    const {
        file,
        title,
        artist,
        text,
        authorId,
        authorName,
        onRatingChange,
        showActions = true,
    } = props;

    const { searchParams } = useRouter();
    const { isLoggedIn, userId, user, showUserDialog } = useUser<UserProfile>();
    const [localRating, setLocalRating] = useState<number | undefined>(undefined);
    const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

    const effectiveRating = localRating !== undefined
        ? localRating
        : getEffectiveSongRating(props, userId, isLoggedIn);

    const basicChord = getBasicChord(text);

    // Honor initial key from URL parameter (?key=... or ?chord=...) if present
    const initialChord = (() => {
        const paramKey = searchParams?.key || searchParams?.chord;
        if (paramKey && chords.includes(paramKey)) {
            return paramKey;
        }
        return basicChord;
    })();

    const [transposition, setTransposition] = useState(initialChord);

    function handleTranspositionChange(newChord: string) {
        setTransposition(newChord);
        if (typeof window !== "undefined" && window.history) {
            try {
                const url = new URL(window.location.href);
                if (newChord === basicChord) {
                    url.searchParams.delete("key");
                    url.searchParams.delete("chord");
                } else {
                    url.searchParams.set("key", newChord);
                }
                const newPath = url.pathname + (url.search ? url.search : "");
                window.history.replaceState(null, "", newPath);
            } catch {
                // Ignore URL parsing errors
            }
        }
    }

    const transpositionShift = chords.indexOf(transposition) - chords.indexOf(basicChord);
    const basicTransposedChord = getTransposedChord(basicChord, transpositionShift);

    async function handleRate(newRating: number) {
        if (!isLoggedIn) {
            showUserDialog();
            return;
        }

        setLocalRating(newRating);
        onRatingChange?.(newRating);

        const [res, err] = await api.updateSongRating({ file, rating: newRating });
        if (err) {
            console.error("Failed to update rating:", err);
        } else if (res) {
            setLocalRating(res.rating);
        }
    }

    const canEdit = isLoggedIn && (authorId === userId || user?.role === "admin");

    return (
        <article className="song-detail-card">
            <h1 className="title">{title}</h1>

            <div className="song-meta">
                <h2 className="artist">{artist}</h2>

                <div className="song-author-badge">
                    <span>Přidal:</span>
                    <strong>{authorName || "Fíla"}</strong>
                </div>

                <div className="song-rating-badge">
                    <span className="rating-label">Umím:</span>
                    <Ranking
                        ranking={effectiveRating}
                        interactive
                        onChange={handleRate}
                    />
                </div>

                {showActions && (
                    <button
                        type="button"
                        onClick={() => setIsShareOpen(true)}
                        className="btn-share-inline"
                        title="Sdílet píseň a QR kód"
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
                )}

                {showActions && canEdit && (
                    <Link href={`/editor/${file}`} className="btn-edit-inline">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="icon-inline-svg"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Upravit píseň
                    </Link>
                )}
            </div>

            <div className="transposition-control">
                <span className="transposition-label">Transpozice akordů:</span>
                <div className="chords-buttons">
                    {chords.map((chord) => {
                        const isActive = chord === basicTransposedChord;
                        return (
                            <button
                                type="button"
                                key={chord}
                                className={`chord-btn ${isActive ? "active" : ""}`}
                                onClick={() => handleTranspositionChange(chord)}
                            >
                                {chord}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="song-body song">
                {text.map((token, i) => {
                    if (token.type === "tab") {
                        return <pre key={i} className="tab">{token.value}</pre>;
                    } else if (token.type === "chord") {
                        let chord = token.value;
                        if (chord.startsWith("A#")) chord = "B" + chord.substring(2);
                        return <sup key={i}>{getTransposedChord(chord, transpositionShift)}</sup>;
                    } else if (token.type === "comment") {
                        return <span key={i} className="comment">{token.value}</span>;
                    } else if (token.type === "text") {
                        return token.value;
                    } else {
                        return null;
                    }
                })}
            </div>

            {showActions && (
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    file={file}
                    title={title}
                    artist={artist}
                    currentKey={transposition}
                    defaultKey={basicChord}
                />
            )}
        </article>
    );
}

function getBasicChord(tokens: SongToken[]) {
    const firstChordToken = tokens.find((t) => t.type === "chord");
    if (!firstChordToken) return "C";

    const chordBase = getChordBase(firstChordToken.value);
    if (chords.includes(chordBase)) {
        return chordBase;
    }

    return "C";
}

function getTransposedChord(chord: string, transpositionShift: number): string {
    if (chord.includes("/")) {
        return chord
            .split("/")
            .map((c) => getTransposedChord(c, transpositionShift))
            .join("/");
    }
    const isSharp = chord.charAt(1) === "#";
    const chordBase = chord.substring(0, isSharp ? 2 : 1);

    let index = chords.indexOf(chordBase);
    if (index === -1) return chord;

    index = (index + transpositionShift + chords.length) % chords.length;
    return chords[index] + chord.substring(isSharp ? 2 : 1);
}

function getChordBase(chord: string) {
    const isSharp = chord.charAt(1) === "#";
    return chord.substring(0, isSharp ? 2 : 1);
}
