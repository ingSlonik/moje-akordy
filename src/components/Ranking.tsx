export default function Ranking({ ranking, size = 16 }: { ranking: number, size?: number }) {
    return <div className="ranking" style={{ height: size, width: `${Math.round(size * ranking / 100 * 5)}px` }} />;
}