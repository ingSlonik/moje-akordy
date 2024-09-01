import { useEffect, useState } from "react";

import { location } from "../services/common";

import { PoemDetail, Song, SongDetail } from "../types";

export function useSongs(): null | Error | Song[] {
    // @ts-expect-error Set rendering data for songs
    const defaultSongs: Song[] = window?.RENDERING_DATA?.songs || null;
    const [songs, setSongs] = useState<null | Error | Song[]>(defaultSongs);

    useEffect(() => {
        if (songs)
            return;

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
        })();
    }, []);

    return songs;
}

export function useSong(file: string): null | Error | SongDetail {
    // @ts-expect-error Set rendering data for songs
    const defaultSong: SongDetail = window?.RENDERING_DATA?.song || null;
    const [song, setSong] = useState<null | Error | SongDetail>(defaultSong);

    useEffect(() => {
        if (defaultSong) {
            // @ts-expect-error Next song will be fetched
            delete window.RENDERING_DATA.song;
            return;
        }

        if (file) {
            (async () => {
                try {
                    const res = await fetch(location + "/api/song/" + encodeURIComponent(file));
                    const song = await res.json();
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
                    const res = await fetch(
                        location + "/api/poem/" + encodeURIComponent(file) + "/" + encodeURIComponent(title)
                    );
                    const poem = await res.json();

                    // TODO: check if mounted
                    setPoem(poem);
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
