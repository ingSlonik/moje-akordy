import React, { useEffect, useRef, useState } from "react";
import { renderQRCodeWithLogo } from "../utils/qr";
import { buildShareUrl, canUseWebShare, getShareText } from "../utils/share";

export interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: string;
    title: string;
    artist: string;
    currentKey?: string;
    defaultKey?: string;
}

export default function ShareModal({
    isOpen,
    onClose,
    file,
    title,
    artist,
    currentKey,
    defaultKey,
}: ShareModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const isTransposed = Boolean(currentKey && defaultKey && currentKey !== defaultKey);
    const [includeKey, setIncludeKey] = useState<boolean>(isTransposed);
    const [copied, setCopied] = useState<boolean>(false);
    const [canShare, setCanShare] = useState<boolean>(false);

    useEffect(() => {
        if (isTransposed) {
            setIncludeKey(true);
        }
    }, [isTransposed, currentKey]);

    useEffect(() => {
        setCanShare(canUseWebShare());
    }, []);

    // Manage dialog open/close states according to modern web guidance
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) {
            dialog.showModal();
        } else if (!isOpen && dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    // Handle dialog events and light-dismiss fallback for unsupported browsers
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => {
            onClose();
        };

        const handleBackdropClick = (event: MouseEvent) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const isInside =
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width;

            if (!isInside) {
                dialog.close();
            }
        };

        dialog.addEventListener("close", handleClose);

        if (!("closedBy" in HTMLDialogElement.prototype)) {
            dialog.addEventListener("click", handleBackdropClick);
        }

        return () => {
            dialog.removeEventListener("close", handleClose);
            dialog.removeEventListener("click", handleBackdropClick);
        };
    }, [onClose]);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = buildShareUrl({
        origin,
        file,
        key: currentKey,
        defaultKey,
        includeKey,
    });

    // Render QR Code onto canvas whenever modal opens or shareUrl changes
    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        let isCancelled = false;

        renderQRCodeWithLogo(canvasRef.current, shareUrl, {
            logoUrl: "/images/logo.png",
            size: 600,
        }).catch((err) => {
            if (!isCancelled) {
                console.error("Failed to render QR Code:", err);
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [isOpen, shareUrl]);

    async function handleCopy() {
        try {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            }
        } catch (err) {
            console.warn("Failed to copy using clipboard API:", err);
        }
    }

    async function handleMainAction() {
        if (canShare && typeof navigator !== "undefined" && navigator.share) {
            try {
                const shareText = getShareText(
                    title,
                    artist,
                    includeKey ? currentKey : undefined
                );
                await navigator.share({
                    title: `${title} - ${artist} | Fílův zpěvník`,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err: any) {
                if (err?.name === "AbortError") {
                    return;
                }
            }
        }

        // On PC (or when Web Share is not available): copy URL to clipboard
        await handleCopy();
    }

    if (!isOpen) return null;

    return (
        <dialog
            ref={dialogRef}
            // @ts-expect-error closedby is a modern dialog attribute
            closedby="any"
            aria-labelledby="share-dialog-title"
            className="share-dialog"
        >
            <div className="share-dialog-container">
                <header className="share-dialog-header">
                    <div className="share-dialog-header-text">
                        <h3 id="share-dialog-title" className="share-dialog-title">
                            Sdílet píseň
                        </h3>
                        <p className="share-dialog-subtitle">
                            {title} <span className="subtitle-sep">•</span> {artist}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-dialog-close"
                        aria-label="Zavřít okno sdílení"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>

                <div className="share-dialog-body">
                    {/* Compact QR Code Section - Direct canvas without outer card frame */}
                    <div className="share-qr-section">
                        <canvas
                            ref={canvasRef}
                            className="share-qr-canvas"
                            width={600}
                            height={600}
                        />
                        <p className="share-qr-hint">
                            Namiřte fotoaparát na QR kód
                        </p>
                    </div>

                    {/* Transposition toggle */}
                    {isTransposed && (
                        <div className="share-transposition-toggle">
                            <label className="share-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={includeKey}
                                    onChange={(e) => setIncludeKey(e.target.checked)}
                                    className="share-checkbox"
                                />
                                <span className="share-checkbox-text">
                                    Přenést transpozici (tónina <strong>{currentKey}</strong>)
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Clean URL Display with click-to-copy */}
                    <div className="share-url-group">
                        <div
                            className="share-url-box"
                            onClick={handleCopy}
                            title="Kliknutím zkopírujete odkaz"
                        >
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                aria-label="Odkaz ke sdílení"
                                className="share-url-input"
                            />
                            {copied && (
                                <span className="share-url-badge">Zkopírováno!</span>
                            )}
                        </div>
                    </div>

                    {/* Main Share Button with Share Icon */}
                    <button
                        type="button"
                        onClick={handleMainAction}
                        className={`btn-share-main ${copied ? "copied" : ""}`}
                        title={canShare ? "Otevřít sdílení v telefonu" : "Zkopírovat odkaz do schránky"}
                    >
                        {copied ? (
                            <>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="btn-share-icon"
                                >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>URL zkopírována!</span>
                            </>
                        ) : (
                            <>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="btn-share-icon"
                                >
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                                <span>Sdílet</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
