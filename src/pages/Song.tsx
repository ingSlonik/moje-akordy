import { useParams } from "react-router-dom";

import { useSong } from "@/hooks";
import Song from "@/components/Song";
import NextSong from "@/components/NextSong";

/* TODO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const song = await getSong(params);
    if (!song) return {
        title: `404 | Fílův zpěvník`,
        description: `404 |Píseň nenalezena`,
    };

    const { title, artist, content } = song;
    return {
        title: `${title} - ${artist} | Fílův zpěvník`,
        description: `${title} - ${artist}\n${content.slice(0, 100)}`,
    };
}
*/

export default function SongPage() {
    const { file } = useParams();

    const song = useSong(file || "");

    return <main>
        {song === null && <p>Písně se načítají...</p>}
        {song instanceof Error && <p className="error">{song.message}</p>}
        {song && !(song instanceof Error) && <Song {...song} />}

        <NextSong type="poem" />
    </main>;
}
