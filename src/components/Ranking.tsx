import React, { useState } from "react";

export type RankingProps = {
    ranking: number;
    size?: number;
    interactive?: boolean;
    onChange?: (newRanking: number) => void;
};

export function getEffectiveSongRating(
    song: { rating?: number; defaultRating?: number; ratings?: Record<string, number>; authorId?: string },
    userId?: string,
    isLoggedIn?: boolean
): number {
    if (isLoggedIn && userId) {
        if (song.ratings && typeof song.ratings[userId] === "number") {
            return song.ratings[userId];
        }
        if (song.authorId === userId) {
            return song.defaultRating ?? song.rating ?? 0;
        }
        return 0;
    }
    return song.defaultRating ?? song.rating ?? 0;
}

export default function Ranking({ ranking, size = 18, interactive = false, onChange }: RankingProps) {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const activeStars = hoverIndex !== null
        ? hoverIndex
        : Math.max(0, Math.min(5, Math.round(ranking / 20)));

    function handleClick(starIndex: number, e: React.MouseEvent) {
        e.stopPropagation();
        if (!interactive || !onChange) return;
        const targetRating = starIndex * 20;
        const currentStar = Math.round(ranking / 20);
        // If clicking on already selected star, toggle to 0
        if (currentStar === starIndex) {
            onChange(0);
        } else {
            onChange(targetRating);
        }
    }

    if (interactive && onChange) {
        return (
            <div
                className="ranking-container ranking-interactive"
                onMouseLeave={() => setHoverIndex(null)}
                title={`Hodnocení: ${ranking}% (klikněte pro změnu)`}
            >
                <div className="ranking-stars">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                        const isFilled = starIndex <= activeStars;
                        return (
                            <button
                                type="button"
                                key={starIndex}
                                className={`star-btn ${isFilled ? "filled" : "empty"}`}
                                onMouseEnter={() => setHoverIndex(starIndex)}
                                onClick={(e) => handleClick(starIndex, e)}
                                aria-label={`Hodnocení ${starIndex * 20}%`}
                            >
                                <svg
                                    width={size}
                                    height={size}
                                    viewBox="0 0 24 24"
                                    className="star-svg"
                                >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </button>
                        );
                    })}
                </div>
                {ranking > 0 && ranking <= 20 && (
                    <span className="learning-badge">Učím se</span>
                )}
            </div>
        );
    }

    return (
        <div className="ranking-container" title={`Hodnocení: ${ranking}%`}>
            <div className="ranking-stars">
                {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = starIndex <= activeStars;
                    return (
                        <span
                            key={starIndex}
                            className={`star-static ${isFilled ? "filled" : "empty"}`}
                        >
                            <svg
                                width={size}
                                height={size}
                                viewBox="0 0 24 24"
                                className="star-svg"
                            >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </span>
                    );
                })}
            </div>
            {ranking > 0 && ranking <= 20 && (
                <span className="learning-badge">Učím se</span>
            )}
        </div>
    );
}
