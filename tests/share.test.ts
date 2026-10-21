import { describe, it } from "node:test";
import assert from "node:assert";
import { buildShareUrl, getShareText } from "../src/utils/share";

describe("Song Sharing Utilities", () => {
    it("builds standard canonical URL when not transposed", () => {
        const url = buildShareUrl({
            origin: "https://akordy.filipvrba.cz",
            file: "bill-cmelak",
            key: "C",
            defaultKey: "C",
        });
        assert.strictEqual(url, "https://akordy.filipvrba.cz/bill-cmelak");
    });

    it("appends ?key= when transposed to a different chord", () => {
        const url = buildShareUrl({
            origin: "https://akordy.filipvrba.cz",
            file: "bill-cmelak",
            key: "D",
            defaultKey: "C",
            includeKey: true,
        });
        assert.strictEqual(url, "https://akordy.filipvrba.cz/bill-cmelak?key=D");
    });

    it("omits ?key= when includeKey is false even if transposed", () => {
        const url = buildShareUrl({
            origin: "https://akordy.filipvrba.cz",
            file: "bill-cmelak",
            key: "F#",
            defaultKey: "C",
            includeKey: false,
        });
        assert.strictEqual(url, "https://akordy.filipvrba.cz/bill-cmelak");
    });

    it("handles URL encoding for special characters in keys and filenames", () => {
        const url = buildShareUrl({
            origin: "https://akordy.filipvrba.cz/",
            file: "traktor-letokruhy",
            key: "C#",
            defaultKey: "A",
            includeKey: true,
        });
        assert.strictEqual(url, "https://akordy.filipvrba.cz/traktor-letokruhy?key=C%23");
    });

    it("generates attractive share text for mobile messaging", () => {
        const textDefault = getShareText("Čmelák", "Divokej Bill");
        assert.strictEqual(textDefault, "Zahraj si se mnou: Čmelák – Divokej Bill");

        const textWithKey = getShareText("Čmelák", "Divokej Bill", "D");
        assert.strictEqual(textWithKey, "Zahraj si se mnou: Čmelák – Divokej Bill (tónina D)");
    });
});
