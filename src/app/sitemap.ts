import { MetadataRoute } from 'next'

import { location } from "@/services/common";
import { Song } from '../../types';


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const res = await fetch(location + '/api/song', { cache: "no-store" });
    const songs = await res.json() as Song[];

    const lastModified = songs.reduce((last, song) => song.lastModified > last ? song.lastModified : last, "");

    return [
        {
            url: `${location}/`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 1,
        },
        ...songs.map(song => ({
            url: song.type === "song" ? `${location}/song/${song.file}` : `${location}/poem/${song.file}/${encodeURIComponent(song.title)}`,
            lastModified: song.lastModified,
            changeFrequency: 'monthly' as any, // ??? type nonsense
            priority: song.type === "song" ? 0.7 : 0.4,
        })),
    ];
}