import React, { useEffect } from "react";
import { usePoem } from "../../services/hooks";

import NextSong from "@/components/NextSong";
import { useParams } from "@/Router";

/* TODO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const poem = await getPoem(params);
    if (!poem) return {
        title: `404 | Fílův zpěvník`,
        description: `404 |Píseň nenalezena`,
    };

    const { title, artist, bookTitle, text } = poem;

    return {
        title: `${title} - ${artist} (${bookTitle}) | Fílův zpěvník`,
        description: `${title} - ${artist} (${bookTitle}) \n${text.slice(0, 100)}`,
    };
}
*/

export default function PoemPage() {
    const { file, title } = useParams();

    const poem = usePoem(file || "", decodeURIComponent(title || ""));

    useEffect(() => {
        if (poem && !(poem instanceof Error))
            document.title = `${poem.title} - ${poem.artist} (${poem.bookTitle}) | Fílův zpěvník`;
    }, [poem]);

    return <main>
        {poem === null && <p>Báseň se načítá...</p>}
        {poem instanceof Error && <p className="error">{poem.message}</p>}
        {poem && !(poem instanceof Error) && <>
            <h1 className="title">{poem.title}</h1>
            <div className="book-title">{poem.bookTitle}</div>
            <h2 className="artist">{poem.artist}</h2>

            <p className="song">
                {poem.text}
            </p>
        </>}

        <NextSong type="song" />
    </main>;
}