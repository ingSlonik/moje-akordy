import { Fragment, useState } from "react";

import Ranking from "./Ranking";

import { SongDetail, SongToken } from "../../types";

const chords = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B", "H"];

export default function Song({ title, artist, text, rating }: SongDetail) {
  const basicChord = getBasicChord(text);

  const [transposition, setTransposition] = useState(basicChord);

  const transpositionShift = chords.indexOf(transposition) - chords.indexOf(basicChord);

  const basicTransposedChord = getTransposedChord(basicChord, transpositionShift);

  return (
    <>
      <h1 className="title" style={{ marginBottom: "8px" }}>{title}</h1>
      <div className="song-meta" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <h2 className="artist" style={{ margin: 0, color: "var(--color-text-muted)" }}>{artist}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--color-bg)", padding: "6px 12px", borderRadius: "var(--radius-full)" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-muted)" }}>Umím:</span>
          <Ranking ranking={rating} />
        </div>
      </div>

      <div className="transposition-control" style={{ marginBottom: "24px", background: "var(--color-card-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)", display: "inline-block" }}>
        <strong style={{ display: "block", marginBottom: "12px", color: "var(--color-text-muted)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transpozice</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {chords.map((chord) => {
            const isActive = chord === basicTransposedChord;
            return (
              <a
                key={chord}
                style={{
                  cursor: "pointer",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive ? "white" : "var(--color-text)",
                  fontWeight: isActive ? "bold" : "500",
                  textDecoration: "none",
                  transition: "var(--transition-fast)"
                }}
                onClick={() => setTransposition(chord)}
              >
                {chord}
              </a>
            );
          })}
        </div>
      </div>

      <div className="song">
        {text.map((token, i) => {
          if (token.type === "tab") {
            return <pre key={i}>{token.value}</pre>;
          } else if (token.type === "chord") {
            let chord = token.value;
            // replace B to H
            if (chord.startsWith("A#")) chord = "B" + chord.substring(2);

            return <sup key={i}>{getTransposedChord(chord, transpositionShift)}</sup>;
          } else if (token.type === "comment") {
            return <span key={i} className="comment">{token.value}</span>;
          } else if (token.type === "text") {
            return token.value;
          } else {
            return null;
          }
        })}
      </div>
    </>
  );
}

function getBasicChord(tokens: SongToken[]) {
  const firstChordToken = tokens.find(t => t.type === "chord");
  if (!firstChordToken) return "C";

  const chordBase = getChordBase(firstChordToken.value);
  if (chords.includes(chordBase)) {
    return chordBase;
  }

  return "C";
}

function getTransposedChord(chord: string, transpositionShift: number): string {
  if (chord.includes("/")) {
    return chord.split("/")
      .map(c => getTransposedChord(c, transpositionShift))
      .join("/");
  }
  const isSharp = chord.charAt(1) === "#";
  const chordBase = chord.substring(0, isSharp ? 2 : 1);

  let index = chords.indexOf(chordBase);
  if (index === -1) return chord;

  index = (index + transpositionShift + chords.length) % chords.length;
  return chords[index] + chord.substring(isSharp ? 2 : 1);
}

function getChordBase(chord: string) {
  const isSharp = chord.charAt(1) === "#";
  return chord.substring(0, isSharp ? 2 : 1);
}
