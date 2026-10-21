import React, { useEffect, useState } from "react";

const fontSize = 12;

export type AutoScrollProps = {
    speed?: number;
    refScroll?: React.RefObject<null | HTMLElement>;
    defaultEnabled?: boolean;
};

export default function AutoScroll({ speed = 2000, refScroll, defaultEnabled = true }: AutoScrollProps) {
    const [scroll, setScroll] = useState(defaultEnabled);

    useEffect(() => {
        if (!scroll || !speed || speed <= 0) return;

        const frameRate = Math.max(10, speed / fontSize);
        const shift = 1;

        const interval = setInterval(() => {
            const el = refScroll?.current;
            const isScrollable =
                Boolean(el &&
                el.scrollHeight > el.clientHeight &&
                typeof window !== "undefined" &&
                window.getComputedStyle(el).overflowY !== "visible" &&
                window.getComputedStyle(el).overflowY !== "hidden");

            if (isScrollable && el) {
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
                    setScroll(false);
                    return;
                }
                el.scrollTop += shift;
            } else if (typeof window !== "undefined") {
                const scrollHeight = Math.max(
                    document.documentElement.scrollHeight,
                    document.body.scrollHeight
                );
                if (window.innerHeight + Math.ceil(window.scrollY) >= scrollHeight - 2) {
                    setScroll(false);
                    return;
                }
                window.scrollBy({ top: shift, behavior: "auto" });
            }
        }, frameRate);

        return () => clearInterval(interval);
    }, [scroll, speed, refScroll]);

    return (
        <div className="auto-scroll-widget">
            <button
                type="button"
                className={`btn-auto-scroll ${scroll ? "scrolling" : ""}`}
                onClick={() => setScroll(!scroll)}
                title="Plynulé automatické posouvání textu písně"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="auto-scroll-icon"
                >
                    <path d="M12 5v14" />
                    <path d="m19 12-7 7-7-7" />
                </svg>
                <span>Auto scroll: {scroll ? "ZAP" : "VYP"}</span>
            </button>
        </div>
    );
}
