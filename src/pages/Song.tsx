import { useRef } from "react";
import { useTitle } from "easy-page-router/react";

import Song from "../components/Song";
import NextSong from "../components/NextSong";
import AutoScroll from "../components/AutoScroll";
import { useHead } from "../../services/common";
import { useSSRHook } from "ssr-hook";
import { SongDetail } from "../../types";

export default function SongPage({ file }: { file: string }) {
    const refScroll = useRef<HTMLDivElement>(null);

    const [song, error, isLoading, reload] = useSSRHook<SongDetail>(`/api/song?file=${decodeURIComponent(file)}`);

    const title = (song && !(song instanceof Error))
        ? `${song.title} - ${song.artist} | Fílův zpěvník`
        : "Fílův zpěvník";

    useTitle(title);
    useHead({
        title,
        description: song ? `${song.title} - ${song.artist} \n${song.text.slice(0, 100)}` : title,
    })

    return (
        <>
            {song && <AutoScroll speed={song.scrollSpeed} refScroll={refScroll} />}
            <main ref={refScroll}>
                <div className="content">
                    {isLoading && <p>Píseň se načítá...</p>}
                    {error && <p className="error">{error.message}</p>}
                    {song && <Song {...song} />}
                </div>
            </main>
            <NextSong type="poem" />
        </>
    );
}
