import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    formatLiveCode,
    getLiveTarget,
    getLiveTargetUrl,
    isSameLiveTarget,
    isValidLiveCode,
    normalizeLiveCode,
} from "../src/utils/live";

describe("Live follow utilities", () => {
    it("ignores index and reserved pages", () => {
        assert.equal(getLiveTarget([]), null);
        assert.equal(getLiveTarget(["admin"]), null);
        assert.equal(getLiveTarget(["editor", "bill-cmelak"]), null);
        assert.equal(getLiveTarget(["live", "abc123def456"]), null);
        assert.equal(getLiveTarget(["reset-password"]), null);
        assert.equal(getLiveTarget(["a", "b", "c"]), null);
    });

    it("resolves songs incl. valid key only", () => {
        assert.deepEqual(getLiveTarget(["bill-cmelak"]), { type: "song", file: "bill-cmelak" });
        assert.deepEqual(getLiveTarget(["bill-cmelak"], "G"), { type: "song", file: "bill-cmelak", key: "G" });
        assert.deepEqual(getLiveTarget(["bill-cmelak"], "X"), { type: "song", file: "bill-cmelak" });
    });

    it("resolves poems with decoded title", () => {
        assert.deepEqual(
            getLiveTarget(["jako-cool-v-plote", encodeURIComponent("Radostné vyhlídky")]),
            { type: "poem", file: "jako-cool-v-plote", title: "Radostné vyhlídky" }
        );
    });

    it("compares targets", () => {
        assert.ok(isSameLiveTarget({ type: "song", file: "a" }, { type: "song", file: "a" }));
        assert.ok(!isSameLiveTarget({ type: "song", file: "a" }, { type: "song", file: "a", key: "D" }));
        assert.ok(isSameLiveTarget(null, null));
        assert.ok(!isSameLiveTarget(null, { type: "song", file: "a" }));
    });

    it("builds regular URL for disconnecting", () => {
        assert.equal(getLiveTargetUrl({ type: "song", file: "bill-cmelak" }), "/bill-cmelak");
        assert.equal(getLiveTargetUrl({ type: "song", file: "bill-cmelak", key: "C#" }), "/bill-cmelak?key=C%23");
        assert.equal(
            getLiveTargetUrl({ type: "poem", file: "jako-cool-v-plote", title: "Radostné vyhlídky" }),
            "/jako-cool-v-plote/Radostn%C3%A9%20vyhl%C3%ADdky"
        );
    });

    it("normalizes, validates and formats typed codes", () => {
        assert.equal(normalizeLiveCode(" k7f 3q9 "), "K7F3Q9");
        assert.equal(normalizeLiveCode("k7f-3q9"), "K7F3Q9");
        assert.ok(isValidLiveCode("K7F3Q9"));
        assert.ok(!isValidLiveCode("K7F3Q"), "too short");
        assert.ok(!isValidLiveCode("K7F3Q90"), "too long");
        assert.ok(!isValidLiveCode("O7F3Q9"), "ambiguous O is not in alphabet");
        assert.ok(!isValidLiveCode("../use"), "no path characters");
        assert.equal(formatLiveCode("K7F3Q9"), "K7F 3Q9");
    });
});
