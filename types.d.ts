export type Song = {
    file: string,
    type: "song" | "poem",
    artist: string,
    title: string,
    rating: number,
    lastModified: string,
    bookTitle?: string,
};
