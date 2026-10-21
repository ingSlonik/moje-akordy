import { describe, it } from "node:test";
import assert from "node:assert";
import { tokenizeSongContent, slugifySongId, parseMarkdownSongInput } from "../src/utils/parser";

describe("Song Parser & Tokenizer", () => {
    it("tokenizes plain text, chords, comments, and tabs correctly", () => {
        const input = "Plain line\n[C]Ži-ju si ja-ko [G]v pohádce\n// Komentář\n```\ne|---0---\nB|---1---\n```\nKonec.";
        const tokens = tokenizeSongContent(input);

        assert.ok(tokens.length > 0);
        const chords = tokens.filter(t => t.type === "chord");
        assert.strictEqual(chords.length, 2);
        assert.strictEqual(chords[0].value, "C");
        assert.strictEqual(chords[1].value, "G");

        const comments = tokens.filter(t => t.type === "comment");
        assert.strictEqual(comments.length, 1);
        assert.strictEqual(comments[0].value, "Komentář");

        const tabs = tokens.filter(t => t.type === "tab");
        assert.strictEqual(tabs.length, 1);
        assert.strictEqual(tabs[0].value, "e|---0---\nB|---1---");

        const texts = tokens.filter(t => t.type === "text");
        assert.ok(texts.some(t => t.value.includes("Ži-ju si ja-ko ")));
        assert.ok(texts.some(t => t.value.includes("Konec.")));
    });

    it("slugifies artist and title correctly removing diacritics and special chars", () => {
        assert.strictEqual(
            slugifySongId("Karel Kryl", "Morituri te salutant"),
            "karel-kryl-morituri-te-salutant"
        );
        assert.strictEqual(
            slugifySongId("Divokej Bill", "Čmelák"),
            "divokej-bill-cmelak"
        );
        assert.strictEqual(
            slugifySongId("Jaromír Nohavica", "Dokud se zpívá, ještě se neumřelo!"),
            "jaromir-nohavica-dokud-se-zpiva-jeste-se-neumrelo"
        );
        assert.strictEqual(
            slugifySongId("  ---Xavier Baumaxa--- ", " Pažitka  "),
            "xavier-baumaxa-pazitka"
        );
    });

    it("parses markdown song input headers and content", () => {
        const raw = "# Můj song\n@ Zpěvák\n$ 1500\n% 75\nPrvní sloka\n[A] Druhá sloka\n";
        const res = parseMarkdownSongInput(raw);

        assert.strictEqual(res.title, "Můj song");
        assert.strictEqual(res.artist, "Zpěvák");
        assert.strictEqual(res.scrollSpeed, 1500);
        assert.strictEqual(res.rating, 75);
        assert.strictEqual(res.content, "První sloka\n[A] Druhá sloka\n");
    });
});
