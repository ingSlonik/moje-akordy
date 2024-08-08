import AutoScroll from "@/components/AutoScroll";
import NextSong from "@/components/NextSong";
import { location } from "@/services/common";
import { Metadata } from "next";

type Props = {
    params: { file: string; poem: string };
};

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

export default async function Page({ params }: Props) {
    const poem = await getPoem(params);
    if (!poem)
        return <main>
            <h1>404 | Báseň nenalezena</h1>
            <NextSong type="song" />
        </main>;

    const { title, artist, bookTitle, text } = poem;

    return <main>
        <h1 className="title">{title}</h1>
        <div className="book-title">{bookTitle}</div>
        <h2 className="artist">{artist}</h2>

        <p className="song">
            {text}
        </p>
        <NextSong type="song" />
    </main>;
}

async function getPoem(params: Props["params"]) {
    const poemFile = params.file;
    const title = decodeURIComponent(params.poem);

    try {
        const res = await fetch(location + '/poems/' + poemFile + '.md', { cache: "no-store" });
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

        return { title, artist, bookTitle, text };
    } catch (e) {
        return null;
    }
}

function getLine(symbol: string, content: string): null | string {
    for (let line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}