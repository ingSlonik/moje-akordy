import { describe, it } from "node:test";
import assert from "node:assert";
import easyDBNode from "easy-db-node";
import { Database, SongRecord } from "../types";

describe("Song Database & Rating Logic", () => {
    it("reads migrated songs and poems from easy-db", async () => {
        const { selectArray, select } = easyDBNode<Database>({ folderDB: "easy-db", backup: false });
        const songs = await selectArray("song");
        const poems = await selectArray("poem");

        assert.ok(songs.length >= 50);
        assert.ok(poems.length >= 100);

        const cmelak = await select("song", "bill-cmelak");
        assert.ok(cmelak);
        assert.strictEqual(cmelak.title, "Čmelák");
        assert.strictEqual(cmelak.artist, "Divokej Bill");
        assert.strictEqual(cmelak.scrollSpeed, 2000);
        assert.strictEqual(cmelak.defaultRating, 20);
    });

    it("verifies rating resolution logic", () => {
        function resolveSongRating(song: SongRecord, userId?: string | null): number {
            if (userId) {
                if (song.ratings && typeof song.ratings[userId] === "number") {
                    return song.ratings[userId];
                }
                if (song.authorId === userId) {
                    return song.defaultRating ?? 0;
                }
                return 0;
            }
            return song.defaultRating ?? 0;
        }

        const song: SongRecord = {
            _id: "test-song",
            title: "Test",
            artist: "Artist",
            scrollSpeed: 2000,
            defaultRating: 70,
            ratings: {
                user1: 90,
                user2: 40,
            },
            content: "content",
            authorId: "author123",
            authorName: "Author",
            createdAt: "",
            updatedAt: "",
        };

        // Unauthenticated -> default rating
        assert.strictEqual(resolveSongRating(song, null), 70);
        assert.strictEqual(resolveSongRating(song, undefined), 70);

        // Authenticated with explicit rating
        assert.strictEqual(resolveSongRating(song, "user1"), 90);
        assert.strictEqual(resolveSongRating(song, "user2"), 40);

        // Authenticated author without explicit rating in ratings map
        assert.strictEqual(resolveSongRating(song, "author123"), 70);

        // Authenticated other user without explicit rating -> 0
        assert.strictEqual(resolveSongRating(song, "stranger"), 0);
    });
});
