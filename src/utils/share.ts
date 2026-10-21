/**
 * Utilities for song sharing and smart URL construction.
 */

export interface BuildShareUrlOptions {
    origin?: string;
    file: string;
    key?: string;
    defaultKey?: string;
    includeKey?: boolean;
}

/**
 * Constructs a clean or customized share URL for a song.
 * If includeKey is true and key differs from the original default key,
 * the transposition parameter (?key=...) is appended.
 */
export function buildShareUrl(options: BuildShareUrlOptions): string {
    const { origin, file, key, defaultKey, includeKey = true } = options;

    const cleanOrigin = origin ? origin.replace(/\/+$/, "") : "";
    const cleanFile = encodeURIComponent(file.replace(/^\/+/, ""));
    const basePath = cleanOrigin ? `${cleanOrigin}/${cleanFile}` : `/${cleanFile}`;

    if (includeKey && key && (!defaultKey || key !== defaultKey)) {
        return `${basePath}?key=${encodeURIComponent(key)}`;
    }

    return basePath;
}

/**
 * Generates user-friendly description text for mobile sharing.
 */
export function getShareText(title: string, artist: string, key?: string): string {
    const keyInfo = key ? ` (tónina ${key})` : "";
    return `Zahraj si se mnou: ${title} – ${artist}${keyInfo}`;
}

/**
 * Safely checks if Web Share API is available in the current environment.
 */
export function canUseWebShare(): boolean {
    return (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
    );
}
