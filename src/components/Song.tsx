"use client"
import { Fragment, useState } from "react";

import AutoScroll from "./AutoScroll";
import Ranking from "./Ranking";

import { SongDetail } from "../../types";


const chords = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B", "H"];

export default function Song({ title, artist, text, rating, scrollSpeed }: SongDetail) {

    const basicChord = getBasicChord(text);

    const [transposition, setTransposition] = useState(basicChord);

    const transpositionShift = chords.indexOf(transposition) - chords.indexOf(basicChord);

    const basicTransposedChord = getTransposedChord(basicChord, transpositionShift);

    return <>
        <AutoScroll speed={scrollSpeed} />

        <h1 className="title">{title}</h1>
        <h2 className="artist">{artist}</h2>
        <Ranking ranking={rating} />

        <strong>Transpozice</strong><br />
        {chords.map((chord, i) => <Fragment key={chord}>
            <a style={{
                cursor: "pointer",
                color: chord === basicTransposedChord ? "black" : "blue",
                fontWeight: chord === basicChord || chord === basicTransposedChord ? "bold" : "normal"
            }}
                onClick={() => setTransposition(chord)}
            >
                {chord}
            </a>
            {i < chords.length - 1 && <span> / </span>}
        </Fragment>)}

        <p className="song">
            {text.split(";").map((t, i) => {
                if (t.startsWith("T")) {
                    return <pre key={i}>{t.substring(1)}</pre>;
                } else if (t.startsWith("A")) {
                    let chord = t.substring(1);
                    // replace B to H
                    if (chord.startsWith("A#")) chord = "B" + chord.substring(2);

                    return <sup key={i}>{getTransposedChord(chord, transpositionShift)}</sup>;
                } else if (t.startsWith("C")) {
                    return <span key={i} className="comment">{t.substring(1).trim()}</span>;
                } else if (t.startsWith(" ")) {
                    return t.substring(1);
                } else {
                    return null;
                }
            })}
        </p>
    </>;
}

function getBasicChord(text: string) {
    const chord = text.split(";A");
    if (!chord[1]) return "C";

    const chordBase = getChordBase(chord[1]);
    if (chords.includes(chordBase))
        return chordBase;

    return "C";
}

function getTransposedChord(chord: string, transpositionShift: number) {
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

