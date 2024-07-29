export type Song = {
    file: string,
    type: "song" | "poem",
    artist: string,
    title: string,
    lastModified: string,
    bookTitle?: string,
};
