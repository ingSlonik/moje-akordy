/**
 * Utilities for the "live follow" feature (/live/<code>).
 */
import { LiveTarget } from "../../types";

export const LIVE_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "B", "H"];

/** Custom window event dispatched when the song transposition changes (URL updated via replaceState). */
export const SONG_KEY_CHANGE_EVENT = "songkeychange";

/** First URL segments that are not songs/poems. */
const RESERVED_SEGMENTS = ["admin", "editor", "reset-password", "404", "live"];

/** Polling interval of followers [ms]. */
export const LIVE_POLL_INTERVAL = 5000;

/** Live code alphabet: easy to read aloud and type (no 0/O, 1/I/L). */
export const LIVE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const LIVE_CODE_LENGTH = 6;
const LIVE_CODE_REGEX = new RegExp(`^[${LIVE_CODE_ALPHABET}]{${LIVE_CODE_LENGTH}}$`);

/** Normalizes user input / URL segment: "k7f 3q9" -> "K7F3Q9". */
export function normalizeLiveCode(input: string): string {
    return (input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidLiveCode(code: string): boolean {
    return LIVE_CODE_REGEX.test(code);
}

/** Human friendly form "K7F 3Q9". */
export function formatLiveCode(code: string): string {
    return code.length === LIVE_CODE_LENGTH ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

/** localStorage key: the user already knows about live mode (hides the onboarding hint). */
export const LIVE_HINT_STORAGE_KEY = "live-hint-seen";

export function markLiveHintSeen() {
    try {
        localStorage.setItem(LIVE_HINT_STORAGE_KEY, "1");
    } catch {
        // Private mode etc.
    }
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/**
 * Resolves router path segments (+ optional ?key=) into a live target.
 * Returns null for pages which should not be broadcast (index, admin, editor, live page...).
 */
export function getLiveTarget(path: string[], key?: string | null): LiveTarget | null {
    if (path.length === 0 || !path[0] || RESERVED_SEGMENTS.includes(path[0])) return null;

    if (path.length === 1) {
        const target: LiveTarget = { type: "song", file: safeDecode(path[0]) };
        if (key && LIVE_KEYS.includes(key)) target.key = key;
        return target;
    }

    if (path.length === 2 && path[1]) {
        return { type: "poem", file: safeDecode(path[0]), title: safeDecode(path[1]) };
    }

    return null;
}

export function isSameLiveTarget(a?: LiveTarget | null, b?: LiveTarget | null): boolean {
    if (!a || !b) return a === b;
    return a.type === b.type
        && a.file === b.file
        && (a.title || "") === (b.title || "")
        && (a.key || "") === (b.key || "");
}

/** Regular (non-live) URL of the target, used for "Odpojit". */
export function getLiveTargetUrl(target: LiveTarget): string {
    const base = `/${encodeURIComponent(target.file)}`;
    if (target.type === "poem") return `${base}/${encodeURIComponent(target.title || "")}`;
    return target.key ? `${base}?key=${encodeURIComponent(target.key)}` : base;
}
