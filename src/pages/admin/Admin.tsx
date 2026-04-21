import { useState } from "react";
import { useRouter } from "easy-page-router/react";
import Editor from '@monaco-editor/react';

import Ranking from "@/components/Ranking";
import { useHead } from "../../../services/common";
import { api, setAuthorizationHeader, useApi } from "../../../services/api";

export default function Admin() {
    const { path } = useRouter();

    useHead({
        title: "Administrace Zpěvníku",
        description: "Pokud nejsi oprávněný administrátor, raději hned utec!"
    })


    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");

    const [user, setUser] = useState<null | string>(() => {
        const user = loadUser();
        if (user) {
            setAuthorizationHeader("bearer " + user.token);
            return user.name;
        }

        return null;
    });

    function handleLogOut() {
        setAuthorizationHeader("");
        saveUser(null);
        setUser(null);
        setMessage(`Byl jsi odhlášen.`);
    }

    async function handleLogin() {
        const [user, error] = await api.addLogin({ username, password });

        if (error) {
            setMessage(error);
            return;
        } else if (user) {
            saveUser(user);
            setAuthorizationHeader("bearer " + user.token);
            setMessage(`Jsi přihlášen jako: ${user.name}`);
            setUser(user.name);
        }
    }

    return <main className={user ? "admin-main" : ""} style={!user ? { marginTop: "80px", paddingLeft: "20px", paddingRight: "20px" } : {}}>
        {!user && <form style={{ width: "400px", margin: "0px auto" }} onSubmit={e => {
            e.preventDefault();
            handleLogin();
        }}>
            <h1>Administrace Zpěvníku</h1>
            <p className="page-description">Pokud nemáš tajné heslo, raději hned utec! Tohle je pouze pro vyvolené.</p>

            {message && <p className="info" style={{ color: "var(--color-primary)" }}>{message}</p>}

            <label>Jméno</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
            <label>Heslo</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <input className="btn-primary" style={{ marginTop: "20px" }} type="submit" value="Přihlásit se" />
        </form>}

        {user && <>
            {!path[1] && <EditSongs onLogOut={handleLogOut} />}
        </>}
    </main>;
}

function saveUser(user: null | { name: string, token: string }) {
    if (user === null) return localStorage.removeItem("admin");
    localStorage.setItem("admin", JSON.stringify(user));
}

function loadUser() {
    const user = localStorage.getItem("admin");
    if (!user) return null;

    try {
        const parsedUser = JSON.parse(user);
        if (
            parsedUser
            && typeof parsedUser === "object"
            && typeof parsedUser.name === "string"
            && typeof parsedUser.token === "string"
        ) return parsedUser;
    } catch (e) { }

    return null;
}

function EditSongs({ onLogOut }: { onLogOut: () => void }) {

    const [songs, errorSongs, , , reload] = useApi.getSongs({});

    const [newSong, setNewSong] = useState("");

    const [songFile, setSongFile] = useState("");
    const [editSong, setEditSong] = useState("");
    const [originalEditSong, setOriginalEditSong] = useState("");

    async function handleSelect(file: string) {
        const [text, error] = await api.getSongRaw({ file });
        if (error) {
            setEditSong(error);
            setOriginalEditSong(error);
        } else if (text) {
            setEditSong(text);
            setOriginalEditSong(text);
            setSongFile(file);
        }
    }

    async function handleAdd() {
        if (!newSong) return;

        await api.addSong({ file: newSong });
        setNewSong("");
        reload();
        handleSelect(newSong);
    }

    async function handleSave() {
        if (editSong === originalEditSong) return;

        await api.updateSong({ file: songFile, text: editSong });
        setOriginalEditSong(editSong);
        reload();
    }

    async function handleDelete() {
        if (!songFile) return;
        if (!window.confirm(`Opravdu chcete nenávratně smazat píseň: ${songFile}?`)) return;

        await api.removeSong({ file: songFile });
        setSongFile("");
        setEditSong("");
        setOriginalEditSong("");
        reload();
    }

    const isDirty = editSong !== originalEditSong;

    return <>
        <div className="admin-sidebar">
            <div className="admin-sidebar-header">
                <h2>Přehled písní</h2>
                {errorSongs && <p className="error" style={{ color: "var(--color-danger)" }}>{errorSongs}</p>}
                <label style={{ marginTop: 0 }}>Nový soubor (bez diakritiky)</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <input type="text" value={newSong} onChange={e => setNewSong(e.target.value)} placeholder="nazev-pisne" />
                    <button style={{ width: "auto", padding: "8px 16px" }} className="btn-primary" onClick={handleAdd}>Přidat</button>
                </div>
            </div>
            <div className="admin-sidebar-content">
                {songs && <ul>
                    {songs
                        .filter(s => s.type === "song")
                        .sort((a, b) => b.rating - a.rating)
                        .map(song => <li key={song.file} className={songFile === song.file ? "active-song" : ""}>
                            <a onClick={() => handleSelect(song.file)}>
                                {song.title} - {song.artist}
                                <Ranking ranking={song.rating} />
                            </a>
                        </li>)}
                </ul>}
            </div>
            <div style={{ padding: "16px", borderTop: "1px solid var(--color-border)" }}>
                <button onClick={onLogOut} style={{ background: "var(--color-bg)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>Odhlásit se</button>
            </div>
        </div>
        <div className="admin-editor-container">
            {songFile ? (
                <>
                    <div className="admin-editor-header">
                        <h2>{songFile}.md</h2>
                        <div className="actions">
                            <button className="btn-danger" style={{ width: "auto" }} onClick={handleDelete}>Smazat</button>
                            <button
                                className="btn-primary"
                                style={{ width: "auto" }}
                                onClick={handleSave}
                                disabled={!isDirty}
                            >
                                {isDirty ? "Uložit změny *" : "Uloženo"}
                            </button>
                        </div>
                    </div>
                    <div className="admin-editor-content">
                        <Editor
                            height="100%"
                            defaultLanguage="markdown"
                            value={editSong}
                            onChange={value => setEditSong(value || "")}
                            theme="vs"
                            options={{
                                minimap: { enabled: true, renderCharacters: false },
                                automaticLayout: true,
                                wordWrap: 'on',
                            }}
                        />
                    </div>
                </>
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)" }}>
                    Vyberte píseň z levého panelu
                </div>
            )}
        </div>
    </>;
}
