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
 * ```\n x \n``` - tabs
 *
 * Output text
 * "; " - normal text
 * ";C" - comment
 * ";T" - tabs
 * ";A" - chord
 */

import { PoemDetail, SongDetail, SongToken } from "../types";

export function parseSong(song: string): SongDetail {
  const { title, artist, scrollSpeed, rating, content } = parseHeaders(song);

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

  return { title, artist, scrollSpeed, rating, content, text: tokens };
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

// TODO: optimize
export function parsePoem(content: string, title: string): null | PoemDetail {
  const artist = getLine("@", content);
  const bookTitle = getLine("# ", content);

  let indexPoem = content.indexOf(`## ${title}`);
  // for ... poem:
  if (indexPoem === -1) {
    indexPoem = content.indexOf(`## ...\n${title}`);
  }
  if (indexPoem === -1) {
    return null;
  }

  const indexEndPoem = content.indexOf(`## `, indexPoem + 2);

  const text = content.slice(content.indexOf(`\n`, indexPoem), indexEndPoem);

  // TODO: check if mounted
  return { title, artist, bookTitle, text };
}

function getLine(symbol: string, content: string): null | string {
  for (const line of content.split("\n")) {
    if (line.startsWith(symbol)) {
      return line.substring(symbol.length).trim();
    }
  }
  return null;
}
