type RenderingData = {
  songs?: Song[];
  song?: null | SongDetail;
  poem?: null | PoemDetail;
};

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
