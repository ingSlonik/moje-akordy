import { useRef } from "react";
import { useTitle } from "easy-page-router/react";

import Song from "../components/Song.tsx";
import NextSong from "../components/NextSong.tsx";
import { useSong } from "../../services/hooks.ts";
import AutoScroll from "../components/AutoScroll.tsx";

export default function SongPage({ file }: { file: string }) {
    const song = useSong(file);
    const refScroll = useRef(null);

    const title = (song && !(song instanceof Error))
        ? `${song.title} - ${song.artist} | Fílův zpěvník`
        : "Fílův zpěvník";

    useTitle(title);

    return (
        <>
            {song && !(song instanceof Error) && <AutoScroll speed={song.scrollSpeed} refScroll={refScroll} />}
            <main ref={refScroll}>
                <div className="content">
                    {song === null && <p>Píseň se načítá...</p>}
                    {song instanceof Error && <p className="error">{song.message}</p>}
                    {song && !(song instanceof Error) && <Song {...song} />}
                </div>
            </main>
            <NextSong type="poem" />
        </>
    );
}
