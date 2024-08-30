import { parse, resolve } from "path";
import express from "express";
import cors from "cors";

import React from "react";
import { renderToString } from 'react-dom/server';
import App from "@/App";

import { readdir, readFile, stat } from "fs/promises";
import { parseSong } from "../services/parser";
import { location } from "../services/common";

import { Song } from "../types";
import { setServerRenderingHref } from "@/Router";

const dirSongs = resolve(process.cwd(), "public", "songs");
const dirPoems = resolve(process.cwd(), "public", "poems");
const indexPath = resolve(process.cwd(), "dist", "index.html");

const PORT = process.env.PORT || 1010;

const app = express();

if (process.env.NODE_ENV === "development") {
    console.log("Starting development server...")
    app.use(cors());
}



app.get("/", async (req, res) => {
    // const songs = await getSongs();

    setServerRenderingHref(location + "/");

    const html = await readFile(indexPath, "utf-8");

    // global.window = { location: { href: location + "/" } };

    const app = renderToString(<App />);

    res.set('Content-Type', 'text/html');
    res.send(html.replace('<div id="root"></div>', '<div id="root">' + app + "</div>"));
});

app.use(express.static('dist'));
app.use(express.static('public'));

app.get('/sitemap.xml', async (req, res) => {
    const songs = await getSongs();

    const lastModified = songs.reduce((last, song) => song.lastModified > last ? song.lastModified : last, "");
    const sitemap = [
        {
            url: `${location}/`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 1,
        },
        ...songs.map(song => ({
            url: song.type === "song" ?
                `${location}/${song.file}` :
                `${location}/${song.file}/${encodeURIComponent(song.title)}`,
            lastModified: song.lastModified,
            changeFrequency: 'monthly',
            priority: song.type === "song" ? 0.7 : 0.4,
        })),
    ];
    res.set('Content-Type', 'text/xml');
    res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(s => `<url>
<loc>${s.url}</loc>
<lastmod>${s.lastModified}</lastmod>
<changefreq>${s.changeFrequency}</changefreq>
<priority>${s.priority}</priority>
</url>`).join("\n")}
</urlset>`);
});

app.get('/api/song', async (req, res) => {
    const songs = await getSongs();
    res.json(songs);
});
app.get('/api/song/:file', async (req, res) => {
    const file = req.params.file + ".md";
    const path = resolve(dirSongs, file);
    res.sendFile(path);
});
app.get('/api/poem/:file', async (req, res) => {
    const file = req.params.file + ".md";
    const path = resolve(dirPoems, file);
    res.sendFile(path);
});

app.listen(PORT, () => console.log(`Moje akordy app listening on port ${PORT}`));


async function getSongs(): Promise<Song[]> {
    const songs: Song[] = [];
    const filesSongs = await readdir(dirSongs, "utf8");
    for (const file of filesSongs) {

        const { name, ext } = parse(file);
        if (ext !== ".md")
            continue;

        const filePath = resolve(dirSongs, file);
        const content = await readFile(filePath, "utf8");
        const statFile = await stat(filePath);

        const { title, artist, rating } = parseSong(content);

        if (title && artist)
            songs.push({ file: name, type: "song", title, artist, rating, lastModified: statFile.mtime.toISOString() });
        else
            console.log("ERROR FILE:", file);
    }

    const filesPoems = await readdir(dirPoems, "utf8");
    for (const file of filesPoems) {
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
        for (const poem of poems) {
            let title = poem.split("\n")[0].trim();
            if (title) {
                if (title === "...")
                    title = poem.split("\n")[1].trim();
                songs.push({
                    file: name, type: "poem", title, artist, bookTitle, rating: 0,
                    lastModified: statFile.mtime.toISOString(),
                });
            }
        }
    }

    return songs;
}

function getLine(symbol: string, content: string): null | string {
    for (const line of content.split("\n")) {
        if (line.startsWith(symbol))
            return line.substring(symbol.length).trim();
    }
    return null;
}