import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "easy-user-auth/react";
import LiveIcon from "./LiveIcon";
import LiveJoinForm from "./LiveJoinForm";
import LiveBroadcastPanel from "./LiveBroadcastPanel";
import { markLiveHintSeen } from "../utils/live";

export type LiveDialogTab = "broadcast" | "join";

type LiveDialogContextValue = {
    openLiveDialog: (tab?: LiveDialogTab) => void;
    /** Show login, then open the dialog with the user's QR code. */
    requestLiveLogin: () => void;
};

const LiveDialogContext = createContext<LiveDialogContextValue>({
    openLiveDialog: () => {},
    requestLiveLogin: () => {},
});

export function useLiveDialog() {
    return useContext(LiveDialogContext);
}

/** Provides one shared "Živé hraní" dialog for the nav button, home card etc. */
export function LiveDialogProvider({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, showUserDialog } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState<LiveDialogTab>("join");
    const [reopenAfterLogin, setReopenAfterLogin] = useState(false);

    // "Přihlásit se a vysílat": close our modal (it would make the login dialog inert),
    // then come back with the QR code right after a successful login.
    const requestLogin = useCallback(() => {
        setIsOpen(false);
        setReopenAfterLogin(true);
        showUserDialog();
    }, [showUserDialog]);

    useEffect(() => {
        if (reopenAfterLogin && isLoggedIn) {
            setReopenAfterLogin(false);
            setTab("broadcast");
            setIsOpen(true);
        }
    }, [reopenAfterLogin, isLoggedIn]);

    const openLiveDialog = useCallback((nextTab?: LiveDialogTab) => {
        setTab(nextTab || (isLoggedIn ? "broadcast" : "join"));
        setIsOpen(true);
        markLiveHintSeen();
    }, [isLoggedIn]);

    const value = useMemo(
        () => ({ openLiveDialog, requestLiveLogin: requestLogin }),
        [openLiveDialog, requestLogin]
    );

    return (
        <LiveDialogContext.Provider value={value}>
            {children}
            {isOpen && (
                <LiveDialog
                    tab={tab}
                    onTabChange={setTab}
                    onClose={() => setIsOpen(false)}
                    onLoginRequest={requestLogin}
                />
            )}
        </LiveDialogContext.Provider>
    );
}

type LiveDialogProps = {
    tab: LiveDialogTab;
    onTabChange: (tab: LiveDialogTab) => void;
    onClose: () => void;
    onLoginRequest: () => void;
};

function LiveDialog({ tab, onTabChange, onClose, onLoginRequest }: LiveDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (!dialog.open) dialog.showModal();

        const handleClose = () => onClose();
        // Light-dismiss fallback for browsers without `closedby`.
        const handleBackdropClick = (event: MouseEvent) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const isInside =
                rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
            if (!isInside) dialog.close();
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

    const close = () => dialogRef.current?.close();

    return (
        <dialog
            ref={dialogRef}
            {...({ closedby: "any" } as any)}
            aria-labelledby="live-dialog-title"
            className="share-dialog live-dialog"
        >
            <div className="share-dialog-container">
                <header className="share-dialog-header live-dialog-header">
                    <span className="live-badge-icon live-badge-icon-lg">
                        <LiveIcon size={24} on />
                    </span>
                    <div className="share-dialog-header-text">
                        <h2 id="live-dialog-title" className="share-dialog-title">Živé hraní</h2>
                        <p className="share-dialog-subtitle">
                            Kytarista listuje zpěvníkem a ostatním se písně v mobilu přepínají samy.
                        </p>
                    </div>
                    <button type="button" onClick={close} className="btn-dialog-close" aria-label="Zavřít">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </header>

                <div className="share-dialog-body">
                    <div className="share-tabs" role="tablist" aria-label="Režim živého hraní">
                        <button
                            type="button"
                            role="tab"
                            id="live-tab-broadcast"
                            aria-controls="live-panel-broadcast"
                            aria-selected={tab === "broadcast"}
                            className={`share-tab ${tab === "broadcast" ? "active" : ""}`}
                            onClick={() => onTabChange("broadcast")}
                        >
                            🎸 Hraju – vysílat
                        </button>
                        <button
                            type="button"
                            role="tab"
                            id="live-tab-join"
                            aria-controls="live-panel-join"
                            aria-selected={tab === "join"}
                            className={`share-tab ${tab === "join" ? "active" : ""}`}
                            onClick={() => onTabChange("join")}
                        >
                            🎤 Zpívám – připojit se
                        </button>
                    </div>

                    <div
                        role="tabpanel"
                        id="live-panel-broadcast"
                        aria-labelledby="live-tab-broadcast"
                        hidden={tab !== "broadcast"}
                    >
                        <LiveBroadcastPanel
                            active={tab === "broadcast"}
                            onLoginRequest={onLoginRequest}
                            onJoinRequest={() => onTabChange("join")}
                        />
                    </div>
                    <div
                        role="tabpanel"
                        id="live-panel-join"
                        aria-labelledby="live-tab-join"
                        hidden={tab !== "join"}
                    >
                        <LiveJoinForm onJoined={close} />
                    </div>
                </div>
            </div>
        </dialog>
    );
}
