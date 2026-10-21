/**
 * Utility functions for generating QR codes with embedded center logo.
 */

export interface QRCodeOptions {
    logoUrl?: string;
    size?: number;
    logoRatio?: number;
}

/**
 * Renders a QR code onto an HTML canvas with high error correction ('H')
 * and an embedded logo in the center on a crisp rounded white plate.
 */
export async function renderQRCodeWithLogo(
    canvas: HTMLCanvasElement,
    text: string,
    options: QRCodeOptions = {}
): Promise<void> {
    const {
        logoUrl = "/images/logo.png",
        size = 520, // Crisp High-DPI resolution
        logoRatio = 0.22, // 22% of QR width (well within 'H' level 30% recovery threshold)
    } = options;

    const QRCode = await import("qrcode");

    // 1. Draw QR code onto canvas
    await QRCode.toCanvas(canvas, text, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: size,
        color: {
            dark: "#1e293b",
            light: "#ffffff",
        },
    });

    // Clear inline width/height styles set by QRCode library to prevent aspect-ratio deformation
    canvas.style.width = "";
    canvas.style.height = "";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!logoUrl) return;

    try {
        // 2. Load the logo image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = logoUrl;

        await new Promise<void>((resolve, reject) => {
            if (img.complete && img.naturalWidth !== 0) {
                resolve();
            } else {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Failed to load logo image"));
            }
        });

        // 3. Compute centered badge dimensions
        const canvasWidth = canvas.width;
        const logoTargetSize = Math.round(canvasWidth * logoRatio);
        const padding = Math.max(6, Math.round(canvasWidth * 0.02));
        const bgSize = logoTargetSize + padding * 2;
        const bgX = Math.round((canvasWidth - bgSize) / 2);
        const bgY = Math.round((canvasWidth - bgSize) / 2);
        const logoX = bgX + padding;
        const logoY = bgY + padding;
        const borderRadius = Math.round(bgSize * 0.22);

        ctx.save();

        // 4. Draw white rounded badge behind logo
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = Math.round(canvasWidth * 0.025);
        ctx.shadowOffsetY = Math.round(canvasWidth * 0.008);

        if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(bgX, bgY, bgSize, bgSize, borderRadius);
            ctx.fill();
        } else {
            ctx.fillRect(bgX, bgY, bgSize, bgSize);
        }

        // 5. Draw border around the badge
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = Math.max(2, Math.round(canvasWidth * 0.006));
        if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(bgX, bgY, bgSize, bgSize, borderRadius);
            ctx.stroke();
        }

        // 6. Draw logo image
        ctx.drawImage(img, logoX, logoY, logoTargetSize, logoTargetSize);
        ctx.restore();
    } catch (err) {
        console.warn("Could not draw logo in QR code center:", err);
    }
}

/**
 * Triggers a client-side download of the canvas content as a PNG image.
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
