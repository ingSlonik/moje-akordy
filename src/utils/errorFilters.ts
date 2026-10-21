/**
 * Utilities and filtering helpers for Admin Error Logs.
 */

export type ErrorRecordItem = {
    id: string;
    name: string;
    message: string;
    stack: string;
    url: string;
    localId: string;
    sessionId: string;
    userAgent: string;
    ip: string;
    dateFormatted: string;
    timestamp: number;
    raw: any;
};

export type ErrorFilterOptions = {
    /** If true, excludes all errors occurring on /admin or /admin/... URLs */
    excludeAdmin?: boolean;
    /** Substring or prefix pattern (e.g. /app, !/app) to include or exclude */
    urlFilter?: string;
    /** Error type/name to match (e.g. "TypeError", or "all" for any) */
    errorType?: string;
    /** Fulltext search string across message, name, stack, url, localId, sessionId, ip */
    searchQuery?: string;
};

/**
 * Checks if a given URL belongs to the /admin section.
 * Handles full URLs (e.g. http://localhost:1111/admin, https://domain.com/admin/users)
 * as well as relative paths (/admin, /admin/analytics).
 */
export function isUrlAdmin(rawUrl?: string | null): boolean {
    if (!rawUrl) return false;
    const trimmed = rawUrl.trim();
    if (!trimmed) return false;

    try {
        const parsed = new URL(trimmed, "http://dummy.local");
        const pathname = parsed.pathname.toLowerCase();
        return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.endsWith("/admin");
    } catch {
        return trimmed.toLowerCase().includes("/admin");
    }
}

/**
 * Normalizes raw error records from easyAnalytics into standard ErrorRecordItem objects.
 */
export function normalizeErrorRecords(rawErrors: any[]): ErrorRecordItem[] {
    return rawErrors.map((r, idx) => {
        const errObj = r.error || {};
        const name = errObj.name || r.name || "Error";
        const message = errObj.message || r.message || "No error message provided";
        const stack = errObj.stack || r.stack || "";
        const dateVal = r.serverDate || r.localDate || r.created;
        const dateFormatted = dateVal ? new Date(dateVal).toLocaleString() : "Unknown date";
        const timestamp = dateVal ? new Date(dateVal).getTime() : 0;
        const id = r._id || `err_${idx}_${timestamp}`;

        return {
            id,
            name,
            message,
            stack,
            url: r.url || "",
            localId: r.localId || "",
            sessionId: r.sessionId || "",
            userAgent: r.userAgent || "",
            ip: r.ip || "",
            dateFormatted,
            timestamp,
            raw: r,
        };
    });
}

/**
 * Filters normalized error records according to the provided filter options.
 */
export function filterErrors(items: ErrorRecordItem[], options: ErrorFilterOptions): ErrorRecordItem[] {
    const excludeAdmin = options.excludeAdmin ?? false;
    const rawUrlFilter = (options.urlFilter || "").trim();
    const isExcludeUrl = rawUrlFilter.startsWith("!") || rawUrlFilter.startsWith("-");
    const cleanUrlPattern = (isExcludeUrl ? rawUrlFilter.slice(1).trim() : rawUrlFilter).toLowerCase();

    const errorType = options.errorType && options.errorType !== "all" ? options.errorType : null;
    const searchQuery = (options.searchQuery || "").trim().toLowerCase();

    return items.filter(item => {
        // 1. Primary Filter: Exclude admin URLs
        if (excludeAdmin && isUrlAdmin(item.url)) {
            return false;
        }

        // 2. URL Filter (inclusion or exclusion with !/pattern)
        if (cleanUrlPattern) {
            const itemUrlLower = (item.url || "").toLowerCase();
            if (isExcludeUrl) {
                if (itemUrlLower.includes(cleanUrlPattern)) {
                    return false;
                }
            } else {
                if (!itemUrlLower.includes(cleanUrlPattern)) {
                    return false;
                }
            }
        }

        // 3. Error Type / Name Filter
        if (errorType && item.name !== errorType) {
            return false;
        }

        // 4. Fulltext Search Query
        if (searchQuery) {
            const matches =
                item.name.toLowerCase().includes(searchQuery) ||
                item.message.toLowerCase().includes(searchQuery) ||
                item.stack.toLowerCase().includes(searchQuery) ||
                item.url.toLowerCase().includes(searchQuery) ||
                item.localId.toLowerCase().includes(searchQuery) ||
                item.sessionId.toLowerCase().includes(searchQuery) ||
                item.ip.toLowerCase().includes(searchQuery);

            if (!matches) {
                return false;
            }
        }

        return true;
    });
}
