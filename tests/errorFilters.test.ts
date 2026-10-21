import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isUrlAdmin, filterErrors, ErrorRecordItem } from "../src/utils/errorFilters";

describe("Admin Error Filtering & isUrlAdmin", () => {
    it("correctly identifies admin URLs", () => {
        // Localhost full URLs
        assert.equal(isUrlAdmin("http://localhost:1111/admin"), true);
        assert.equal(isUrlAdmin("http://localhost:1111/admin/"), true);
        assert.equal(isUrlAdmin("http://localhost:1111/admin#errors"), true);
        assert.equal(isUrlAdmin("http://localhost:5173/admin/analytics"), true);
        assert.equal(isUrlAdmin("http://localhost:5173/admin/errors?m=2026-09"), true);

        // Production / arbitrary domain URLs
        assert.equal(isUrlAdmin("https://myapp.com/admin"), true);
        assert.equal(isUrlAdmin("https://myapp.com/admin/users"), true);
        assert.equal(isUrlAdmin("https://sub.domain.com:8080/admin/settings"), true);

        // Relative paths
        assert.equal(isUrlAdmin("/admin"), true);
        assert.equal(isUrlAdmin("/admin/"), true);
        assert.equal(isUrlAdmin("/admin/analytics"), true);
        assert.equal(isUrlAdmin("/admin/users#create"), true);
    });

    it("correctly identifies non-admin URLs", () => {
        assert.equal(isUrlAdmin("http://localhost:1111/"), false);
        assert.equal(isUrlAdmin("http://localhost:1111/pricing"), false);
        assert.equal(isUrlAdmin("http://localhost:5173/items"), false);
        assert.equal(isUrlAdmin("https://myapp.com/"), false);
        assert.equal(isUrlAdmin("/pricing"), false);
        assert.equal(isUrlAdmin("/"), false);
        assert.equal(isUrlAdmin(""), false);
        assert.equal(isUrlAdmin(null), false);
        assert.equal(isUrlAdmin(undefined), false);
    });

    const mockErrors: ErrorRecordItem[] = [
        {
            id: "1",
            name: "TypeError",
            message: "Cannot read properties of undefined",
            stack: "TypeError: Cannot read properties...",
            url: "http://localhost:1111/admin",
            localId: "loc-1",
            sessionId: "ses-1",
            userAgent: "Mozilla/5.0",
            ip: "127.0.0.1",
            dateFormatted: "29. 9. 2026",
            timestamp: 1000,
            raw: {},
        },
        {
            id: "2",
            name: "TypeError",
            message: "N.jsxDEV is not a function",
            stack: "TypeError: N.jsxDEV...",
            url: "http://localhost:5173/admin/analytics",
            localId: "loc-1",
            sessionId: "ses-1",
            userAgent: "Mozilla/5.0",
            ip: "127.0.0.1",
            dateFormatted: "29. 9. 2026",
            timestamp: 2000,
            raw: {},
        },
        {
            id: "3",
            name: "Error",
            message: "Failed to load item",
            stack: "Error: Failed to load...",
            url: "http://localhost:5173/items/42",
            localId: "loc-2",
            sessionId: "ses-2",
            userAgent: "iPhone Safari",
            ip: "192.168.1.1",
            dateFormatted: "29. 9. 2026",
            timestamp: 3000,
            raw: {},
        },
        {
            id: "4",
            name: "ReferenceError",
            message: "window is not defined",
            stack: "ReferenceError...",
            url: "https://myapp.com/pricing",
            localId: "loc-3",
            sessionId: "ses-3",
            userAgent: "Chrome",
            ip: "10.0.0.1",
            dateFormatted: "29. 9. 2026",
            timestamp: 4000,
            raw: {},
        },
        {
            id: "5",
            name: "Error",
            message: "Unhandled rejection in worker",
            stack: "Error: Unhandled...",
            url: "",
            localId: "loc-4",
            sessionId: "ses-4",
            userAgent: "Firefox",
            ip: "10.0.0.2",
            dateFormatted: "29. 9. 2026",
            timestamp: 5000,
            raw: {},
        },
    ];

    it("filters out /admin URLs when excludeAdmin is true", () => {
        const result = filterErrors(mockErrors, { excludeAdmin: true });
        assert.equal(result.length, 3);
        assert.deepEqual(result.map(e => e.id), ["3", "4", "5"]);
    });

    it("keeps all errors when excludeAdmin is false", () => {
        const result = filterErrors(mockErrors, { excludeAdmin: false });
        assert.equal(result.length, 5);
    });

    it("filters by specific URL pattern", () => {
        const result = filterErrors(mockErrors, { excludeAdmin: true, urlFilter: "/items" });
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "3");
    });

    it("filters by negative URL pattern (starts with !)", () => {
        const result = filterErrors(mockErrors, { excludeAdmin: true, urlFilter: "!/items" });
        assert.equal(result.length, 2);
        assert.deepEqual(result.map(e => e.id), ["4", "5"]);
    });

    it("filters by error type", () => {
        const result = filterErrors(mockErrors, { excludeAdmin: false, errorType: "TypeError" });
        assert.equal(result.length, 2);
        assert.deepEqual(result.map(e => e.id), ["1", "2"]);
    });

    it("filters by fulltext search query", () => {
        const result = filterErrors(mockErrors, { excludeAdmin: false, searchQuery: "load item" });
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "3");

        const resultByIp = filterErrors(mockErrors, { excludeAdmin: false, searchQuery: "192.168.1.1" });
        assert.equal(resultByIp.length, 1);
        assert.equal(resultByIp[0].id, "3");
    });

    it("combines multiple filters correctly", () => {
        const result = filterErrors(mockErrors, {
            excludeAdmin: true,
            errorType: "Error",
            searchQuery: "load",
        });
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "3");
    });
});
