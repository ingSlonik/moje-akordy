"use client"

import { useEffect, useState } from "react";

const fontSize = 12 * window.devicePixelRatio;
// const frameRate = 60;

/**
 * 
 * @param speed Speed in ms for one text line.
 * @returns 
 */
export default function AutoScroll({ speed = 1000 }: { speed: number }) {
    const [scroll, setScroll] = useState(false);

    useEffect(() => {
        if (scroll) return;

        // const shift = Math.ceil(frameRate * fontSize / speed);
        const frameRate = speed / fontSize;
        const shift = 1;
        const int = setInterval(() => {
            window.scrollTo(0, window.scrollY + shift);
        }, frameRate);
        return () => clearInterval(int);
    }, [scroll, speed]);

    return <div className="auto-scroll">
        <button onClick={() => setScroll(!scroll)}>Auto scroll ({scroll ? "off" : "on"})</button>
    </div>;
}