import React, { useEffect } from "react";

import Song from "@/components/Song";
import NextSong from "@/components/NextSong";
import { useSong } from "../../services/hooks";

export default function SongPage({ file }: { file: string }) {
    const song = useSong(file);

    useEffect(() => {
        if (song && !(song instanceof Error))
            document.title = `${song.title} - ${song.artist} | Fílův zpěvník`;
    }, [song]);

    return <main>
        {song === null && <p>Píseň se načítá...</p>}
        {song instanceof Error && <p className="error">{song.message}</p>}
        {song && !(song instanceof Error) && <Song {...song} />}

        <NextSong type="poem" />
    </main>;
}
