import AutoScroll from "@/components/AutoScroll";
import NextSong from "@/components/NextSong";
import { location } from "@/services/common";
import { Metadata } from "next";

type Props = {
    params: { file: string; poem: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { title, artist, bookTitle, text } = await getPoem(params);

    return {
        title: `${title} - ${artist} (${bookTitle}) | Moje písničky`,
        description: `${title} - ${artist} (${bookTitle}) \n${text.slice(0, 100)}`,
    };
}

export default async function Page({ params }: Props) {
    const { title, artist, bookTitle, text } = await getPoem(params);

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

    const res = await fetch(location + '/poems/' + poemFile + '.md', { cache: "no-store" });
    const content = await res.text();

    const artist = getLine("@", content);
    const bookTitle = getLine("# ", content);

    let indexPoem = content.indexOf(`## ${title}`);
    // for ... poem:
    if (indexPoem === -1) {
        indexPoem = content.indexOf(`## ...\n${title}`);
    }

    const indexEndPoem = content.indexOf(`## `, indexPoem + 2);

    const text = content.slice(content.indexOf(`\n`, indexPoem), indexEndPoem);

    return { title, artist, bookTitle, text };
}

function getLine(symbol: string, content: string): null | string {
    for (let line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}