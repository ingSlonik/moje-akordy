import React, { useState, useMemo } from "react";
import {
    ErrorRecordItem,
    isUrlAdmin,
    normalizeErrorRecords,
    filterErrors,
} from "../../utils/errorFilters";

const STORAGE_KEY_EXCLUDE_ADMIN = "easy_admin_errors_exclude_admin";

function getInitialExcludeAdmin(): boolean {
    if (typeof window === "undefined") return true;
    try {
        const saved = localStorage.getItem(STORAGE_KEY_EXCLUDE_ADMIN);
        if (saved !== null) {
            return saved === "true";
        }
    } catch {
        // Fallback
    }
    return true; // Default: exclude /admin errors so dev actions don't skew customer error logs
}

type ErrorsTabProps = {
    errors: any[];
    loading: boolean;
    errorMsg: string;
};

type ViewMode = "grouped" | "timeline";

export default function ErrorsTab({ errors, loading, errorMsg }: ErrorsTabProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grouped");
    const [excludeAdmin, setExcludeAdmin] = useState<boolean>(getInitialExcludeAdmin);
    const [urlFilter, setUrlFilter] = useState<string>("");
    const [errorTypeFilter, setErrorTypeFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);

    const handleToggleExcludeAdmin = (val: boolean) => {
        setExcludeAdmin(val);
        try {
            localStorage.setItem(STORAGE_KEY_EXCLUDE_ADMIN, String(val));
        } catch {}
    };

    // Normalize error record data
    const normalizedErrors = useMemo(() => {
        return normalizeErrorRecords(errors);
    }, [errors]);

    // Count how many errors occurred on /admin
    const adminErrorsCount = useMemo(() => {
        return normalizedErrors.filter(e => isUrlAdmin(e.url)).length;
    }, [normalizedErrors]);

    // Unique error types and their frequencies
    const availableErrorTypes = useMemo(() => {
        const counts = new Map<string, number>();
        for (const e of normalizedErrors) {
            counts.set(e.name, (counts.get(e.name) || 0) + 1);
        }
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    }, [normalizedErrors]);

    // Check if any non-default filters are active
    const hasActiveFilters = useMemo(() => {
        return !excludeAdmin || urlFilter.trim() !== "" || errorTypeFilter !== "all" || searchQuery.trim() !== "";
    }, [excludeAdmin, urlFilter, errorTypeFilter, searchQuery]);

    const resetFilters = () => {
        handleToggleExcludeAdmin(true);
        setUrlFilter("");
        setErrorTypeFilter("all");
        setSearchQuery("");
    };

    const handleFilterUrl = (url: string) => {
        if (!url) return;
        try {
            const parsed = new URL(url, "http://dummy.local");
            setUrlFilter(parsed.pathname);
        } catch {
            setUrlFilter(url);
        }
        if (isUrlAdmin(url) && excludeAdmin) {
            handleToggleExcludeAdmin(false);
        }
    };

    // Filter errors based on active criteria
    const filteredErrors = useMemo(() => {
        return filterErrors(normalizedErrors, {
            excludeAdmin,
            urlFilter,
            errorType: errorTypeFilter,
            searchQuery,
        });
    }, [normalizedErrors, excludeAdmin, urlFilter, errorTypeFilter, searchQuery]);

    // Grouping by error key (Name + Message) sorted by frequency descending
    const groupedErrors = useMemo(() => {
        const map = new Map<string, { key: string; name: string; message: string; count: number; latestTimestamp: number; instances: ErrorRecordItem[] }>();

        for (const item of filteredErrors) {
            const key = `${item.name}:::${item.message}`;
            const existing = map.get(key);
            if (existing) {
                existing.count += 1;
                if (item.timestamp > existing.latestTimestamp) {
                    existing.latestTimestamp = item.timestamp;
                }
                existing.instances.push(item);
            } else {
                map.set(key, {
                    key,
                    name: item.name,
                    message: item.message,
                    count: 1,
                    latestTimestamp: item.timestamp,
                    instances: [item],
                });
            }
        }

        // Sort groups by occurrence count descending, then by latestTimestamp
        return Array.from(map.values()).sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return b.latestTimestamp - a.latestTimestamp;
        });
    }, [filteredErrors]);

    // Sorted chronological list for timeline mode
    const timelineErrors = useMemo(() => {
        return [...filteredErrors].sort((a, b) => b.timestamp - a.timestamp);
    }, [filteredErrors]);

    return (
        <div>
            {/* Header & Controls */}
            <div className="admin-errors-header-bar">
                <div>
                    <h3 className="admin-errors-title">Frontend & Client Error Logs</h3>
                    <p className="admin-errors-subtitle">
                        Aggregated client-side runtime errors and unhandled exceptions recorded by easy-analytics.
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="admin-view-mode-toggle">
                    <button
                        type="button"
                        className={`admin-view-btn ${viewMode === "grouped" ? "active" : ""}`}
                        onClick={() => setViewMode("grouped")}
                    >
                        Grouped ({groupedErrors.length})
                    </button>
                    <button
                        type="button"
                        className={`admin-view-btn ${viewMode === "timeline" ? "active" : ""}`}
                        onClick={() => setViewMode("timeline")}
                    >
                        Timeline ({filteredErrors.length})
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="admin-errors-toolbar">
                {/* 1. Exclude Admin Errors Toggle */}
                <label className="admin-filter-checkbox-label">
                    <input
                        type="checkbox"
                        checked={excludeAdmin}
                        onChange={(e) => handleToggleExcludeAdmin(e.target.checked)}
                    />
                    <span>
                        Exclude /admin errors {adminErrorsCount > 0 && <span className="admin-count-pill">({adminErrorsCount})</span>}
                    </span>
                </label>

                {/* 2. Error Type Filter Dropdown */}
                <div className="admin-filter-group">
                    <label>Type:</label>
                    <select
                        className="admin-select"
                        value={errorTypeFilter}
                        onChange={(e) => setErrorTypeFilter(e.target.value)}
                    >
                        <option value="all">All Types ({normalizedErrors.length})</option>
                        {availableErrorTypes.map(([type, count]) => (
                            <option key={type} value={type}>
                                {type} ({count})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. URL Filter */}
                <div className="admin-filter-group">
                    <label>URL / Path:</label>
                    <input
                        type="text"
                        className="admin-input-compact"
                        placeholder="e.g. /app or !/admin"
                        value={urlFilter}
                        onChange={(e) => setUrlFilter(e.target.value)}
                    />
                </div>

                {/* 4. Fulltext Search */}
                <div className="admin-filter-group flex-1">
                    <input
                        type="text"
                        className="admin-input-compact w-full"
                        placeholder="Search message, stack trace, IP, userAgent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        className="admin-filter-preset-btn admin-filter-clear-btn"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>
                )}
            </div>

            {/* Status Feedback */}
            {loading && <p className="admin-status-loading">Loading error logs...</p>}
            {errorMsg && <p className="admin-status-error text-error">{errorMsg}</p>}

            {!loading && !errorMsg && filteredErrors.length === 0 && (
                <div className="admin-card text-center">
                    <h4>No errors found</h4>
                    <p className="text-muted">
                        {normalizedErrors.length === 0
                            ? "No runtime errors have been logged for this period."
                            : "No errors match your active filter criteria."}
                    </p>
                    {hasActiveFilters && (
                        <button type="button" className="btn btn-secondary mt-sm" onClick={resetFilters}>
                            Clear active filters
                        </button>
                    )}
                </div>
            )}

            {/* VIEW MODE 1: GROUPED BY ERROR TYPE + MESSAGE */}
            {!loading && !errorMsg && filteredErrors.length > 0 && viewMode === "grouped" && (
                <div className="admin-errors-grouped-list">
                    {groupedErrors.map((group) => {
                        const isExpanded = expandedGroupKey === group.key;
                        const latestDateFormatted = new Date(group.latestTimestamp).toLocaleString();

                        return (
                            <div key={group.key} className="admin-error-group-card">
                                <div
                                    className="admin-error-group-header"
                                    onClick={() => setExpandedGroupKey(isExpanded ? null : group.key)}
                                >
                                    <div className="admin-error-group-meta">
                                        <span className="admin-error-badge-count">
                                            {group.count}×
                                        </span>
                                        <span className="admin-error-name">
                                            {group.name}
                                        </span>
                                        <span className="admin-error-date">
                                            Latest: {latestDateFormatted}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="admin-filter-preset-btn text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedGroupKey(isExpanded ? null : group.key);
                                        }}
                                    >
                                        {isExpanded ? "Collapse ▲" : `View ${group.count} occurrences ▼`}
                                    </button>
                                </div>

                                <div className="admin-error-message">
                                    {group.message}
                                </div>

                                {/* First sample stack trace preview */}
                                {group.instances[0]?.stack && !isExpanded && (
                                    <details className="admin-stack-preview">
                                        <summary>Show Sample Stack Trace</summary>
                                        <pre className="admin-error-stack-pre">
                                            {group.instances[0].stack}
                                        </pre>
                                    </details>
                                )}

                                {/* Expanded instances list */}
                                {isExpanded && (
                                    <div className="admin-error-expanded-box">
                                        <h5 className="m-0 mb-sm">
                                            All Occurrences of this Error ({group.instances.length}):
                                        </h5>

                                        <div className="flex flex-col gap-sm">
                                            {group.instances.map((inst, i) => (
                                                <ErrorCardDetail
                                                    key={inst.id}
                                                    errorItem={inst}
                                                    index={i + 1}
                                                    onFilterUrl={handleFilterUrl}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* VIEW MODE 2: CHRONOLOGICAL TIMELINE */}
            {!loading && !errorMsg && filteredErrors.length > 0 && viewMode === "timeline" && (
                <div className="flex flex-col gap-sm">
                    {timelineErrors.map((inst, i) => (
                        <ErrorCardDetail
                            key={inst.id}
                            errorItem={inst}
                            index={i + 1}
                            onFilterUrl={handleFilterUrl}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Single Error Item Detail Component
function ErrorCardDetail({
    errorItem,
    index,
    onFilterUrl,
}: {
    errorItem: ErrorRecordItem;
    index: number;
    onFilterUrl?: (url: string) => void;
}) {
    const [showRawJson, setShowRawJson] = useState(false);

    return (
        <div className="admin-error-detail-card">
            <div className="admin-error-detail-header">
                <div>
                    <span className="admin-error-detail-num">
                        #{index} {errorItem.name}
                    </span>
                    <span className="text-sm text-muted">
                        {errorItem.dateFormatted}
                    </span>
                </div>
                <button
                    type="button"
                    className="admin-filter-preset-btn text-xs"
                    onClick={() => setShowRawJson(!showRawJson)}
                >
                    {showRawJson ? "Hide RAW JSON" : "Inspect RAW JSON"}
                </button>
            </div>

            <p className="admin-error-detail-msg">
                {errorItem.message}
            </p>

            {/* Stack trace */}
            {errorItem.stack && (
                <details className="mb-sm">
                    <summary className="admin-error-stack-summary">
                        ▼ Show Call Stack
                    </summary>
                    <pre className="admin-error-stack-pre">
                        {errorItem.stack}
                    </pre>
                </details>
            )}

            {/* Metadata Context */}
            <div className="admin-error-meta-grid">
                <div>
                    URL: <code>{errorItem.url || "N/A"}</code>
                    {errorItem.url && onFilterUrl && (
                        <button
                            type="button"
                            className="admin-filter-preset-btn text-xs ml-xs"
                            title={`Filter URL: ${errorItem.url}`}
                            onClick={() => onFilterUrl(errorItem.url)}
                        >
                            🔍 Filter
                        </button>
                    )}
                </div>
                <div>localId: <code>{errorItem.localId || "N/A"}</code></div>
                <div>sessionId: <code>{errorItem.sessionId || "N/A"}</code></div>
                <div>IP: <code>{errorItem.ip || "N/A"}</code></div>
                <div className="admin-error-meta-full">
                    User Agent: <span>{errorItem.userAgent || "N/A"}</span>
                </div>
            </div>

            {/* RAW JSON Toggle */}
            {showRawJson && (
                <div className="mt-xs">
                    <pre className="admin-json-box">
                        {JSON.stringify(errorItem.raw, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
