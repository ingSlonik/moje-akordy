import React from "react";
import { Img } from "./Img";
import LiveIcon from "./LiveIcon";
import { useLiveDialog } from "./LiveDialog";

/**
 * Minimalist & playful entry point for "Živé hraní".
 * Friendly illustration of the turtle band + 1 clear explanation sentence + 2 direct action buttons.
 */
export default function LiveHomeCard() {
    const { openLiveDialog } = useLiveDialog();

    return (
        <section className="live-home-card" aria-labelledby="live-home-title">
            <div className="live-home-visual">
                <Img
                    src="/images/live-session.png"
                    mw={540}
                    format="webp"
                    alt="Želva hraje na ukulele a malé želvičky zpívají a sledují noty v mobilu"
                    className="live-home-hero-img"
                />
            </div>

            <div className="live-home-content">
                <div className="live-home-tag">
                    <LiveIcon size={15} on />
                    <span>Hrajeme a zpíváme spolu</span>
                </div>

                <h2 id="live-home-title" className="live-home-title">
                    Živé hraní
                </h2>

                <p className="live-home-subtitle">
                    Když kytarista listuje zpěvníkem, všem okolo se na mobilu písně přepínají samy od sebe.
                </p>

                <div className="live-home-buttons">
                    <button
                        type="button"
                        className="btn-live btn-live-primary"
                        onClick={() => openLiveDialog("broadcast")}
                    >
                        <span className="btn-live-emoji" aria-hidden="true">🎸</span>
                        <span>Chci hrát (vysílat)</span>
                    </button>

                    <button
                        type="button"
                        className="btn-live btn-live-secondary"
                        onClick={() => openLiveDialog("join")}
                    >
                        <span className="btn-live-emoji" aria-hidden="true">📱</span>
                        <span>Chci se připojit</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
