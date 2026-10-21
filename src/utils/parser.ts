import { SongToken } from "../../types";

/**
 * Tokenizes song body content into text, chords, comments, and tabs.
 *
 * Syntax:
 * - [C] -> chord: "C"
 * - // comment -> comment: "comment"
 * - ```tab``` -> tab: "tab"
 * - other -> text
 */
export function tokenizeSongContent(content: string): SongToken[] {
    const tokens: SongToken[] = [];
    const regex = /(```[\s\S]*?```)|(\/\/[^\n]*)|(\[.*?\])/g;

    let lastIndex = 0;
    for (const match of content.matchAll(regex)) {
        if (match.index !== undefined && match.index > lastIndex) {
            tokens.push({ type: "text", value: content.slice(lastIndex, match.index) });
        }

        if (match[1]) {
            let val = match[1].slice(3, -3);
            if (val.startsWith("\n")) val = val.substring(1);
            if (val.endsWith("\n")) val = val.substring(0, val.length - 1);
            tokens.push({ type: "tab", value: val });
        } else if (match[2]) {
            tokens.push({ type: "comment", value: match[2].slice(2).trim() });
        } else if (match[3]) {
            tokens.push({ type: "chord", value: match[3].slice(1, -1) });
        }

        lastIndex = (match.index ?? 0) + match[0].length;
    }

    if (lastIndex < content.length) {
        tokens.push({ type: "text", value: content.slice(lastIndex) });
    }

    return tokens;
}

/**
 * Parses raw markdown formatted song with header lines:
 * # Title
 * @ Artist
 * $ ScrollSpeed
 * % Rating
 */
export function parseMarkdownSongInput(rawText: string): {
    title: string;
    artist: string;
    scrollSpeed: number;
    rating: number;
    content: string;
} {
    let title = "";
    let artist = "";
    let scrollSpeed = 2000;
    let rating = 0;
    const contentLines: string[] = [];

    for (const line of rawText.split("\n")) {
        switch (line.charAt(0)) {
            case "#":
                title = line.slice(1).trim();
                break;
            case "@":
                artist = line.slice(1).trim();
                break;
            case "$": {
                const parsed = parseInt(line.slice(1));
                if (!isNaN(parsed)) scrollSpeed = parsed;
                break;
            }
            case "%": {
                const parsed = parseInt(line.slice(1));
                if (!isNaN(parsed)) rating = parsed;
                break;
            }
            default:
                contentLines.push(line);
                break;
        }
    }

    return {
        title,
        artist,
        scrollSpeed,
        rating,
        content: contentLines.join("\n").trim() + "\n",
    };
}

/**
 * Creates a deterministic, URL-safe slug from artist and title.
 * e.g. "Karel Kryl", "Morituri te salutant" -> "karel-kryl-morituri-te-salutant"
 */
export function slugifySongId(artist: string, title: string): string {
    const combined = `${artist} ${title}`;
    return combined
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
