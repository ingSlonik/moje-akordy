import AutoScroll from "@/components/AutoScroll";
import NextSong from "@/components/NextSong";
import Ranking from "@/components/Ranking";
import { location } from "@/services/common";
import { parseSong } from "@/services/parser";
import { Metadata } from "next";

type Props = {
    params: { file: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { title, artist, content } = await getSong(params);

    return {
        title: `${title} - ${artist} | Fílův zpěvník`,
        description: `${title} - ${artist}\n${content.slice(0, 100)}`,
    };
}

export default async function Page({ params }: Props) {
    const { title, artist, scrollSpeed, rating, text } = await getSong(params);

    return <main>
        <AutoScroll speed={scrollSpeed} />

        <h1 className="title">{title}</h1>
        <h2 className="artist">{artist}</h2>
        <Ranking ranking={rating} />

        <p className="song">
            {text.split(";").map((t, i) => {
                if (t.startsWith("T")) {
                    return <pre key={i}>{t.substring(1)}</pre>;
                } else if (t.startsWith("A")) {
                    return <sup key={i}>{t.substring(1)}</sup>;
                } else if (t.startsWith("C")) {
                    return <span key={i} className="comment">{t.substring(1).trim()}</span>;
                } else if (t.startsWith(" ")) {
                    return t.substring(1);
                } else {
                    return null;
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

    return parseSong(content);
}
