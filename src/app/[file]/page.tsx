import { Metadata } from "next";

import NextSong from "@/components/NextSong";
import Song from "@/components/Song";
import { location } from "@/services/common";
import { parseSong } from "@/services/parser";

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
    const songDetail = await getSong(params);

    return <main>
        <Song {...songDetail} />
        <NextSong type="poem" />
    </main>;
}

async function getSong(params: Props["params"]) {
    const songFile = params.file;

    const res = await fetch(location + '/songs/' + songFile + '.md', { cache: "no-store" });
    const content = await res.text();

    return parseSong(content);
}
