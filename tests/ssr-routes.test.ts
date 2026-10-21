import { describe, it } from "node:test";
import assert from "node:assert";
import { renderToHTML } from "ssr-hook/server";
import React from "react";
import App from "../src/App";

describe("SSR Rendering", () => {
    it("renders Home Page to HTML without crashing", async () => {
        const html = await renderToHTML("http://localhost:1111", "/", "<html><head></head><body><div id=\"root\"></div></body></html>", React.createElement(App));
        assert.ok(html.includes("Fílův"));
        assert.ok(html.includes("zpěvník"));
    });

    it("renders Song Page to HTML without crashing", async () => {
        const html = await renderToHTML("http://localhost:1111", "/bill-cmelak", "<html><head></head><body><div id=\"root\"></div></body></html>", React.createElement(App));
        assert.ok(html.includes("root"));
    });
});
