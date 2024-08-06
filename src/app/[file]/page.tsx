import AutoScroll from "@/components/AutoScroll";
import NextSong from "@/components/NextSong";
import { location } from "@/services/common";
import { Metadata } from "next";

type Props = {
    params: { file: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { title, artist, text } = await getSong(params);

    return {
        title: `${title} - ${artist} | Fílův zpěvník`,
        description: `${title} - ${artist} \n${text.slice(0, 100)}`,
    };
}

export default async function Page({ params }: Props) {
    const { title, artist, scrollSpeed, text } = await getSong(params);

    let firstLine = false;
    return <main>
        <AutoScroll speed={parseInt(scrollSpeed, 10)} />

        <h1 className="title">{title}</h1>
        <h2 className="artist">{artist}</h2>

        <p className="song">
            {text.split(";").map((t, i) => {
                if (!t.trim() && !firstLine) {
                    return "";
                } else if (t.startsWith("```")) {
                    return <pre key={i}>{t.substring(3, t.length - 3)}</pre>;
                } else if (t.startsWith("[")) {
                    return <sup key={i}>{t.substring(1, t.length - 1)}</sup>;
                } else if (t.startsWith("//")) {
                    return <span key={i} className="comment">{t.substring(2).trim()}</span>;
                } else {
                    firstLine = true;
                    return t;
                }
            })}
        </p>
        <NextSong type="poem" />
    </main>;
}

async function getSong(params: Props["params"]) {
    const songFile = params.file;

    const res = await fetch(location + '/songs/' + songFile + '.md', { cache: "no-store" });
    const content = await res.text();

    const title = getLine("#", content);
    const artist = getLine("@", content);
    const scrollSpeed = getLine("$", content) || "2000";

    const text = content
        .split("\n")
        .filter(t => !t.startsWith("#") && !t.startsWith("@") && !t.startsWith("$"))
        .join("\n;")
        .replace(/```([\s\S]*?)```/g, (match, p1) => `;${match.replaceAll(";", "")};`)
        .replace(/\[(.*?)\]/g, (match, p1) => `;${match};`);

    return { title, artist, scrollSpeed, text };
}

function getLine(symbol: string, content: string): null | string {
    for (let line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}