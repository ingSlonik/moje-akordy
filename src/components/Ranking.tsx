import React from "react";

export default function Ranking({ ranking, size = 16 }: { ranking: number; size?: number }) {
  return (
    <div>
      <div
        className="ranking"
        style={{
          display: "inline-block",
          height: size,
          width: `${Math.round(size * ranking / 100 * 5)}px`,
        }}
      />
      {ranking > 0 && ranking <= 20 && (
        <span
          style={{ fontSize: "12px", fontStyle: "italic", color: "gray" }}
        >
          Učím se
        </span>
      )}
    </div>
  );
}
