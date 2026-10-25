import React from "react";

export type LiveIconProps = {
    size?: number;
    /** Animated indicator (used while broadcasting / following). */
    on?: boolean;
    className?: string;
};

/**
 * Symbol of "Živé hraní": two connected musical notes singing together (duet / ensemble).
 */
export default function LiveIcon({ size = 18, on = false, className = "" }: LiveIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`live-icon ${on ? "is-on" : ""} ${className}`}
            aria-hidden="true"
            focusable="false"
        >
            {/* Left note head */}
            <path
                d="M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                fill="currentColor"
                stroke="none"
                className="live-note live-note-1"
            />
            {/* Right note head */}
            <path
                d="M20 15a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                fill="currentColor"
                stroke="none"
                className="live-note live-note-2"
            />
            {/* Stems */}
            <path d="M9 18V6" className="live-stem live-stem-1" />
            <path d="M20 15V3" className="live-stem live-stem-2" />
            {/* Connecting beams linking the notes together */}
            <path d="M9 6L20 3" strokeWidth="2.5" className="live-beam" />
            <path d="M9 9.5L20 6.5" strokeWidth="2" className="live-beam-sub" />
            {/* Radiating sound waves when active */}
            <path d="M5 2.5a3.5 3.5 0 0 1 4-1" className="live-icon-wave live-icon-wave-1" />
            <path d="M1 4a6.5 6.5 0 0 1 6-3.5" className="live-icon-wave live-icon-wave-2" />
        </svg>
    );
}
