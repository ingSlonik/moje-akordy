import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import express, { Request, Response } from "express";
import { parse, resolve } from "node:path";
import { existsSync } from "node:fs";
import process from "node:process";
import jwt from "jsonwebtoken";
import cors from "cors";
import sha1 from "sha1";

import React from "react";

import { renderToHTML } from "ssr-hook/server";
import { APIError, setAPIBackend } from "typed-client-server-api";

import { parsePoem, parseSong } from "../services/parser";
import { location } from "../services/common";

import App from "../src/App";

import { API, Song } from "../types";


const PORT = process.env.PORT || 1010;
const ORIGIN = "https://akordy.paulu.cz";
const LOCALHOST = `http://localhost:${PORT}`;

const JWT_SECRET = "VemKytaruAJeď:P";

const INDEX_HTML_PATH = resolve(process.cwd(), "dist", "index.html");
const dirPoems = resolve(process.cwd(), "public", "poems");
const dirSongs = resolve(process.cwd(), "public", "songs");

const app = express();

if (process.env.NODE_ENV === "development") {
    console.log("Starting development server...");
    app.use(cors());
}

// ---------------------------- SSR for index ----------------------------------
app.get(["/", "/index.html"], async (req, res) => {
    try {
        const indexHtml = await readFile(INDEX_HTML_PATH, "utf-8");
        const html = await renderToHTML(ORIGIN, req.url, indexHtml, <App />);
        res.set("Content-Type", "text/html");
        res.send(html);
    } catch (e) {
        console.error("SSR error:", e);
        res.status(500);
        res.json({ message: "Internal server error" });
    }
});

app.use(express.static("dist"));
app.use(express.static("public"));

// --------------------------------- SEO ---------------------------------------
app.get("/robots.txt", (_, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Disallow: /admin/
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml`);
});

app.get("/sitemap.xml", async (req, res) => {
    const songs = await getSongs();

    const lastModified = songs.reduce((last, song) => song.lastModified > last ? song.lastModified : last, "");
    const sitemap = [
        {
            url: `${location}/`,
            lastModified,
            changeFrequency: "weekly",
            priority: 1,
        },
        ...songs.map((song) => ({
            url: song.type === "song"
                ? `${location}/${song.file}`
                : `${location}/${song.file}/${encodeURIComponent(song.title)}`,
            lastModified: song.lastModified,
            changeFrequency: "monthly",
            priority: song.type === "song" ? 0.7 : 0.4,
        })),
    ];
    res.set("Content-Type", "text/xml");
    res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((s) => `<url>
<loc>${s.url}</loc>
<lastmod>${s.lastModified}</lastmod>
<changefreq>${s.changeFrequency}</changefreq>
<priority>${s.priority}</priority>
</url>` ).join("\n")}
</urlset>`);
});

// --------------------------------- API ---------------------------------------
app.use(express.json({ limit: "0.5MB" }));

setAPIBackend<API>(app, {
    async getSongs() {
        return getSongs();
    },
    async getSong({ file }) {
        const path = resolve(dirSongs, file + ".md");
        const text = await readFile(path, "utf-8");
        const song = parseSong(text);
        return song;
    },
    async getSongRaw({ file }) {
        const path = resolve(dirSongs, file + ".md");
        const text = await readFile(path, "utf-8");
        return text;
    },
    async getPoem({ file, title }) {
        const path = resolve(dirPoems, file + ".md");
        const text = await readFile(path, "utf-8");
        const poem = parsePoem(text, title);
        if (!poem)
            throw new APIError("Poem not found", 404);

        return poem;
    },

    // ----------------------------- Admin -------------------------------------
    async addLogin({ username, password }) {
        if (username === "admin" && sha1(password) === "69432c1f19d153b7269d56beb4a20d192299dfc1") {
            const name = "Já nebo Zůza";
            const token = jwt.sign({
                sub: "admin",
                name,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // one month
            }, JWT_SECRET);

            return { name, token };
        }
        throw new Error("Invalid credentials");
    },
    async addSong({ file }, req, res) {
        checkLogin(req, res);

        const path = resolve(dirSongs, file + ".md");
        if (existsSync(path))
            throw new Error("File already exists!");

        await writeFile(path, `# ${file}\n@ Zpěvák\n$ 1000 $\n% 0\n\n`, "utf-8");
    },
    async updateSong({ file, text }, req, res) {
        checkLogin(req, res);

        const path = resolve(dirSongs, file + ".md");
        if (!existsSync(path))
            throw new Error("File doesn't exist!");

        await writeFile(path, text, "utf-8");
    },
});

// --------------------------------- SSR ---------------------------------------
app.get("*", async (req, res) => {
    try {
        const indexHtml = await readFile(INDEX_HTML_PATH, "utf-8");
        const html = await renderToHTML(ORIGIN, req.url, indexHtml, <App />);
        res.set("Content-Type", "text/html");
        res.send(html);
    } catch (e) {
        console.error("SSR error:", e);
        res.status(500);
        res.json({ message: "Internal server error" });
    }
});

// ----------------------------- Run server ------------------------------------
app.listen(PORT, () => console.log(`Moje akordy app listening on ${LOCALHOST}`));

// ----------------------------- Helpers ------------------------------------
function checkLogin(req: Request, res: Response): string {
    try {
        const authorization = req.headers.authorization;
        if (!authorization)
            throw new Error("Unauthorized");

        const token = authorization.split(" ")[1];
        const payload = jwt.verify(token, JWT_SECRET); // Expiration is checking here

        if (
            payload
            && typeof payload === "object"
            && typeof payload.sub === "string"
            && typeof payload.name === "string"
            && typeof payload.iat === "number"
            && typeof payload.exp === "number"
            && payload.sub === "admin"
        ) {
            return payload.name;
        }

        throw new Error("Unauthorized");

    } catch (e) {
        throw new APIError((e as Error).message || "Unauthorized", 401);
    }
}

async function getSongs(): Promise<Song[]> {
    const songs: Song[] = [];
    const filesSongs = await readdir(dirSongs, "utf8");
    for (const file of filesSongs) {
        const { name, ext } = parse(file);
        if (ext !== ".md") {
            continue;
        }

        const filePath = resolve(dirSongs, file);
        const content = await readFile(filePath, "utf8");
        const statFile = await stat(filePath);

        const { title, artist, rating } = parseSong(content);

        if (title && artist) {
            songs.push({ file: name, type: "song", title, artist, rating, lastModified: statFile.mtime.toISOString() });
        } else {
            console.log("ERROR FILE:", file);
        }
    }

    const filesPoems = await readdir(dirPoems, "utf8");
    for (const file of filesPoems) {
        const { name, ext } = parse(file);
        if (ext !== ".md") {
            continue;
        }

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
                if (title === "...") {
                    title = poem.split("\n")[1].trim();
                }
                songs.push({
                    file: name,
                    type: "poem",
                    title,
                    artist,
                    bookTitle,
                    rating: 0,
                    lastModified: statFile.mtime.toISOString(),
                });
            }
        }
    }

    return songs;
}

function getLine(symbol: string, content: string): null | string {
    for (const line of content.split("\n")) {
        if (line.startsWith(symbol)) {
            return line.substring(symbol.length).trim();
        }
    }
    return null;
}
