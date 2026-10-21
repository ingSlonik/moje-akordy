import React, { useState, useMemo, useEffect } from "react";
import { useGroup, GroupTable, getGroupedCount } from "easy-analytics/react";
import { UAParser } from "ua-parser-js";
import { handleError } from "../../services/api";

type AnalyticsTabProps = {
    records: any[];
    month: string;
};

const LOCAL_STORAGE_FILTER_KEY = "easy_admin_analytics_filter";

// Extract campaign URL param value ?ad=..., returns exact value or null if missing
function getAdParam(urlStr: string): string | null {
    if (!urlStr) return null;
    try {
        const urlObj = new URL(urlStr, "http://localhost");
        const ad = urlObj.searchParams.get("ad");
        return ad && ad.trim() ? ad.trim() : null;
    } catch {
        return null;
    }
}

// Extract normalized traffic source (clean domain from Referrer, ?ad=..., or utm_source parameter)
function getReferrerSource(r: any): string {
    // 1. Check if ad campaign parameter is specified in URL (?ad=...)
    const adParam = getAdParam(r.url);
    if (adParam) {
        return `Ad: ${adParam}`;
    }

    // 2. Check if UTM source is specified in URL
    if (r.url) {
        try {
            const urlObj = new URL(r.url, "http://localhost");
            const utmSource = urlObj.searchParams.get("utm_source");
            if (utmSource && utmSource.trim()) {
                return utmSource
                    .trim()
                    .toLowerCase()
                    .replace(/^https?:\/\//i, "")
                    .replace(/^www\./i, "")
                    .replace(/\/+$/, "");
            }
        } catch {}
    }

    // 3. Check HTTP Referrer
    if (r.referrer && typeof r.referrer === "string" && r.referrer.trim()) {
        try {
            const refStr = r.referrer.trim();
            const urlObj = refStr.startsWith("http://") || refStr.startsWith("https://")
                ? new URL(refStr)
                : new URL(`http://${refStr}`);

            let host = urlObj.hostname.toLowerCase();
            if (host.startsWith("www.")) {
                host = host.slice(4);
            }

            // Unify Facebook subdomains
            if (host === "m.facebook.com" || host === "l.facebook.com" || host === "lm.facebook.com") {
                host = "facebook.com";
            }

            // Detect internal clicks
            if (host === "localhost" || host.includes("127.0.0.1")) {
                return "Internal Navigation";
            }

            return host;
        } catch {
            const fallback = r.referrer
                .replace(/^https?:\/\//i, "")
                .replace(/^www\./i, "")
                .split("/")[0]
                .split("?")[0]
                .trim()
                .toLowerCase();
            return fallback || r.referrer;
        }
    }

    return "Direct Traffic";
}

// Timestamp helper for sorting records
function getRecordTimestamp(r: any): number {
    const raw = r.serverDate || r.localDate || r.created;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
}

export default function AnalyticsTab({ records, month }: AnalyticsTabProps) {
    const [filterCode, setFilterCode] = useState<string>(() => {
        try {
            return localStorage.getItem(LOCAL_STORAGE_FILTER_KEY) || "";
        } catch {
            return "";
        }
    });

    const [filterError, setFilterError] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [chartMetric, setChartMetric] = useState<"views" | "uniques">("views");
    const pageSize = 50;

    // Persist filter code in localStorage
    const handleFilterChange = (val: string) => {
        setFilterCode(val);
        try {
            localStorage.setItem(LOCAL_STORAGE_FILTER_KEY, val);
        } catch (e) {
            handleError(e);
        }
    };

    // Filter records using user's eval / JS expression
    const filteredRecords = useMemo(() => {
        if (!filterCode.trim()) {
            setFilterError("");
            return records;
        }
        try {
            const evalFn = new Function("row", `try { return Boolean(${filterCode}); } catch(e) { return false; }`);
            evalFn({});
            setFilterError("");
            return records.filter(r => {
                try {
                    return evalFn(r);
                } catch {
                    return false;
                }
            });
        } catch (e: any) {
            setFilterError(`Filter syntax error: ${e.message}`);
            return records;
        }
    }, [records, filterCode]);

    // Helper to calculate time spent on page in ms from localDate and localDateLeft
    const getTimeSpentMs = (r: any): number | null => {
        if (!r.localDateLeft || !r.localDate) return null;
        const leftTime = new Date(r.localDateLeft).getTime();
        const entryTime = new Date(r.localDate).getTime();
        if (isNaN(leftTime) || isNaN(entryTime)) return null;
        const diff = leftTime - entryTime;
        return diff >= 0 ? diff : null;
    };

    const formatDuration = (ms: number | null): string => {
        if (ms === null) return "—";
        const sec = Math.floor(ms / 1000);
        if (sec < 60) return `${sec}s`;
        const min = Math.floor(sec / 60);
        const remSec = sec % 60;
        if (min < 60) return `${min}m ${remSec}s`;
        const hours = Math.floor(min / 60);
        const remMin = min % 60;
        return `${hours}h ${remMin}m`;
    };

    // Grouping metrics on filtered records
    const byURL = useGroup(filteredRecords, (r: any) => {
        try {
            return new URL(r.url, "http://localhost").pathname;
        } catch {
            return r.url || "Unknown";
        }
    });

    const byTimeSpent = useGroup(filteredRecords, (r: any) => {
        const ms = getTimeSpentMs(r);
        if (ms === null) return "Still Open / Active";
        const sec = Math.floor(ms / 1000);
        if (sec < 5) return "< 5s (Instant Exit)";
        if (sec < 15) return "5s – 15s";
        if (sec < 60) return "15s – 60s";
        if (sec < 300) return "1m – 5m";
        if (sec < 900) return "5m – 15m";
        return "> 15m (Long Stay)";
    });

    const byReferrer = useGroup(
        filteredRecords,
        (r: any) => getReferrerSource(r),
        (rs: any) => getGroupedCount(rs, (row: any) => row.localId)
    );

    const byWidth = useGroup(filteredRecords, (r: any) => {
        const w = r.window?.innerWidth || 0;
        if (w >= 1920) return ">= 1920px Full HD";
        if (w >= 1280) return "1280px - 1920px HD";
        if (w >= 768) return "768px - 1280px Tablet";
        if (w > 0) return "< 768px Mobile";
        return "Unknown";
    });

    const byBrowserLike = useGroup(
        filteredRecords,
        (r: any) => {
            if (!r.userAgent) return "Other / Unknown";
            try {
                const parser = new UAParser(r.userAgent);
                const b = parser.getBrowser();
                if (b && b.name) {
                    return b.name;
                }
                return "Other / Unknown";
            } catch {
                return "Other / Unknown";
            }
        },
        (rs: any) => getGroupedCount(rs, (row: any) => row.localId)
    );

    const userRecords = useMemo(() => {
        return filteredRecords.filter((r: any) => !!(r.userEmail || r.userId || r.detectedUserEmail || r.detectedUserId));
    }, [filteredRecords]);

    const byUser = useGroup(
        userRecords,
        (r: any) => {
            const email = r.userEmail || r.detectedUserEmail;
            const name = r.userName || r.detectedUserName;
            if (name && email) {
                return `${name} (${email})`;
            }
            return email || (r.userId ? `ID: ${r.userId}` : "Logged-in User");
        },
        (rs: any) => getGroupedCount(rs, (row: any) => row.localId)
    );

    // Date extractor for Visits per day chart
    const getRecordDateStr = (r: any) => {
        const raw = r.serverDate || r.localDate || r.created;
        if (!raw) return "";
        return String(raw).slice(0, 10);
    };

    // Calculate days count and maximum count for current month
    const yearNum = parseInt(month.slice(0, 4), 10);
    const monthNum = parseInt(month.slice(5, 7), 10);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    // Total unique visitors for the entire month
    const totalMonthUniques = useMemo(() => {
        return new Set(filteredRecords.map((r: any) => r.localId || r.sessionId || r.ip).filter(Boolean)).size;
    }, [filteredRecords]);

    const totalMonthSessions = useMemo(() => {
        return new Set(filteredRecords.map((r: any) => r.sessionId).filter(Boolean)).size;
    }, [filteredRecords]);

    const totalMonthViews = filteredRecords.length;

    // Daily metrics
    const dailyStats = useMemo(() => {
        const stats: { dayNum: number; fullDate: string; views: number; uniques: number }[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const dayStr = String(i).padStart(2, "0");
            const fullDate = `${month}-${dayStr}`;
            const dayRecords = filteredRecords.filter((r: any) => getRecordDateStr(r) === fullDate);
            const views = dayRecords.length;
            const uniques = new Set(dayRecords.map((r: any) => r.localId || r.sessionId || r.ip).filter(Boolean)).size;
            stats.push({ dayNum: i, fullDate, views, uniques });
        }
        return stats;
    }, [filteredRecords, month, daysInMonth]);

    const maxDailyCount = useMemo(() => {
        return Math.max(0, ...dailyStats.map(s => chartMetric === "views" ? s.views : s.uniques));
    }, [dailyStats, chartMetric]);

    // Individual records search and pagination
    const searchableRecords = useMemo(() => {
        let filtered = filteredRecords;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filteredRecords.filter((r: any) => {
                return (
                    (r.url && r.url.toLowerCase().includes(q)) ||
                    (r.localId && r.localId.toLowerCase().includes(q)) ||
                    (r.sessionId && r.sessionId.toLowerCase().includes(q)) ||
                    (r.ip && r.ip.toLowerCase().includes(q)) ||
                    (r.userAgent && r.userAgent.toLowerCase().includes(q)) ||
                    (r.referrer && r.referrer.toLowerCase().includes(q)) ||
                    (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
                    (r.userName && r.userName.toLowerCase().includes(q)) ||
                    (r.userId && r.userId.toLowerCase().includes(q)) ||
                    (r.detectedUserEmail && r.detectedUserEmail.toLowerCase().includes(q)) ||
                    (r.detectedUserName && r.detectedUserName.toLowerCase().includes(q))
                );
            });
        }
        return [...filtered].sort((a: any, b: any) => getRecordTimestamp(b) - getRecordTimestamp(a));
    }, [filteredRecords, searchQuery]);

    const totalPages = Math.ceil(searchableRecords.length / pageSize) || 1;
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return searchableRecords.slice(start, start + pageSize);
    }, [searchableRecords, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCode]);

    return (
        <div>
            {/* Filter Section */}
            <div className="admin-filter-box">
                <div className="admin-filter-header">
                    <label htmlFor="eval-filter">
                        🔍 JS Expression Filter (via <code>row</code>):
                    </label>
                    <div className="admin-filter-actions">
                        <span className="admin-filter-badge">
                            Showing {filteredRecords.length} / {records.length} records
                        </span>
                        {filterCode && (
                            <button
                                className="admin-filter-preset-btn admin-filter-clear-btn"
                                onClick={() => handleFilterChange("")}
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                </div>

                <div className="admin-filter-presets">
                    <span className="admin-filter-presets-label">Presets:</span>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("row.url && row.url.includes('ad=')")}
                    >
                        Campaigns (?ad=...)
                    </button>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("Boolean(row.userId || row.detectedUserId)")}
                    >
                        Registered Users
                    </button>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("!/bot|crawler|spider|google|bing/i.test(row.userAgent || '')")}
                    >
                        Exclude Bots
                    </button>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("row.localDateLeft && (new Date(row.localDateLeft).getTime() - new Date(row.localDate).getTime()) < 5000")}
                    >
                        Bounce &lt; 5s
                    </button>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("(row.window?.innerWidth || 0) >= 1024")}
                    >
                        Desktop (&gt;= 1024px)
                    </button>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("(row.window?.innerWidth || 0) < 768")}
                    >
                        Mobile (&lt; 768px)
                    </button>
                    <button
                        className="admin-filter-preset-btn"
                        onClick={() => handleFilterChange("row.url && row.url.includes('utm_source')")}
                    >
                        UTM Sources
                    </button>
                </div>

                <textarea
                    id="eval-filter"
                    className="admin-filter-textarea"
                    rows={2}
                    value={filterCode}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    placeholder="e.g. row.url.includes('/admin') || (row.window?.innerWidth || 0) > 1200"
                />
                {filterError && (
                    <div className="admin-filter-error text-error">{filterError}</div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="admin-stats-summary-grid">
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Total Page Views</div>
                    <div className="admin-summary-value">{totalMonthViews.toLocaleString()}</div>
                    <div className="admin-summary-sub">All logged requests</div>
                </div>
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Unique Visitors</div>
                    <div className="admin-summary-value">{totalMonthUniques.toLocaleString()}</div>
                    <div className="admin-summary-sub">By localId / device</div>
                </div>
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Unique Sessions</div>
                    <div className="admin-summary-value">{totalMonthSessions.toLocaleString()}</div>
                    <div className="admin-summary-sub">By browser session</div>
                </div>
                <div className="admin-summary-card">
                    <div className="admin-summary-label">Views per Visitor</div>
                    <div className="admin-summary-value">
                        {totalMonthUniques > 0 ? (totalMonthViews / totalMonthUniques).toFixed(1) : "0"}
                    </div>
                    <div className="admin-summary-sub">Average engagement</div>
                </div>
            </div>

            {/* Chart: Daily Visits */}
            <div className="admin-chart-container">
                <div className="admin-chart-header">
                    <h3>Daily Activity ({month})</h3>
                    <div className="admin-chart-toggle-group">
                        <button
                            type="button"
                            className={`admin-chart-toggle-btn ${chartMetric === "views" ? "active" : ""}`}
                            onClick={() => setChartMetric("views")}
                        >
                            Page Views
                        </button>
                        <button
                            type="button"
                            className={`admin-chart-toggle-btn ${chartMetric === "uniques" ? "active" : ""}`}
                            onClick={() => setChartMetric("uniques")}
                        >
                            Unique Visitors
                        </button>
                    </div>
                </div>

                <div className="admin-chart">
                    {dailyStats.map(({ dayNum, views, uniques, fullDate }) => {
                        const count = chartMetric === "views" ? views : uniques;
                        const heightPercent = maxDailyCount > 0 ? (count / maxDailyCount) * 85 : 0;
                        return (
                            <div key={dayNum} className="admin-bar-wrapper" title={`${fullDate}: ${count} ${chartMetric}`}>
                                <span className="admin-bar-count">{count > 0 ? count : ""}</span>
                                <div
                                    className={`admin-bar ${count > 0 ? "active" : ""}`}
                                    style={{ height: `${Math.max(4, heightPercent)}%` }}
                                />
                                <span className="admin-bar-date">{dayNum}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Groups Breakdown */}
            <div className="admin-breakdown-grid">
                <GroupTable title="Most Visited Paths" data={byURL} />
                <GroupTable title="Traffic Sources (Referrers & Ads)" data={byReferrer} />
                <GroupTable title="Browsers" data={byBrowserLike} />
                <GroupTable title="Time Spent on Page" data={byTimeSpent} />
                <GroupTable title="Display Resolutions" data={byWidth} />
                {userRecords.length > 0 && (
                    <GroupTable title="Activity by Logged-in Users" data={byUser} />
                )}
            </div>

            {/* Detailed Records Log */}
            <div className="admin-log-section">
                <div className="admin-log-header">
                    <div>
                        <h3 className="admin-log-title">Detailed Visitor Activity Log</h3>
                        <p className="admin-log-sub">
                            Click any record to inspect full device details, navigation flow, and raw JSON payload.
                        </p>
                    </div>
                    <div className="admin-log-controls">
                        <input
                            type="text"
                            className="admin-search-input"
                            placeholder="Search by URL, IP, User, UA, Session..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="admin-pagination-bar">
                        <span>
                            Page {currentPage} of {totalPages} ({searchableRecords.length} records)
                        </span>
                        <div className="admin-pagination-buttons">
                            <button
                                className="admin-filter-preset-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                ← Previous
                            </button>
                            <button
                                className="admin-filter-preset-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="admin-table-container">
                    <table className="admin-records-table">
                        <thead>
                            <tr>
                                <th style={{ width: "130px" }}>Date & Time</th>
                                <th>Page URL</th>
                                <th style={{ width: "170px" }}>Visitor / User</th>
                                <th style={{ width: "140px" }}>Traffic Source</th>
                                <th style={{ width: "90px" }}>Duration</th>
                                <th style={{ width: "100px" }}>Screen</th>
                                <th style={{ width: "80px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="admin-records-empty">
                                        No visitor records found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedRecords.map((r: any, idx: number) => {
                                    const isExpanded = expandedRecordId === (r._id || `idx_${idx}`);
                                    const dateStr = r.serverDate || r.localDate || r.created;
                                    const dateFormatted = dateStr ? new Date(dateStr).toLocaleString() : "—";
                                    const timeSpentMs = getTimeSpentMs(r);
                                    const userIdent = r.userName ? `${r.userName} (${r.userEmail})` : (r.userEmail || r.detectedUserEmail || (r.userId ? `ID: ${r.userId}` : "Anonymous"));
                                    const isUserDetected = !r.userId && Boolean(r.detectedUserId || r.detectedUserEmail);

                                    return (
                                        <React.Fragment key={r._id || idx}>
                                            <tr
                                                className={`admin-record-row ${isExpanded ? "expanded" : ""}`}
                                                onClick={() => setExpandedRecordId(isExpanded ? null : (r._id || `idx_${idx}`))}
                                            >
                                                <td className="admin-col-date">
                                                    {dateFormatted}
                                                </td>
                                                <td className="admin-col-url">
                                                    <span className="admin-url-text">{r.url || "N/A"}</span>
                                                </td>
                                                <td>
                                                    <span className={`admin-user-pill ${r.userId ? "auth-direct" : isUserDetected ? "auth-detected" : "anon"}`}>
                                                        {r.userId ? "👤 " : isUserDetected ? "🔍 " : ""}{userIdent}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="admin-source-pill">{getReferrerSource(r)}</span>
                                                </td>
                                                <td>{formatDuration(timeSpentMs)}</td>
                                                <td>
                                                    {r.window?.innerWidth ? `${r.window.innerWidth}×${r.window.innerHeight}` : "—"}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-filter-preset-btn text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedRecordId(isExpanded ? null : (r._id || `idx_${idx}`));
                                                        }}
                                                    >
                                                        {isExpanded ? "Close" : "Inspect"}
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Collapsible Inspection Card */}
                                            {isExpanded && (
                                                <tr className="admin-record-detail-row">
                                                    <td colSpan={7}>
                                                        <div className="admin-record-detail-card">
                                                            <div className="admin-detail-grid">
                                                                <div className="admin-detail-card">
                                                                    <strong>Identity & Session</strong>
                                                                    <div>Record ID: <code>{r._id || "N/A"}</code></div>
                                                                    <div>User: <strong>{userIdent}</strong></div>
                                                                    <div>Local Device ID: <code>{r.localId || "N/A"}</code></div>
                                                                    <div>Session ID: <code>{r.sessionId || "N/A"}</code></div>
                                                                    <div>Previous Record: <code>{r.recordIdBefore || "None"}</code></div>
                                                                </div>

                                                                <div className="admin-detail-card">
                                                                    <strong>Network & Device</strong>
                                                                    <div>IP Address: <code>{r.ip || "N/A"}</code> {r.ipCountry && <strong>({r.ipCountry})</strong>}</div>
                                                                    <div>User Agent: <span className="text-sm break-all">{r.userAgent || "N/A"}</span></div>
                                                                    <div>Traffic Source: <strong>{getReferrerSource(r)}</strong></div>
                                                                    <div>HTTP Referrer: <code>{r.referrer || "Direct Access"}</code></div>
                                                                </div>

                                                                <div className="admin-detail-card">
                                                                    <strong>Page & Timing</strong>
                                                                    <div>Full URL: <code>{r.url || "N/A"}</code></div>
                                                                    <div>Previous URL: <code>{r.urlBefore || "None"}</code></div>
                                                                    <div>Campaign (?ad=...): <code>{getAdParam(r.url) || "—"}</code></div>
                                                                    <div>Duration: <strong>{formatDuration(timeSpentMs)}</strong></div>
                                                                    <div>Server Date: {r.serverDate ? new Date(r.serverDate).toLocaleString() : "N/A"}</div>
                                                                </div>

                                                                <div className="admin-detail-card">
                                                                    <strong>Screen & Viewport</strong>
                                                                    <div>Window Viewport: {r.window?.innerWidth || 0} × {r.window?.innerHeight || 0} px</div>
                                                                    <div>Screen Resolution: {r.window?.screenWidth || 0} × {r.window?.screenHeight || 0} px</div>
                                                                    <div>Device Pixel Ratio: {r.window?.devicePixelRatio || 1}</div>
                                                                </div>
                                                            </div>

                                                            <div className="admin-raw-json-header">
                                                                <strong>Complete Raw JSON Payload</strong>
                                                                <button
                                                                    type="button"
                                                                    className="admin-filter-preset-btn"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(JSON.stringify(r, null, 2));
                                                                        alert("Raw JSON copied to clipboard!");
                                                                    }}
                                                                >
                                                                    📋 Copy JSON
                                                                </button>
                                                            </div>
                                                            <pre className="admin-json-box">
                                                                {JSON.stringify(r, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
