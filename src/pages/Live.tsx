import React, { useEffect, useRef, useState } from "react";
import { Link } from "easy-page-router/react";
import SongPage from "./Song";
import PoemPage from "./Poem";
import { api, useSSRApi } from "../services/api";
import { useHead } from "../services/common";
import LiveIcon from "../components/LiveIcon";
import LiveJoinForm from "../components/LiveJoinForm";
import {
    getLiveTargetUrl,
    isSameLiveTarget,
    LIVE_POLL_INTERVAL,
    isValidLiveCode,
    markLiveHintSeen,
    normalizeLiveCode,
} from "../utils/live";
import { LiveState } from "../../types";

export type LivePageProps = {
    code: string;
};

/**
 * Follower view of /live/<code>: shows the song/poem the leader has currently open.
 * First render comes from SSR, then it polls (only while the page is visible).
 */
export default function LivePage({ code: rawCode }: LivePageProps) {
    const code = normalizeLiveCode(decodeURIComponent(rawCode));
    // Wrong code is decided by its format only - a failed request (network, server restart)
    // must not strand followers on an error page, polling keeps retrying instead.
    const isCodeValid = isValidLiveCode(code);
    const [initial, initialError] = useSSRApi.getLiveState({ code });
    const [live, setLive] = useState<LiveState | null>(initial?.live ?? null);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (initialError && isCodeValid) setIsOffline(true);
    }, [initialError, isCodeValid]);

    const applyLive = (next: LiveState | null) => {
        setLive((prev) => (isSameLiveTarget(prev, next) ? prev : next));
    };

    // Client-side navigation to this page (no SSR data at first render).
    useEffect(() => {
        if (initial) applyLive(initial.live);
    }, [initial]);

    // Follower already knows the feature - do not show the onboarding hint later.
    useEffect(() => {
        markLiveHintSeen();
    }, []);

    // Polling.
    useEffect(() => {
        if (!isCodeValid) return;
        let cancelled = false;

        const poll = async () => {
            if (document.visibilityState !== "visible") return;
            const [data, err] = await api.getLiveState({ code });
            if (cancelled) return;
            setIsOffline(Boolean(err));
            if (data) applyLive(data.live);
        };

        const onVisible = () => {
            if (document.visibilityState === "visible") poll();
        };

        // Retry immediately after a failed first load.
        if (initialError) poll();

        const interval = setInterval(poll, LIVE_POLL_INTERVAL);
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("online", poll);
        return () => {
            cancelled = true;
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("online", poll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, isCodeValid]);

    // Scroll to the top when the leader switches to another song (not on transposition change).
    const pageId = live ? `${live.type}|${live.file}|${live.title || ""}` : "";
    const lastPageId = useRef(pageId);
    useEffect(() => {
        if (lastPageId.current !== pageId) {
            lastPageId.current = pageId;
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [pageId]);

    if (!isCodeValid) {
        return <LiveMessage title="Tento kód neplatí" text="Zkontrolujte, že jste kód opsali správně (6 znaků), nebo naskenujte QR kód znovu." showJoin />;
    }

    return (
        <div className="page-live">
            <div className={`live-banner ${isOffline ? "offline" : ""} ${live ? "" : "waiting"}`} role="status">
                <div className="content live-banner-inner">
                    <span className="live-badge-icon live-banner-icon">
                        <LiveIcon size={16} on={Boolean(live) && !isOffline} />
                    </span>
                    <span className="live-banner-text">
                        {isOffline
                            ? "Spojení ztraceno, zkouším znovu…"
                            : live
                                ? <>Živě s <strong>{live.leaderName}</strong><span className="live-banner-sub"> · písně se přepínají samy</span></>
                                : "Čekám, až kytarista otevře píseň…"}
                    </span>
                    {live && (
                        <Link href={getLiveTargetUrl(live)} className="live-banner-leave">
                            Odpojit
                        </Link>
                    )}
                </div>
            </div>

            {!live && (
                <LiveMessage
                    title="Zatím tu nic není"
                    text="Jakmile kytarista otevře píseň, objeví se tady sama. Nechte stránku otevřenou."
                />
            )}
            {live?.type === "song" && (
                <SongPage
                    key={pageId}
                    file={encodeURIComponent(live.file)}
                    live={{ key: live.key }}
                />
            )}
            {live?.type === "poem" && (
                <PoemPage
                    key={pageId}
                    file={encodeURIComponent(live.file)}
                    title={encodeURIComponent(live.title || "")}
                    live
                />
            )}
        </div>
    );
}

function LiveMessage({ title, text, showJoin }: { title: string; text: string; showJoin?: boolean }) {
    useHead({ title: `${title} | Fílův zpěvník`, description: text });

    return (
        <main className="page-live-message">
            <div className="content live-message">
                <span className="live-badge-icon live-badge-icon-lg live-message-icon">
                    <LiveIcon size={28} />
                </span>
                <h1>{title}</h1>
                <p>{text}</p>
                {showJoin && <LiveJoinForm />}
                <Link href="/" className="live-message-link">Zpět na seznam písní</Link>
            </div>
        </main>
    );
}
