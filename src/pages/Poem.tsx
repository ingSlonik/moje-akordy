import { useSSRHook } from "ssr-hook";

import NextSong from "../components/NextSong";
import { useHead } from "../../services/common";

import { PoemDetail } from "../../types";


export default function PoemPage({ file, title }: { file: string; title: string }) {

    const [poem, error, isLoading, reload] = useSSRHook<PoemDetail>(`/api/poem?file=${decodeURIComponent(file)}&title=${decodeURIComponent(title)}`);

    const pageTitle = (poem && !(poem instanceof Error))
        ? `${poem.title} - ${poem.artist} (${poem.bookTitle}) | Fílův zpěvník`
        : "Fílův zpěvník";

    useHead({
        title,
        description: poem ? `${poem.title} - ${poem.artist} (${poem.bookTitle}) \n${poem.text.slice(0, 100)}` : pageTitle,
    })

    return (
        <>
            <main>
                <div className="content">
                    {isLoading && <p>Báseň se načítá...</p>}
                    {error && <p className="error">{error.message}</p>}
                    {poem && <>
                        <h1 className="title">{poem.title}</h1>
                        <div className="book-title">{poem.bookTitle}</div>
                        <h2 className="artist">{poem.artist}</h2>

                        <p className="song">
                            {poem.text}
                        </p>
                    </>}
                </div>
            </main>
            <NextSong type="song" />
        </>
    );
}
