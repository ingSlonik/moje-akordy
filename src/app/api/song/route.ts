import { readFile, readdir } from "fs/promises";
import { resolve, parse } from "path"
import { Song } from "../../../../types";

const dir = resolve(process.cwd(), "public", "songs");

export async function GET() {
    const songs: Song[] = [];
    const files = await readdir(dir, "utf8");
    for (let file of files) {
        const { name, ext } = parse(file);
        if (ext !== ".md")
            continue;

        const content = await readFile(resolve(dir, file), "utf8");

        const title = getLine("#", content);
        const artist = getLine("@", content);

        if (title && artist)
            songs.push({ file: name, title, artist });
        else
            console.log("ERROR FILE:", file);
    }

    return Response.json(songs);
}

function getLine(symbol: string, content: string): null | string {
    for (let line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}