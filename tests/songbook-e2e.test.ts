import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";

function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const port = (srv.address() as net.AddressInfo).port;
            srv.close(() => resolve(port));
        });
        srv.on("error", reject);
    });
}

function parseCookies(res: Response, existingCookies: Record<string, string> = {}): Record<string, string> {
    const cookies = { ...existingCookies };
    const setCookieHeaders = typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")!] : []);

    for (const header of setCookieHeaders) {
        const part = header.split(";")[0];
        const eqIdx = part.indexOf("=");
        if (eqIdx !== -1) {
            const key = part.slice(0, eqIdx).trim();
            const val = part.slice(eqIdx + 1).trim();
            cookies[key] = val;
        }
    }
    return cookies;
}

function cookieString(cookies: Record<string, string>): string {
    return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}

describe("Songbook E2E Integration Test Suite", () => {
    let port: number;
    let BASE_URL: string;
    let serverProcess: ChildProcess;

    const easyDbDir = path.resolve(process.cwd(), "easy-db");
    const songJsonPath = path.resolve(easyDbDir, "song.json");
    const userJsonPath = path.resolve(easyDbDir, "user.json");
    const backupDir = path.resolve(process.cwd(), "easy-db-backup");

    let songJsonOriginal: string;
    let userJsonOriginal: string | null = null;

    before(async () => {
        // 1. In-memory backup of production/dev database files
        songJsonOriginal = await fs.readFile(songJsonPath, "utf-8");
        try {
            userJsonOriginal = await fs.readFile(userJsonPath, "utf-8");
        } catch {
            userJsonOriginal = null;
        }

        // 2. Allocate free port and spawn test server
        port = await getFreePort();
        BASE_URL = `http://localhost:${port}`;

        serverProcess = spawn(
            process.execPath,
            ["./node_modules/tsx/dist/cli.mjs", "--env-file=.env", "server/index.tsx"],
            {
                env: {
                    ...process.env,
                    SERVER_PORT: String(port),
                    NODE_ENV: "development",
                },
                stdio: ["pipe", "pipe", "pipe"],
            }
        );

        // 3. Wait until server is listening
        await new Promise<void>((resolve, reject) => {
            let output = "";
            const timeout = setTimeout(() => {
                reject(new Error(`Server startup timed out after 15s. Output:\n${output}`));
            }, 15000);

            const onData = (chunk: Buffer) => {
                const text = chunk.toString();
                output += text;
                if (output.includes(`Server is running on http://localhost:${port}`)) {
                    clearTimeout(timeout);
                    resolve();
                }
            };

            serverProcess.stdout?.on("data", onData);
            serverProcess.stderr?.on("data", (chunk) => {
                output += chunk.toString();
            });
            serverProcess.on("error", (err) => {
                clearTimeout(timeout);
                reject(err);
            });
            serverProcess.on("exit", (code) => {
                clearTimeout(timeout);
                reject(new Error(`Server exited unexpectedly with code ${code}. Output:\n${output}`));
            });
        });
    });

    after(async () => {
        // 1. Terminate server process
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill("SIGTERM");
            await new Promise((r) => setTimeout(r, 200));
            try {
                if (serverProcess.pid) process.kill(serverProcess.pid, "SIGKILL");
            } catch {}
        }

        // 2. Exact database restoration
        try {
            await fs.writeFile(songJsonPath, songJsonOriginal, "utf-8");
        } catch (e) {
            console.error("Failed to restore song.json:", e);
        }

        try {
            if (userJsonOriginal !== null) {
                await fs.writeFile(userJsonPath, userJsonOriginal, "utf-8");
            } else {
                await fs.unlink(userJsonPath);
            }
        } catch {}

        // 3. Remove any test easy-db-backup folder if created
        try {
            await fs.rm(backupDir, { recursive: true, force: true });
        } catch {}
    });

    // -------------------------------------------------------------------------
    // 1. Public GET /api/songs
    // -------------------------------------------------------------------------
    it("1. Public GET /api/songs returns 54 migrated songs + 152 poems with author Fíla", async () => {
        const res = await fetch(`${BASE_URL}/api/songs`);
        assert.equal(res.status, 200);

        const items: any[] = await res.json();
        assert.ok(Array.isArray(items), "Response should be an array");
        assert.ok(items.length >= 206, `Expected at least 206 items, got ${items.length}`);

        const songs = items.filter((i) => i.type === "song");
        const poems = items.filter((i) => i.type === "poem");
        assert.equal(songs.length, 54, `Expected 54 songs, got ${songs.length}`);
        assert.equal(poems.length, 152, `Expected 152 poems, got ${poems.length}`);

        // Verify migrated song
        const cmelak = songs.find((s) => s.file === "bill-cmelak");
        assert.ok(cmelak, "Song 'bill-cmelak' must exist");
        assert.equal(cmelak.artist, "Divokej Bill");
        assert.equal(cmelak.title, "Čmelák");
        assert.equal(cmelak.authorName, "Fíla");
        assert.equal(cmelak.rating, 20, "Unauthenticated rating should match defaultRating 20");

        // Verify migrated poem
        const poem = poems.find((p) => p.file === "jako-cool-v-plote" && p.title === "Radostné vyhlídky");
        assert.ok(poem, "Poem 'Radostné vyhlídky' in book 'jako-cool-v-plote' must exist");
        assert.equal(poem.authorName, "Fíla");
        assert.equal(poem.rating, 0);
    });

    // -------------------------------------------------------------------------
    // 2. Public GET /api/song?file="bill-cmelak"
    // -------------------------------------------------------------------------
    it("2. Public GET /api/song returns parsed song detail with tokenized lyrics and chords", async () => {
        const query = `?file=${encodeURIComponent(JSON.stringify("bill-cmelak"))}`;
        const res = await fetch(`${BASE_URL}/api/song${query}`);
        assert.equal(res.status, 200);

        const song = await res.json();
        assert.equal(song.file, "bill-cmelak");
        assert.equal(song.title, "Čmelák");
        assert.equal(song.artist, "Divokej Bill");
        assert.equal(song.scrollSpeed, 2000);
        assert.equal(song.rating, 20);
        assert.equal(song.authorName, "Fíla");

        // Verify tokenized text array
        assert.ok(Array.isArray(song.text), "Song text should be an array of tokens");
        assert.ok(song.text.length > 0, "Song text should have tokens");
        const hasChords = song.text.some((t: any) => t.type === "chord" && typeof t.value === "string" && t.value.length > 0);
        assert.ok(hasChords, "Song text tokens should contain chord tokens");
    });

    // -------------------------------------------------------------------------
    // 3. Public GET /api/poem
    // -------------------------------------------------------------------------
    it("3. Public GET /api/poem returns poem detail with stanzas", async () => {
        const query = `?file=${encodeURIComponent(JSON.stringify("jako-cool-v-plote"))}&title=${encodeURIComponent(JSON.stringify("Radostné vyhlídky"))}`;
        const res = await fetch(`${BASE_URL}/api/poem${query}`);
        assert.equal(res.status, 200);

        const poem = await res.json();
        assert.equal(poem.file, "jako-cool-v-plote");
        assert.equal(poem.title, "Radostné vyhlídky");
        assert.equal(poem.authorName, "Fíla");
        assert.ok(typeof poem.text === "string" && poem.text.length > 0);
    });

    // -------------------------------------------------------------------------
    // 4. User A registration, song creation and edit lifecycle
    // -------------------------------------------------------------------------
    let cookiesUserA: Record<string, string> = {};
    let createdSongSlug: string;

    it("4. User A registers, creates a new song, and updates it", async () => {
        // Register User A
        const regRes = await fetch(`${BASE_URL}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
            },
            body: JSON.stringify({
                mail: "hudebnik_a@e2e.cz",
                password: "Password123!",
                name: "Muzikant A",
            }),
        });
        assert.equal(regRes.status, 200);
        cookiesUserA = parseCookies(regRes);
        assert.ok(cookiesUserA.accessToken, "User A accessToken cookie must be set");

        // Add Song as User A
        const addRes = await fetch(`${BASE_URL}/api/song`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
                "Cookie": cookieString(cookiesUserA),
                "Authorization": `Bearer ${cookiesUserA.accessToken}`,
            },
            body: JSON.stringify({
                title: "E2E Hit Muzikanta",
                artist: "Muzikant A",
                scrollSpeed: 2400,
                content: "[C]První sloka [G]druhá sloka\n[Am]Refrén písně [F]a závěr",
                rating: 85,
            }),
        });
        assert.equal(addRes.status, 200);
        const addData = await addRes.json();
        assert.ok(addData.file, "addSong must return the generated slug");
        createdSongSlug = addData.file;

        // Verify song retrieved as User A
        const getRes = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`, {
            headers: {
                "Cookie": cookieString(cookiesUserA),
                "Authorization": `Bearer ${cookiesUserA.accessToken}`,
            },
        });
        assert.equal(getRes.status, 200);
        const songData = await getRes.json();
        assert.equal(songData.title, "E2E Hit Muzikanta");
        assert.equal(songData.artist, "Muzikant A");
        assert.equal(songData.scrollSpeed, 2400);
        assert.equal(songData.rating, 85);
        assert.equal(songData.authorName, "Muzikant A");

        // Update Song as User A
        const updateRes = await fetch(`${BASE_URL}/api/song`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
                "Cookie": cookieString(cookiesUserA),
                "Authorization": `Bearer ${cookiesUserA.accessToken}`,
            },
            body: JSON.stringify({
                file: createdSongSlug,
                title: "E2E Hit Muzikanta (Rozšířeno)",
                artist: "Muzikant A",
                scrollSpeed: 3100,
                content: "[C]Upravená sloka [G]nový refrén\n[Am]Sólo na kytaru [F]konec",
                rating: 95,
            }),
        });
        assert.equal(updateRes.status, 200);

        // Verify updated values
        const getUpdated = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`, {
            headers: {
                "Cookie": cookieString(cookiesUserA),
                "Authorization": `Bearer ${cookiesUserA.accessToken}`,
            },
        });
        assert.equal(getUpdated.status, 200);
        const updatedData = await getUpdated.json();
        assert.equal(updatedData.title, "E2E Hit Muzikanta (Rozšířeno)");
        assert.equal(updatedData.scrollSpeed, 3100);
        assert.equal(updatedData.rating, 95);
    });

    // -------------------------------------------------------------------------
    // 5. User B registration and 403 Forbidden checks
    // -------------------------------------------------------------------------
    let cookiesUserB: Record<string, string> = {};

    it("5. User B registers and receives 403 Forbidden when attempting unauthorized song edits/deletions", async () => {
        // Register User B
        const regRes = await fetch(`${BASE_URL}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
            },
            body: JSON.stringify({
                mail: "hudebnik_b@e2e.cz",
                password: "Password123!",
                name: "Muzikant B",
            }),
        });
        assert.equal(regRes.status, 200);
        cookiesUserB = parseCookies(regRes);
        assert.ok(cookiesUserB.accessToken, "User B accessToken cookie must be set");

        // 5a. User B tries to edit User A's song -> 403
        const forbiddenEditRes = await fetch(`${BASE_URL}/api/song`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
                "Cookie": cookieString(cookiesUserB),
                "Authorization": `Bearer ${cookiesUserB.accessToken}`,
            },
            body: JSON.stringify({
                file: createdSongSlug,
                title: "Neoprávněná úprava",
                artist: "Záškodník",
                scrollSpeed: 1000,
                content: "Unauthorized content",
            }),
        });
        assert.equal(forbiddenEditRes.status, 403);

        // 5b. User B tries to delete User A's song -> 403
        const forbiddenDeleteARes = await fetch(
            `${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`,
            {
                method: "DELETE",
                headers: {
                    "Origin": BASE_URL,
                    "Cookie": cookieString(cookiesUserB),
                    "Authorization": `Bearer ${cookiesUserB.accessToken}`,
                },
            }
        );
        assert.equal(forbiddenDeleteARes.status, 403);

        // 5c. User B tries to delete Fíla's song ("bill-cmelak") -> 403
        const forbiddenDeleteFilaRes = await fetch(
            `${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify("bill-cmelak"))}`,
            {
                method: "DELETE",
                headers: {
                    "Origin": BASE_URL,
                    "Cookie": cookieString(cookiesUserB),
                    "Authorization": `Bearer ${cookiesUserB.accessToken}`,
                },
            }
        );
        assert.equal(forbiddenDeleteFilaRes.status, 403);
    });

    // -------------------------------------------------------------------------
    // 6. User B rates User A's song and Fíla's song (Personalized rating isolation)
    // -------------------------------------------------------------------------
    it("6. User B rates songs independently without altering User A's rating or author default rating", async () => {
        // User B rates User A's song with 75
        const rateARes = await fetch(`${BASE_URL}/api/song-rating`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
                "Cookie": cookieString(cookiesUserB),
                "Authorization": `Bearer ${cookiesUserB.accessToken}`,
            },
            body: JSON.stringify({
                file: createdSongSlug,
                rating: 75,
            }),
        });
        assert.equal(rateARes.status, 200);

        // User B rates Fíla's song with 100
        const rateFilaRes = await fetch(`${BASE_URL}/api/song-rating`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Origin": BASE_URL,
                "Cookie": cookieString(cookiesUserB),
                "Authorization": `Bearer ${cookiesUserB.accessToken}`,
            },
            body: JSON.stringify({
                file: "bill-cmelak",
                rating: 100,
            }),
        });
        assert.equal(rateFilaRes.status, 200);

        // User B fetches User A's song -> rating is 75
        const userBSongView = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`, {
            headers: {
                "Cookie": cookieString(cookiesUserB),
                "Authorization": `Bearer ${cookiesUserB.accessToken}`,
            },
        }).then((r) => r.json());
        assert.equal(userBSongView.rating, 75);

        // User B fetches Fíla's song -> rating is 100
        const userBFilaView = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify("bill-cmelak"))}`, {
            headers: {
                "Cookie": cookieString(cookiesUserB),
                "Authorization": `Bearer ${cookiesUserB.accessToken}`,
            },
        }).then((r) => r.json());
        assert.equal(userBFilaView.rating, 100);

        // User A fetches their own song -> rating is STILL 95
        const userASongView = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`, {
            headers: {
                "Cookie": cookieString(cookiesUserA),
                "Authorization": `Bearer ${cookiesUserA.accessToken}`,
            },
        }).then((r) => r.json());
        assert.equal(userASongView.rating, 95);

        // Anonymous unauthenticated visitor fetches Fíla's song -> default rating 20 unchanged
        const anonFilaView = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify("bill-cmelak"))}`).then((r) => r.json());
        assert.equal(anonFilaView.rating, 20);
    });

    // -------------------------------------------------------------------------
    // 7. User A deletes their own song
    // -------------------------------------------------------------------------
    it("7. User A deletes their own song successfully and subsequent queries return 404", async () => {
        const deleteRes = await fetch(
            `${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`,
            {
                method: "DELETE",
                headers: {
                    "Origin": BASE_URL,
                    "Cookie": cookieString(cookiesUserA),
                    "Authorization": `Bearer ${cookiesUserA.accessToken}`,
                },
            }
        );
        assert.equal(deleteRes.status, 200);

        // Querying deleted song should now return 404
        const queryRes = await fetch(`${BASE_URL}/api/song?file=${encodeURIComponent(JSON.stringify(createdSongSlug))}`);
        assert.equal(queryRes.status, 404);
    });

    // -------------------------------------------------------------------------
    // 8. SSR HTML rendering, Sitemap XML & robots.txt
    // -------------------------------------------------------------------------
    it("8. SSR renders HTML for '/', '/bill-cmelak', and serves '/sitemap.xml' and '/robots.txt'", async () => {
        // 8a. GET /
        const homeRes = await fetch(`${BASE_URL}/`);
        assert.equal(homeRes.status, 200);
        assert.ok(homeRes.headers.get("content-type")?.includes("text/html"));
        const homeHtml = await homeRes.text();
        assert.ok(homeHtml.includes("<title>Fílův zpěvník</title>"), "Home HTML must include page title");
        assert.ok(homeHtml.includes("Čmelák"), "Home HTML must include song list rendered via SSR");

        // 8b. GET /bill-cmelak
        const songRes = await fetch(`${BASE_URL}/bill-cmelak`);
        assert.equal(songRes.status, 200);
        assert.ok(songRes.headers.get("content-type")?.includes("text/html"));
        const songHtml = await songRes.text();
        assert.ok(songHtml.includes("Čmelák"), "Song SSR HTML must include song title");
        assert.ok(songHtml.includes("Divokej Bill"), "Song SSR HTML must include artist name");

        // 8c. GET /sitemap.xml
        const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
        assert.equal(sitemapRes.status, 200);
        assert.ok(sitemapRes.headers.get("content-type")?.includes("xml"));
        const sitemapXml = await sitemapRes.text();
        assert.ok(sitemapXml.includes("<urlset"), "Sitemap must be valid urlset XML");
        assert.ok(sitemapXml.includes("/bill-cmelak"), "Sitemap must include song URL");
        assert.ok(sitemapXml.includes("/jako-cool-v-plote/"), "Sitemap must include poem URL");

        // 8d. GET /robots.txt
        const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
        assert.equal(robotsRes.status, 200);
        const robotsTxt = await robotsRes.text();
        assert.ok(robotsTxt.includes("User-agent: *"));
        assert.ok(robotsTxt.includes("Sitemap:"));
    });
});
