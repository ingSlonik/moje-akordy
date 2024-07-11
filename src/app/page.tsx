import Link from "next/link";
import { Song } from "../../types";

const location = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://akordy.paulu.cz";

export default async function Home() {
  const res = await fetch(location + '/api/song', { cache: "no-store" });
  const songs = await res.json() as Song[];

  return <main>
    <h1>Moje akordy</h1>
    <p>Zde jsou písničky, které jsem si vybral... <br />No dobře, prostě potřebuji okordy ve všech solkách a nikde je tak nemají, tak jsem si je musel přepsat. Stačí?</p>
    <ul>
      {songs.map(song => <li key={song.file}>
        <Link href={`/${song.file}`}>{song.title} - {song.artist}</Link>
      </li>)}
    </ul>
  </main>;
}
