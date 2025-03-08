import type { APIDefinition, Endpoint } from "typed-client-server-api";

// ---------------------- API --------------------------
export type API = APIDefinition<{
  // countdown
  getSongs: Endpoint<{}, Song[]>,
  getSong: Endpoint<{ file: string }, SongDetail>,
  getSongRaw: Endpoint<{ file: string }, string>,
  getPoem: Endpoint<{ file: string, title: string }, PoemDetail>,

  // admin
  addLogin: Endpoint<{ username: string, password: string }, { name: string, token: string }>,
  addSong: Endpoint<{ file: string }, void>,
  updateSong: Endpoint<{ file: string, text: string }, void>,
}>;
// ---------------------- Types --------------------------

export type Song = {
  file: string;
  type: "song" | "poem";
  artist: string;
  title: string;
  rating: number;
  lastModified: string;
  bookTitle?: string;
};

export type SongDetail = {
  title: string;
  artist: string;
  scrollSpeed: number;
  rating: number;
  content: string;
  text: string;
};

export type PoemDetail = {
  title: string;
  artist: string | null;
  bookTitle: string | null;
  text: string;
};
