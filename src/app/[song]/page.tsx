import Link from "next/link";
import AutoScroll from "@/components/AutoScroll";

const location = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://akordy.paulu.cz";

export default async function Page({ params }: { params: { song: string } }) {
    const songFile = params.song;

    const res = await fetch(location + '/songs/' + songFile + '.md', { cache: "no-store" });
    const content = await res.text();

    const title = getLine("#", content);
    const artist = getLine("@", content);
    const scrollSpeed = getLine("$", content);

    const text = content
        .split("\n")
        .filter(t => !t.startsWith("#") && !t.startsWith("@") && !t.startsWith("$"))
        .join("\n;")
        .replace(/\[(.*?)\]/g, (match, p1) => `;${match};`);

    let firstLine = false;
    return <main>
        {scrollSpeed && <AutoScroll speed={parseInt(scrollSpeed, 10)} />}
        <Link href="/" className="back">← Zpět na seznam písní</Link>
        <div>ID: {songFile}</div>
        <h1 className="title">{title}</h1>
        <h2 className="artist">{artist}</h2>

        <p className="song">
            {text.split(";").map((t, i) => {
                if (!t.trim() && !firstLine) {
                    return "";
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
    </main>;
}

function getLine(symbol: string, content: string): null | string {
    for (let line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}