import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

async function generateIcons() {
    const rootDir = process.cwd();
    const publicImagesDir = path.join(rootDir, "public", "images");
    const publicDir = path.join(rootDir, "public");

    // Source master logo (high-resolution 512x512 with transparency)
    const sourcePath = path.join(publicImagesDir, "logo-512x512.png");

    console.log(`Loading master logo from: ${sourcePath}`);
    const sourceBuffer = await fs.readFile(sourcePath);

    // Canvas size for high-res master icon
    const canvasSize = 512;
    // Scaled logo inside canvas: 300x300 (~58.6% of canvas).
    // This places every pixel within radius R <= 196.2px, well inside Android's 80% safe zone circle (R = 204.8px)
    // and Apple's rounded corner mask, leaving clean ~20.7% margins on all sides.
    const logoSize = 300;
    const offset = Math.round((canvasSize - logoSize) / 2);

    console.log(`Resizing logo graphic to ${logoSize}x${logoSize} (fit: contain)...`);
    const resizedLogo = await sharp(sourceBuffer)
        .resize(logoSize, logoSize, {
            fit: "contain",
            kernel: "lanczos3",
        })
        .toBuffer();

    console.log(`Compositing onto ${canvasSize}x${canvasSize} solid white canvas (#ffffff)...`);
    const master512Buffer = await sharp({
        create: {
            width: canvasSize,
            height: canvasSize,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    })
        .composite([
            {
                input: resizedLogo,
                left: offset,
                top: offset,
            },
        ])
        .png({ compressionLevel: 9 })
        .toBuffer();

    // Icon targets to generate
    const targets = [
        {
            path: path.join(publicImagesDir, "icon-512x512.png"),
            size: 512,
            desc: "PWA 512x512 icon (any)",
        },
        {
            path: path.join(publicImagesDir, "icon-maskable-512x512.png"),
            size: 512,
            desc: "PWA 512x512 icon (maskable)",
        },
        {
            path: path.join(publicImagesDir, "icon-192x192.png"),
            size: 192,
            desc: "PWA 192x192 icon (any)",
        },
        {
            path: path.join(publicImagesDir, "icon-maskable-192x192.png"),
            size: 192,
            desc: "PWA 192x192 icon (maskable)",
        },
        {
            path: path.join(publicImagesDir, "apple-touch-icon.png"),
            size: 180,
            desc: "Apple touch icon 180x180",
        },
        {
            path: path.join(publicDir, "apple-touch-icon.png"),
            size: 180,
            desc: "Root Apple touch icon 180x180",
        },
        {
            path: path.join(publicImagesDir, "icon.png"),
            size: 256,
            desc: "Default icon 256x256",
        },
    ];

    for (const target of targets) {
        let outputBuffer: Buffer;
        if (target.size === 512) {
            outputBuffer = master512Buffer;
        } else {
            outputBuffer = await sharp(master512Buffer)
                .resize(target.size, target.size, { kernel: "lanczos3" })
                .png({ compressionLevel: 9 })
                .toBuffer();
        }

        await fs.writeFile(target.path, outputBuffer);
        const relPath = path.relative(rootDir, target.path);
        console.log(`Generated: ${relPath} (${target.size}x${target.size}) [${outputBuffer.length} bytes] - ${target.desc}`);
    }

    console.log("All PWA & Web Manifest icons successfully generated!");
}

generateIcons().catch((err) => {
    console.error("Error generating icons:", err);
    process.exit(1);
});
