/**
 * Headers:
 * # - title
 * @ - artist
 * $ - scroll speed [ms per line]
 * % - rating [%]
 * 
 * Content
 * // - comment
 * [x] - chords
 * ``` x ``` - tabs
 * 
 * Output text
 * "; " - normal text
 * ";C" - comment
 * ";T" - tabs
 * ";A" - chord
 */

import { SongDetail } from "../../types";

export function parseSong(song: string): SongDetail {
    const { title, artist, scrollSpeed, rating, content } = parseHeaders(song);

    const text = content
        .replace(/```([\s\S]*?)```/g, (_, p1) => `;T${p1.replaceAll(";", "")}; `)
        .replace(/\/\/(.*?)\n/g, (_, p1) => `;C${p1}; `)
        .replace(/\[(.*?)\]/g, (_, p1) => `;A${p1}; `);

    return { title, artist, scrollSpeed, rating, content, text };
}


function parseHeaders(song: string) {
    let title = "";
    let artist = "";
    let scrollSpeed = 2000;
    let rating = 0;

    const content: string[] = [];

    for (const line of song.split("\n")) {
        switch (line.charAt(0)) {
            case "#":
                title = line.slice(1).trim();
                break;
            case "@":
                artist = line.slice(1).trim();
                break;
            case "$":
                scrollSpeed = parseInt(line.slice(1));
                break;
            case "%":
                rating = parseInt(line.slice(1));
                break;
            default:
                content.push(line);
                break;
        }
    }

    return {
        title,
        artist,
        scrollSpeed,
        rating,
        content: content.join("\n").trim() + "\n",
    };
}