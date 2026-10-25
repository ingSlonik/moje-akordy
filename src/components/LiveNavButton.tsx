import React from "react";
import { useRouter } from "easy-page-router/react";
import { useUser } from "easy-user-auth/react";
import LiveIcon from "./LiveIcon";
import { useLiveDialog } from "./LiveDialog";

/** "Živé hraní" button in the top navigation. */
export default function LiveNavButton() {
    const { path } = useRouter();
    const { isLoggedIn } = useUser();
    const { openLiveDialog } = useLiveDialog();

    const isLivePage = path[0] === "live";

    return (
        <button
            type="button"
            onClick={() => openLiveDialog()}
            className={`nav-btn-live ${isLoggedIn || isLivePage ? "is-on" : ""}`}
            title="Živé hraní – hrajte a zpívejte spolu"
            aria-label="Živé hraní"
            aria-haspopup="dialog"
        >
            <LiveIcon size={18} on={isLoggedIn || isLivePage} />
            <span className="nav-btn-live-label">Živé hraní</span>
        </button>
    );
}
