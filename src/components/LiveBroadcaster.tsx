import { useEffect } from "react";
import { useRouter } from "easy-page-router/react";
import { useUser } from "easy-user-auth/react";
import { api } from "../services/api";
import { getLiveTarget, SONG_KEY_CHANGE_EVENT } from "../utils/live";

const SEND_DELAY = 500;

/**
 * Invisible component: for logged-in users, publishes the currently opened song/poem
 * (incl. transposition) so followers of /live/<code> can see it.
 * Runs only on navigation / transposition change; the server skips unchanged writes.
 */
export default function LiveBroadcaster() {
    const { path } = useRouter();
    const { isLoggedIn } = useUser();
    const pathKey = path.join("/");

    useEffect(() => {
        if (!isLoggedIn) return;

        let timer: ReturnType<typeof setTimeout> | undefined;

        const send = () => {
            const key = new URLSearchParams(window.location.search).get("key");
            const target = getLiveTarget(path, key);
            // Index, admin, editor, live page... keep the last song visible to followers.
            if (!target) return;
            api.updateLiveState(target);
        };

        // Debounce quick navigation / transposition clicking.
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(send, SEND_DELAY);
        };

        schedule();
        window.addEventListener(SONG_KEY_CHANGE_EVENT, schedule);
        return () => {
            clearTimeout(timer);
            window.removeEventListener(SONG_KEY_CHANGE_EVENT, schedule);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, pathKey]);

    return null;
}
