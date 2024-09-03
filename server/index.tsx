import { parse, resolve } from "path";
import compression from "compression";
import express from "express";
import cors from "cors";

import React from "react";
import { renderToString } from 'react-dom/server';

import { readdir, readFile, stat } from "fs/promises";
import { parsePoem, parseSong } from "../services/parser";
import { setRenderingData } from "../services/renderingData";
import { location } from "../services/common";
import { getImageName } from "../services/imageNamer";

import { RenderingData, Song } from "../types";

const dirSongs = resolve(process.cwd(), "public", "songs");
const dirPoems = resolve(process.cwd(), "public", "poems");
const indexPath = resolve(process.cwd(), "dist", "index.html");

const image = location + "/icon-512x512.png";

const PORT = process.env.PORT || 1010;

const app = express();
app.use(compression({ level: 9 }));


if (process.env.NODE_ENV === "development") {
    console.log("Starting development server...")
    app.use(cors());
}


app.get("/", async (req, res) => {
    const songs = await getSongs();

    const html = await getRenderedHTML(
        location + req.url,
        "Fílův zpěvník",
        // eslint-disable-next-line max-len
        "Osobní zpěvník Fíly! Obsahuje jak písně s akordy tak proložní básničkama. Je úplně bez reklam! A má auto scroll!",
        image,
        { songs },
    );

    res.set('Content-Type', 'text/html');
    res.send(html);
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
    const text = await readFile(path, "utf-8");
    const song = parseSong(text);
    res.json(song);
});
app.get('/api/poem/:file/:title', async (req, res) => {
    const file = req.params.file + ".md";
    const title = req.params.title;
    const path = resolve(dirPoems, file);
    const text = await readFile(path, "utf-8");
    const poem = parsePoem(text, title);
    res.json(poem);
});

// 404
app.get("/404", async (req, res) => {
    const html = await getRenderedHTML(
        location + req.url,
        "404 | Píseň nenalezena | Fílův zpěvník",
        "404 Píseň nenalezena, ale zkoušej to dál, je tu velká hromada písní ;)",
        image,
        {},
    );

    res.set('Content-Type', 'text/html');
    res.send(html);
});

// song
app.get("/:file", async (req, res) => {
    try {
        const file = req.params.file + ".md";
        const path = resolve(dirSongs, file);
        const text = await readFile(path, "utf-8");
        const song = parseSong(text);

        const html = await getRenderedHTML(
            location + req.url,
            `${song.title} - ${song.artist} | Fílův zpěvník`,
            `${song.title} - ${song.artist}\n${song.content.slice(0, 100)}`,
            image,
            { song },
        );

        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (e) {
        console.log("Error:", req.url, e);
        res.redirect(302, "/404");
    }
});
// poem
app.get("/:file/:title", async (req, res) => {
    try {
        const file = req.params.file + ".md";
        const title = req.params.title;
        const path = resolve(dirPoems, file);
        const text = await readFile(path, "utf-8");
        const poem = parsePoem(text, title);

        if (!poem)
            return res.redirect(302, "/404");

        const html = await getRenderedHTML(
            location + req.url,
            `${poem.title} - ${poem.artist} (${poem.bookTitle}) | Fílův zpěvník`,
            `${poem.title} - ${poem.artist} (${poem.bookTitle}) \n${text.slice(0, 100)}`,
            image,
            { poem },
        );

        res.set('Content-Type', 'text/html');
        res.send(html);
    } catch (e) {
        console.log("Error:", req.url, e);
        res.redirect(302, "/404");
    }
});


app.listen(PORT, () => console.log(`Moje akordy app listening on http://localhost:${PORT}`));



async function getRenderedHTML(
    url: string, title: string, description: string, image: string, renderingData: Partial<RenderingData>,
) {

    setRenderingData(renderingData, url);

    let html = await readFile(indexPath, "utf-8");
    html = html.replace("<head>", `<head>${renderToString(<>
        <title>{title}</title>
        <meta name="description" content={description} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={url} />
    </>)}`);

    // @ts-expect-error It is extended returning original URL
    global.URL = URLWithTransformer;
    const App = (await import("@/App")).default;
    const app = renderToString(<App />);
    global.URL = URLOriginal;

    // eslint-disable-next-line max-len
    html = html.replace(`<div id="root"></div>`, `<div id="root">${app}</div><script type="text/javascript">window.RENDERING_DATA=${JSON.stringify(renderingData)};</script>`);

    return html;
}

const URLOriginal = URL;
class URLWithTransformer extends URLOriginal {
    constructor(path: string, base?: string | URL) {
        super(path, base);
        if (typeof base === "string" && base.startsWith("file:")) {
            const name = getImageName(new URLOriginal(path, `file://${process.cwd()}`));
            return new URLOriginal(name, location);
        }
        return new URLOriginal(path, base);
    }
}

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