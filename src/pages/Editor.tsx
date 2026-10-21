import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "easy-page-router/react";
import { useUser } from "easy-user-auth/react";
import { api, useApi } from "../services/api";
import { useHead } from "../services/common";
import { tokenizeSongContent } from "../utils/parser";
import Ranking from "../components/Ranking";
import SongComponent from "../components/Song";
import { Song, UserProfile } from "../../types";

export type EditorProps = {
    file?: string;
};

const COMMON_CHORDS = ["C", "G", "Ami", "F", "D", "Emi", "A", "Dmi", "E", "H7"];

export default function Editor({ file }: EditorProps) {
    const { push } = useRouter();
    const { isLoggedIn, userId, user, setUser, showUserDialog } = useUser<UserProfile>();

    const [songs, error, loading, , reload] = useApi.getSongs({});

    // Author name editing state
    const [authorNameInput, setAuthorNameInput] = useState("");
    const [nameSavedNotice, setNameSavedNotice] = useState(false);

    useEffect(() => {
        if (user?.name) {
            setAuthorNameInput(user.name);
        }
    }, [user?.name]);

    // Admin filter toggle
    const [adminFilterAll, setAdminFilterAll] = useState(false);

    // Form fields
    const [selectedFile, setSelectedFile] = useState<string | null>(file || null);
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [scrollSpeed, setScrollSpeed] = useState(2000);
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");

    const [showPreview, setShowPreview] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useHead({
        title: selectedFile ? `Upravit píseň - ${title || selectedFile} | Fílův zpěvník` : "Přidat novou píseň | Fílův zpěvník",
        description: "Editor písní a správa osobního zpěvníku.",
    });

    // Sync selected file when props change
    useEffect(() => {
        setSelectedFile(file || null);
    }, [file]);

    // Load song details when selectedFile changes
    useEffect(() => {
        if (!selectedFile) {
            setTitle("");
            setArtist("");
            setScrollSpeed(2000);
            setRating(0);
            setContent("");
            return;
        }

        async function loadSong() {
            if (!selectedFile) return;
            const [detail, err] = await api.getSong({ file: selectedFile });
            if (err) {
                setFeedback({ type: "error", text: "Nepodařilo se načíst detaily písně." });
            } else if (detail) {
                setTitle(detail.title);
                setArtist(detail.artist);
                setScrollSpeed(detail.scrollSpeed);
                setRating(detail.rating);
                setContent(detail.content);
            }
        }

        loadSong();
    }, [selectedFile]);

    // Filter editable songs
    const editableSongs = useMemo(() => {
        if (!songs) return [];
        return songs.filter((s) => {
            if (s.type !== "song") return false;
            if (user?.role === "admin" && adminFilterAll) return true;
            return s.authorId === userId;
        });
    }, [songs, userId, user?.role, adminFilterAll]);

    function handleSelectSong(fileSlug: string) {
        setSelectedFile(fileSlug);
        setFeedback(null);
        push(`/editor/${fileSlug}`);
    }

    function handleNewSong() {
        setSelectedFile(null);
        setTitle("");
        setArtist("");
        setScrollSpeed(2000);
        setRating(0);
        setContent("");
        setFeedback(null);
        push("/editor");
    }

    function handleInsertText(insertSnippet: string) {
        const textarea = textareaRef.current;
        if (!textarea) {
            setContent((prev) => prev + insertSnippet);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = content.slice(0, start);
        const after = content.slice(end);

        const newContent = before + insertSnippet + after;
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            const newCursor = start + insertSnippet.length;
            textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
    }

    function handleSaveAuthorName(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = authorNameInput.trim();
        if (!trimmed || !user) return;

        setUser({ ...user, name: trimmed });
        setNameSavedNotice(true);
        setTimeout(() => setNameSavedNotice(false), 2500);
        reload();
    }

    async function handleSaveSong(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !artist.trim()) {
            setFeedback({ type: "error", text: "Zadejte název i interpreta písně." });
            return;
        }

        setSaving(true);
        setFeedback(null);

        if (selectedFile) {
            const [success, err] = await api.updateSong({
                file: selectedFile,
                title: title.trim(),
                artist: artist.trim(),
                scrollSpeed,
                content,
                rating,
            });

            setSaving(false);
            if (err) {
                setFeedback({ type: "error", text: `Chyba při ukládání: ${err}` });
            } else {
                setFeedback({ type: "success", text: "Píseň byla úspěšně upravena!" });
                reload();
            }
        } else {
            const [result, err] = await api.addSong({
                title: title.trim(),
                artist: artist.trim(),
                scrollSpeed,
                content,
                rating,
            });

            setSaving(false);
            if (err) {
                setFeedback({ type: "error", text: `Chyba při vytváření: ${err}` });
            } else if (result) {
                setFeedback({ type: "success", text: "Nová píseň byla úspěšně přidána!" });
                setSelectedFile(result.file);
                reload();
                push(`/editor/${result.file}`);
            }
        }
    }

    async function handleDeleteSong() {
        if (!selectedFile) return;
        if (!window.confirm(`Opravdu chcete smazat píseň „${title || selectedFile}“?`)) return;

        setSaving(true);
        const [success, err] = await api.removeSong({ file: selectedFile });
        setSaving(false);

        if (err) {
            setFeedback({ type: "error", text: `Chyba při mazání: ${err}` });
        } else {
            setFeedback({ type: "success", text: "Píseň byla smazána." });
            handleNewSong();
            reload();
        }
    }

    const previewTokens = useMemo(() => tokenizeSongContent(content), [content]);

    if (!isLoggedIn) {
        return (
            <main className="editor-login-guard">
                <div className="content">
                    <div className="auth-card">
                        <div className="auth-card-icon">🎸</div>
                        <h1>Vítejte v editoru písní!</h1>
                        <p>
                            Přihlaste se nebo si zdarma vytvořte účet, abyste si mohli do zpěvníku ukládat své vlastní písně,
                            upravovat akordy a nastavovat hodnocení „Umím“.
                        </p>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={showUserDialog}
                        >
                            Přihlásit se / Registrovat
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className="editor-layout">
            <aside className="editor-sidebar">
                <div className="sidebar-section author-profile-box">
                    <span className="profile-label">Jméno autora u písní:</span>
                    <form onSubmit={handleSaveAuthorName} className="author-name-form">
                        <input
                            type="text"
                            value={authorNameInput}
                            onChange={(e) => setAuthorNameInput(e.target.value)}
                            placeholder="Vaše jméno nebo přezdívka"
                            className="input-author-name"
                        />
                        <button type="submit" className="btn-save-name">
                            Uložit
                        </button>
                    </form>
                    {nameSavedNotice && <span className="saved-indicator">✓ Jméno uloženo</span>}
                </div>

                <div className="sidebar-section sidebar-nav-header">
                    <button
                        type="button"
                        className="btn-new-song"
                        onClick={handleNewSong}
                    >
                        + Nová píseň
                    </button>

                    {user?.role === "admin" && (
                        <div className="admin-toggle-wrapper">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={adminFilterAll}
                                    onChange={(e) => setAdminFilterAll(e.target.checked)}
                                />
                                <span>Všechny písně (Admin)</span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="sidebar-song-list">
                    <h3>{adminFilterAll ? "Všechny písně ve zpěvníku" : "Vaše písně"}</h3>
                    {loading && <p className="loading-small">Načítám písně...</p>}
                    {editableSongs.length === 0 && !loading && (
                        <p className="empty-small">Zatím jste nepřidali žádnou píseň.</p>
                    )}
                    <ul>
                        {editableSongs.map((s) => {
                            const isSelected = selectedFile === s.file;
                            return (
                                <li key={s.file} className={isSelected ? "active-item" : ""}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectSong(s.file)}
                                        className="song-select-btn"
                                    >
                                        <span className="song-btn-title">{s.title}</span>
                                        <span className="song-btn-artist">{s.artist}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            <main className="editor-main-panel">
                <div className="editor-header-bar">
                    <h2>{selectedFile ? `Upravit: ${title || selectedFile}` : "Vytvořit novou píseň"}</h2>
                    <div className="editor-header-actions">
                        {selectedFile && (
                            <Link href={`/${selectedFile}`} className="btn-view-song">
                                Zobrazit píseň ↗
                            </Link>
                        )}
                        <button
                            type="button"
                            className="btn-toggle-preview"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? "Skrýt náhled" : "Zobrazit náhled"}
                        </button>
                    </div>
                </div>

                {feedback && (
                    <div className={`feedback-alert ${feedback.type}`}>
                        {feedback.text}
                    </div>
                )}

                <div className={`editor-split-view ${showPreview ? "with-preview" : "editor-only"}`}>
                    <form onSubmit={handleSaveSong} className="editor-form">
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Název písně *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="např. Čmelák"
                                    required
                                />
                            </div>

                            <div className="form-group flex-1">
                                <label>Interpret / Umělec *</label>
                                <input
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    placeholder="např. Divokej Bill"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Rychlost rolování (ms na řádek)</label>
                                <input
                                    type="number"
                                    min="500"
                                    max="10000"
                                    step="100"
                                    value={scrollSpeed}
                                    onChange={(e) => setScrollSpeed(Number(e.target.value) || 2000)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Moje hodnocení (Umím)</label>
                                <div className="editor-ranking-box">
                                    <Ranking
                                        ranking={rating}
                                        interactive
                                        onChange={(newRating) => setRating(newRating)}
                                    />
                                    <span className="rating-num-label">{rating}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Text písně a akordy</label>
                            <div className="chord-insert-bar">
                                <span className="bar-label">Rychlé vložení:</span>
                                {COMMON_CHORDS.map((c) => (
                                    <button
                                        type="button"
                                        key={c}
                                        className="btn-snippet"
                                        onClick={() => handleInsertText(`[${c}]`)}
                                    >
                                        [{c}]
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="btn-snippet comment-snippet"
                                    onClick={() => handleInsertText("// Poznámka\n")}
                                >
                                    // Poznámka
                                </button>
                                <button
                                    type="button"
                                    className="btn-snippet tab-snippet"
                                    onClick={() => handleInsertText("```\ne|---\nB|---\n```\n")}
                                >
                                    Tabulatura
                                </button>
                            </div>

                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={16}
                                placeholder="[C]Když nechci, nejdu do práce...&#10;// Refrén&#10;[G]Start pro všechny..."
                                className="editor-textarea"
                            />
                        </div>

                        <div className="editor-buttons-footer">
                            <button
                                type="submit"
                                className="btn-primary btn-save-main"
                                disabled={saving}
                            >
                                {saving ? "Ukládám..." : selectedFile ? "Uložit změny" : "Přidat píseň"}
                            </button>

                            {selectedFile && (
                                <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={handleDeleteSong}
                                    disabled={saving}
                                >
                                    Smazat píseň
                                </button>
                            )}
                        </div>
                    </form>

                    {showPreview && (
                        <div className="live-preview-panel">
                            <div className="preview-header">
                                <h3>Živý náhled</h3>
                            </div>
                            <div className="preview-content">
                                <SongComponent
                                    file={selectedFile || "preview"}
                                    title={title || "Název písně"}
                                    artist={artist || "Interpret"}
                                    scrollSpeed={scrollSpeed}
                                    rating={rating}
                                    defaultRating={rating}
                                    ratings={{}}
                                    authorId={userId || ""}
                                    authorName={user?.name || "Já"}
                                    content={content}
                                    text={previewTokens}
                                    showActions={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
