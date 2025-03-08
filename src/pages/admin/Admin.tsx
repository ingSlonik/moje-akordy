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
        description: "Pokud nejste administrátor, prosím, opusťte tuto oblast!"
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

    return <main style={{ marginTop: "80px", paddingLeft: "20px", paddingRight: "20px" }}>
        {!user && <form style={{ width: "400px", margin: "0px auto" }} onSubmit={e => {
            e.preventDefault();
            handleLogin();
        }}>
            <h1>Administrace Zpěvníku</h1>
            <p className="page-description">Pokud nejste administrátor, prosím, opusťte tuto oblast!</p>

            {message && <p className="info">{message}</p>}

            <label>Jméno</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
            <label>Heslo</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <input style={{ marginTop: "20px" }} type="submit" value="Přihlásit se" />
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


    async function handleSelect(file: string) {
        const [text, error] = await api.getSongRaw({ file });
        if (error) {
            setEditSong(error);
        } else if (text) {
            setEditSong(text);
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
        await api.updateSong({ file: songFile, text: editSong });
        reload();
    }

    return <div style={{ display: "flex" }}>
        <div style={{ flexGrow: 1, flexBasis: 100, paddingRight: 20, borderRight: "1px solid #888" }}>
            <button onClick={onLogOut}>Odhlásit se</button>

            {errorSongs && <p className="error">{errorSongs}</p>}
            <label>Název nového souboru (bez diakritiky a s pomlčkami)</label>
            <input type="text" value={newSong} onChange={e => setNewSong(e.target.value)} />
            <button onClick={handleAdd}>Přidat soubor / píseň</button>

            {songs && <ul>
                {songs
                    .filter(s => s.type === "song")
                    .sort((a, b) => b.rating - a.rating)
                    .map(song => <li key={song.file} style={{ marginBottom: 12 }}>
                        <a onClick={() => handleSelect(song.file)} style={{ display: "block", cursor: "pointer" }}>
                            {song.title} - {song.artist}
                            <Ranking ranking={song.rating} />
                        </a>
                    </li>)}
            </ul>}
        </div>
        <div style={{ flexGrow: 4, flexBasis: 100, paddingRight: 20 }}>
            <h2>{songFile}</h2>
            <Editor
                height="calc(100vh - 200px)"
                defaultLanguage="markdown" // Nastav jazyk na Markdown
                value={editSong}
                onChange={value => setEditSong(value || "")}
                theme="vs" // Světlý motiv (vs)
                options={{
                    minimap: { enabled: true, renderCharacters: false },
                    automaticLayout: true,
                    wordWrap: 'on', // Zalamování řádků
                }}
            />
            <button onClick={handleSave}>Uložit změny</button>
        </div>
    </div>
}
