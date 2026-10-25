import { describe, it } from "node:test";
import assert from "node:assert";
import React from "react";
import { renderToString } from "react-dom/server";
import { RouterProvider } from "easy-page-router/react";
import { UserProvider } from "easy-user-auth/react";
import Song from "../src/components/Song";
import ShareModal from "../src/components/ShareModal";
import { SongDetail, UserProfile } from "../types";

const mockSong: SongDetail = {
    file: "bill-cmelak",
    title: "Čmelák",
    artist: "Divokej Bill",
    scrollSpeed: 2000,
    rating: 20,
    defaultRating: 20,
    ratings: {},
    authorId: "fila",
    authorName: "Fíla",
    content: "[C]Žiju si jako v pohádce",
    text: [
        { type: "chord", value: "C" },
        { type: "text", value: "Žiju si jako v pohádce" },
    ],
};

const defaultUser: UserProfile = {
    name: "Tester",
    role: "user",
};

describe("Song Component & Share Feature Rendering", () => {
    it("renders Song component with Sdílet button", () => {
        const html = renderToString(
            React.createElement(
                UserProvider,
                { defaultUser, dict: {} as any },
                React.createElement(
                    RouterProvider,
                    { initialHref: "/bill-cmelak" },
                    React.createElement(Song, mockSong)
                )
            )
        );

        assert.ok(html.includes("btn-share-inline"));
        assert.ok(html.includes("Sdílet"));
        assert.ok(html.includes("Čmelák"));
        assert.ok(html.includes("Divokej Bill"));
    });

    it("renders Song component initialized with transposition from URL query param", () => {
        const html = renderToString(
            React.createElement(
                UserProvider,
                { defaultUser, dict: {} as any },
                React.createElement(
                    RouterProvider,
                    { initialHref: "/bill-cmelak?key=G" },
                    React.createElement(Song, mockSong)
                )
            )
        );

        assert.ok(html.includes("btn-share-inline"));
        // The active button should have class 'active' on 'G'
        assert.ok(html.includes("chord-btn active\">G</button>"));
        // The chord <sup> should be transposed from C to G
        assert.ok(html.includes("<sup>G</sup>"));
    });

    it("renders ShareModal dialog structure when open", () => {
        const html = renderToString(
            React.createElement(
                UserProvider,
                { defaultUser, dict: {} as any },
                React.createElement(ShareModal, {
                    isOpen: true,
                    onClose: () => {},
                    file: "bill-cmelak",
                    title: "Čmelák",
                    artist: "Divokej Bill",
                    currentKey: "G",
                    defaultKey: "C",
                })
            )
        );

        assert.ok(html.includes("share-dialog"));
        assert.ok(html.includes("Živé hraní"));
        assert.ok(html.includes("share-qr-canvas"));
        assert.ok(html.includes("btn-share-main"));
        assert.ok(html.includes("btn-share-icon"));
        assert.ok(html.includes("share-url-input"));
        assert.ok(html.includes("Čmelák"));
        assert.ok(html.includes("Divokej Bill"));
        assert.ok(html.includes("Přenést transpozici"));
        assert.ok(html.includes("Namiřte fotoaparát na QR kód"));
        // Confirm frame/card around QR is removed
        assert.strictEqual(html.includes("share-qr-card"), false);
        // Confirm clutter buttons are removed
        assert.strictEqual(html.includes("Stáhnout QR kód"), false);
        assert.strictEqual(html.includes("WhatsApp"), false);
        assert.strictEqual(html.includes("btn-share-copy-mini"), false);
    });
});
