import { readFile, readdir, stat } from "fs/promises";
import { resolve, parse } from "path"

import { Song } from "../../../../types";

const dirSongs = resolve(process.cwd(), "public", "songs");
const dirPoems = resolve(process.cwd(), "public", "poems");

export async function GET() {
    const songs: Song[] = [];
    const filesSongs = await readdir(dirSongs, "utf8");
    for (let file of filesSongs) {

        const { name, ext } = parse(file);
        if (ext !== ".md")
            continue;

        const filePath = resolve(dirSongs, file);
        const content = await readFile(filePath, "utf8");
        const statFile = await stat(filePath);

        const title = getLine("#", content);
        const artist = getLine("@", content);

        if (title && artist)
            songs.push({ file: name, type: "song", title, artist, lastModified: statFile.mtime.toISOString() });
        else
            console.log("ERROR FILE:", file);
    }

    const filesPoems = await readdir(dirPoems, "utf8");
    for (let file of filesPoems) {
        const { name, ext } = parse(file);
        if (ext !== ".md")
            continue;

        const filePath = resolve(dirPoems, file);
        const content = await readFile(filePath, "utf8");
        const statFile = await stat(filePath);

        const bookTitle = getLine("#", content);
        const artist = getLine("@", content);

        if (!(bookTitle && artist)) {
            console.log("ERROR FILE:", file);
            continue;
        }

        const poems = content.split("##").slice(1);
        for (let poem of poems) {
            let title = poem.split("\n")[0].trim();
            if (title) {
                if (title === "...")
                    title = poem.split("\n")[1].trim();
                songs.push({ file: name, type: "poem", title, artist, bookTitle, lastModified: statFile.mtime.toISOString() });
            }
        }
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