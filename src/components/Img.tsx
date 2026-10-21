import React from "react";

export type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    /** Target width in pixels */
    w?: number | string;
    /** Target height in pixels */
    h?: number | string;
    /** Max width in pixels */
    mw?: number | string;
    /** Max height in pixels */
    mh?: number | string;
    /** Max width in pixels (alias) */
    maxWidth?: number | string;
    /** Max height in pixels (alias) */
    maxHeight?: number | string;
    /** Output image format (default: "webp") */
    format?: "webp" | "jpeg" | "png";
    /** Output image format (alias) */
    type?: "webp" | "jpeg" | "png";
    /** Quality from 1 to 100 */
    quality?: number;
    /** Quality from 1 to 100 (alias) */
    q?: number;
    /** Smooth resize processing */
    smooth?: boolean;
    /** Smooth resize processing (alias) */
    s?: boolean;
};

export function imgSrc(
    src: string,
    options: {
        w?: number | string;
        h?: number | string;
        mw?: number | string;
        mh?: number | string;
        format?: "webp" | "jpeg" | "png";
        quality?: number;
        smooth?: boolean;
    }
): string | undefined {
    if (!src) return src;

    const targetFormat = options.format || "webp";

    try {
        const [base, queryString] = src.split("?");
        const params = new URLSearchParams(queryString || "");

        if (options.w !== undefined && !params.has("w") && !params.has("width")) {
            params.set("w", String(options.w));
        }
        if (options.h !== undefined && !params.has("h") && !params.has("height")) {
            params.set("h", String(options.h));
        }
        if (options.mw !== undefined && !params.has("mw") && !params.has("maxWidth")) {
            params.set("mw", String(options.mw));
        }
        if (options.mh !== undefined && !params.has("mh") && !params.has("maxHeight")) {
            params.set("mh", String(options.mh));
        }
        if (options.quality !== undefined && !params.has("q") && !params.has("quality")) {
            params.set("q", String(options.quality));
        }
        if (options.smooth !== undefined && !params.has("s") && !params.has("smooth")) {
            params.set("s", String(options.smooth));
        }
        if (targetFormat && !params.has("format") && !params.has("type") && !params.has("ext")) {
            params.set("format", targetFormat);
        }

        const finalQuery = params.toString();
        return finalQuery ? `${base}?${finalQuery}` : base;
    } catch {
        return src;
    }
}

/**
 * Smart image component wrapping HTML <img> with automatic easy-image-resizer URL formatting.
 * Defaults to WebP format with optional width/height/quality scaling options.
 */
export function Img({
    src,
    width,
    height,
    w,
    h,
    mw,
    mh,
    maxWidth,
    maxHeight,
    format,
    type,
    quality,
    q,
    smooth,
    s,
    ...restProps
}: ImgProps) {
    const finalW = w ?? width;
    const finalH = h ?? height;
    const finalMw = mw ?? maxWidth;
    const finalMh = mh ?? maxHeight;
    const finalFormat = format ?? type ?? "webp";
    const finalQuality = q ?? quality;
    const finalSmooth = s ?? smooth;

    const finalSrc = imgSrc(src || "", {
        w: finalW,
        h: finalH,
        mw: finalMw,
        mh: finalMh,
        format: finalFormat,
        quality: finalQuality,
        smooth: finalSmooth,
    });

    return <img
        src={finalSrc}
        width={finalW}
        height={finalH}
        {...restProps}
    />;
};

export default Img;
