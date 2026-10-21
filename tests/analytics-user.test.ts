import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Analytics Logged-in User Tracking & Enrichment", () => {
    it("enriches analytics records with user details and associates devices by localId", () => {
        const mockUsers = [
            {
                _id: "user123",
                mail: "alice@example.com",
                name: "Alice Smith",
                role: "user",
            },
            {
                _id: "admin456",
                mail: "admin@example.com",
                name: "Admin Joe",
                role: "admin",
            },
        ];

        const userMap = new Map<string, any>();
        for (const u of mockUsers) {
            userMap.set(String(u._id), u);
            userMap.set(String(u._id).toLowerCase(), u);
        }

        const rawRecords = [
            // 1. Visit before login on mobile device
            {
                _id: "rec1",
                localId: "device-uuid-aaa",
                sessionId: "sess-1",
                url: "http://localhost:5173/",
                serverDate: "2026-10-20T10:00:00.000Z",
            },
            // 2. Visit after login on same mobile device
            {
                _id: "rec2",
                localId: "device-uuid-aaa",
                sessionId: "sess-1",
                url: "http://localhost:5173/items",
                serverDate: "2026-10-20T10:05:00.000Z",
                userId: "user123",
            },
            // 3. Admin visit on desktop
            {
                _id: "rec3",
                localId: "device-uuid-bbb",
                sessionId: "sess-2",
                url: "http://localhost:5173/admin",
                serverDate: "2026-10-20T11:00:00.000Z",
                userId: "admin456",
            },
            // 4. Anonymous guest on third device
            {
                _id: "rec4",
                localId: "device-uuid-ccc",
                sessionId: "sess-3",
                url: "http://localhost:5173/",
                serverDate: "2026-10-20T12:00:00.000Z",
            },
        ];

        // Track localId to user mappings from any visits that were authenticated in this dataset
        const localIdToUser = new Map<string, { userId: string; userEmail: string; userName?: string; userRole?: string }>();
        for (const r of rawRecords) {
            if (r && r.userId && r.localId) {
                const u = userMap.get(String(r.userId)) || userMap.get(String(r.userId).toLowerCase());
                const email = u?.mail || (r as any).userEmail;
                const name = u?.name || (r as any).userName;
                const role = u?.role || (r as any).userRole;
                if (!localIdToUser.has(r.localId) && email) {
                    localIdToUser.set(r.localId, {
                        userId: String(r.userId),
                        userEmail: email,
                        userName: name,
                        userRole: role,
                    });
                }
            }
        }

        const enriched = rawRecords.map((r: any) => {
            let userId = r.userId;
            let userEmail = r.userEmail;
            let userName = r.userName;
            let userRole = r.userRole;
            const detectedUser = r.localId ? localIdToUser.get(r.localId) : undefined;

            if (userId) {
                const u = userMap.get(String(userId)) || userMap.get(String(userId).toLowerCase());
                if (u) {
                    userEmail = u.mail || userEmail;
                    userName = u.name || userName;
                    userRole = u.role || userRole;
                }
            }

            return {
                ...r,
                userId: userId || undefined,
                userEmail: userEmail || undefined,
                userName: userName || undefined,
                userRole: userRole || undefined,
                detectedUserId: !userId && detectedUser ? detectedUser.userId : undefined,
                detectedUserEmail: !userId && detectedUser ? detectedUser.userEmail : undefined,
                detectedUserName: !userId && detectedUser ? detectedUser.userName : undefined,
                detectedUserRole: !userId && detectedUser ? detectedUser.userRole : undefined,
            };
        });

        // Verify rec2 (direct logged in user)
        assert.equal(enriched[1].userId, "user123");
        assert.equal(enriched[1].userEmail, "alice@example.com");
        assert.equal(enriched[1].userName, "Alice Smith");
        assert.equal(enriched[1].userRole, "user");
        assert.equal(enriched[1].detectedUserEmail, undefined);

        // Verify rec1 (same device prior to login - detected via localId)
        assert.equal(enriched[0].userId, undefined);
        assert.equal(enriched[0].userEmail, undefined);
        assert.equal(enriched[0].detectedUserId, "user123");
        assert.equal(enriched[0].detectedUserEmail, "alice@example.com");
        assert.equal(enriched[0].detectedUserName, "Alice Smith");

        // Verify rec3 (admin user)
        assert.equal(enriched[2].userId, "admin456");
        assert.equal(enriched[2].userEmail, "admin@example.com");
        assert.equal(enriched[2].userName, "Admin Joe");
        assert.equal(enriched[2].userRole, "admin");

        // Verify rec4 (anonymous guest)
        assert.equal(enriched[3].userId, undefined);
        assert.equal(enriched[3].userEmail, undefined);
        assert.equal(enriched[3].detectedUserEmail, undefined);
    });
});
