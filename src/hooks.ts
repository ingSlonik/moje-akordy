import { useEffect, useState } from "react";

import { location } from "../services/common";

import { PoemDetail, Song, SongDetail } from "../types";
import { parseSong } from "../services/parser";


export function useSongs(): null | Error | Song[] {
    const [songs, setSongs] = useState<null | Error | Song[]>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(location + "/api/song");
                const songs = await res.json();

                // TODO: check if mounted
                setSongs(songs);
            } catch (e) {
                if (e instanceof Error) {
                    setSongs(e);
                } else {
                    setSongs(new Error("Seznam písní se nepodařilo načíst, zkuste to prosím později."));
                }
            }
        })()
    }, []);

    return songs;
}

export function useSong(file: string): null | Error | SongDetail {
    const [song, setSong] = useState<null | Error | SongDetail>(null);

    useEffect(() => {
        if (file) {
            (async () => {
                try {
                    const res = await fetch(location + "/api/song/" + encodeURIComponent(file));
                    const text = await res.text();
                    const song = parseSong(text);
                    // TODO: check if mounted
                    setSong(song);
                } catch (e) {
                    if (e instanceof Error) {
                        setSong(e);
                    } else {
                        setSong(new Error("Tuto píseň se nepodařilo načíst, zkuste to prosím později."));
                    }
                }
            })();
        }
    }, [file]);

    return song;
}

export function usePoem(file: string, title: string): null | Error | PoemDetail {
    const [poem, setPoem] = useState<null | Error | PoemDetail>(null);

    useEffect(() => {
        if (file) {
            (async () => {
                try {
                    const res = await fetch(location + "/api/poem/" + encodeURIComponent(file));
                    const content = await res.text();

                    const artist = getLine("@", content);
                    const bookTitle = getLine("# ", content);

                    let indexPoem = content.indexOf(`## ${title}`);
                    // for ... poem:
                    if (indexPoem === -1) {
                        indexPoem = content.indexOf(`## ...\n${title}`);
                    }
                    if (indexPoem === -1)
                        return null;

                    const indexEndPoem = content.indexOf(`## `, indexPoem + 2);

                    const text = content.slice(content.indexOf(`\n`, indexPoem), indexEndPoem);

                    // TODO: check if mounted
                    setPoem({ title, artist, bookTitle, text });
                } catch (e) {
                    if (e instanceof Error) {
                        setPoem(e);
                    } else {
                        setPoem(new Error("Tuto píseň se nepodařilo načíst, zkuste to prosím později."));
                    }
                }
            })();
        }
    }, [file, title]);

    return poem;
}


function getLine(symbol: string, content: string): null | string {
    for (const line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}
