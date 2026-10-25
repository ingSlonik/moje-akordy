import React, { useEffect, useRef, useState } from "react";
import { useUser } from "easy-user-auth/react";
import { api } from "../services/api";
import { renderQRCodeWithLogo } from "../utils/qr";
import { canUseWebShare } from "../utils/share";
import { formatLiveCode, LIVE_POLL_INTERVAL, markLiveHintSeen } from "../utils/live";
import { LiveState, UserProfile } from "../../types";
import LiveIcon from "./LiveIcon";

/** Live code of the logged-in user (derived from userId on the server, never changes). */
let cachedLiveCode: { userId: string; code: string } | null = null;

export type LiveBroadcastPanelProps = {
    /** Panel is visible (dialog open + tab selected). */
    active: boolean;
    /**
     * Called instead of opening the login dialog directly - the host modal <dialog>
     * must close first, otherwise it keeps the login dialog inert underneath.
     */
    onLoginRequest?: () => void;
    /** Switch to the "join" tab (only inside the live dialog). */
    onJoinRequest?: () => void;
};

/** "Vysílat" - QR code, code and link of the logged-in user's live session. */
export default function LiveBroadcastPanel({ active, onLoginRequest, onJoinRequest }: LiveBroadcastPanelProps) {
    const { isLoggedIn, userId, showUserDialog } = useUser<UserProfile>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [code, setCode] = useState<string | null>(
        cachedLiveCode && cachedLiveCode.userId === userId ? cachedLiveCode.code : null
    );
    const [current, setCurrent] = useState<LiveState | null>(null);
    const [copied, setCopied] = useState(false);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        setCanShare(canUseWebShare());
    }, []);

    useEffect(() => {
        if (active) markLiveHintSeen();
    }, [active]);

    // Load own live code.
    useEffect(() => {
        if (!active || !isLoggedIn || !userId) return;
        if (cachedLiveCode && cachedLiveCode.userId === userId) {
            setCode(cachedLiveCode.code);
            return;
        }
        let cancelled = false;
        api.getLiveCode({}).then(([data, err]) => {
            if (cancelled) return;
            if (err || !data) {
                console.error("Failed to load live code:", err);
                return;
            }
            cachedLiveCode = { userId, code: data.code };
            setCode(data.code);
        });
        return () => {
            cancelled = true;
        };
    }, [active, isLoggedIn, userId]);

    // What followers see right now.
    useEffect(() => {
        if (!active || !code) return;
        let cancelled = false;
        const load = async () => {
            const [data] = await api.getLiveState({ code });
            if (!cancelled && data) setCurrent(data.live);
        };
        load();
        const interval = setInterval(load, LIVE_POLL_INTERVAL);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [active, code]);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = code ? `${origin}/live/${code}` : "";

    useEffect(() => {
        if (!active || !url || !canvasRef.current) return;
        renderQRCodeWithLogo(canvasRef.current, url, { logoUrl: "/images/logo.png", size: 600 })
            .catch((err) => console.error("Failed to render QR Code:", err));
    }, [active, url]);

    async function handleCopy() {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.warn("Failed to copy using clipboard API:", err);
        }
    }

    async function handleShare() {
        if (canShare && navigator.share) {
            try {
                await navigator.share({
                    title: "Živé hraní | Fílův zpěvník",
                    text: "Připoj se ke mně – písně se ti budou přepínat samy, jak budu hrát.",
                    url,
                });
                return;
            } catch (err: any) {
                if (err?.name === "AbortError") return;
            }
        }
        await handleCopy();
    }

    if (!isLoggedIn) {
        return (
            <div className="live-panel live-panel-login">
                <p>
                    Abyste mohli vysílat, potřebujete účet. Získáte vlastní <strong>stálý QR kód</strong>,
                    který můžete ukazovat třeba u každého táboráku.
                </p>
                <button type="button" className="btn-live btn-live-block" onClick={() => (onLoginRequest ? onLoginRequest() : showUserDialog())}>
                    Přihlásit se a vysílat
                </button>
                <p className="live-panel-note">
                    {onJoinRequest ? (
                        <button type="button" className="btn-subtle" onClick={onJoinRequest}>
                            Chci se jen připojit ke kytaristovi – bez účtu
                        </button>
                    ) : (
                        "Připojit se k někomu jinému můžete i bez účtu."
                    )}
                </p>
            </div>
        );
    }

    return (
        <div className="live-panel">
            <div className="live-on-air" role="status">
                <LiveIcon size={16} on />
                <span>
                    {current?.label
                        ? <>Ostatní teď vidí: <strong>{current.label}</strong></>
                        : "Vysíláte. Otevřete libovolnou píseň a ostatní ji uvidí."}
                </span>
            </div>

            <div className="share-qr-section">
                <canvas ref={canvasRef} className="share-qr-canvas" width={600} height={600} aria-label="QR kód pro připojení" />
            </div>

            <div className="live-code-display">
                <span className="live-code-label">nebo ať zadají kód</span>
                <span className="live-code-value">{code ? formatLiveCode(code) : "··· ···"}</span>
            </div>

            <div className="share-url-group">
                <div className="share-url-box" onClick={handleCopy} title="Kliknutím zkopírujete odkaz">
                    <input
                        type="text"
                        readOnly
                        value={url}
                        aria-label="Odkaz pro živé hraní"
                        className="share-url-input"
                    />
                    {copied && <span className="share-url-badge">Zkopírováno!</span>}
                </div>
            </div>

            <button type="button" onClick={handleShare} className="btn-live btn-live-block" disabled={!url}>
                {copied ? "Odkaz zkopírován!" : canShare ? "Poslat odkaz" : "Zkopírovat odkaz"}
            </button>
        </div>
    );
}
