import React, { useId, useState } from "react";
import { useRouter } from "easy-page-router/react";
import { isValidLiveCode, LIVE_CODE_LENGTH, markLiveHintSeen, normalizeLiveCode } from "../utils/live";

export type LiveJoinFormProps = {
    /** "card" = compact inline variant for the home page. */
    variant?: "dialog" | "card";
    onJoined?: () => void;
};

/** "Mám kód od kytaristy" - join someone's live session by typing the code. */
export default function LiveJoinForm({ variant = "dialog", onJoined }: LiveJoinFormProps) {
    const { push } = useRouter();
    const id = useId();
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const code = normalizeLiveCode(value);
        if (!isValidLiveCode(code)) {
            setError(`Kód má ${LIVE_CODE_LENGTH} znaků, např. K7F 3Q9.`);
            return;
        }
        setError("");
        markLiveHintSeen();
        onJoined?.();
        push(`/live/${code}`);
    }

    return (
        <form className={`live-join-form live-join-${variant}`} onSubmit={handleSubmit} noValidate>
            <label htmlFor={`${id}-code`} className="live-join-label">
                Kód od kytaristy
            </label>
            <div className="live-join-row">
                <input
                    id={`${id}-code`}
                    name="code"
                    type="text"
                    className="live-join-input"
                    placeholder="K7F 3Q9"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value.toUpperCase());
                        if (error) setError("");
                    }}
                    maxLength={LIVE_CODE_LENGTH + 2}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    enterKeyHint="go"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={`${id}-help`}
                    required
                />
                <button type="submit" className="btn-live">
                    Připojit
                    <span aria-hidden="true">→</span>
                </button>
            </div>
            <p id={`${id}-help`} className={`live-join-help ${error ? "is-error" : ""}`} aria-live="polite">
                {error || "Nebo jen naskenujte QR kód fotoaparátem."}
            </p>
        </form>
    );
}
