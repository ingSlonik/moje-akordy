import React, { useState } from "react";
import SongTable from "../components/SongTable";
import LiveHomeCard from "../components/LiveHomeCard";
import { useSSRApi } from "../services/api";
import { useHead } from "../services/common";

export default function Index() {
    const [showIntro, setShowIntro] = useState(false);
    const [songs, error, isLoading] = useSSRApi.getSongs({});

    useHead({
        title: "Fílův zpěvník",
        description: "Osobní zpěvník Fíly! Obsahuje jak písně s akordy, tak proložení básničkami. Je úplně bez reklam a má i boží auto scroll!",
    });

    return (
        <main>
            <div className="content">
                <div className="hero-section">
                    <h1><span>Fílův</span> zpěvník</h1>
                    <p className="hero-subtitle">
                        Můj osobní hudební společník bez reklam. Skvělý k táboráku i na domácí trénink!
                    </p>
                </div>

                <div className="intro-card">
                    <div className={`intro-wrapper ${showIntro ? "expanded" : "collapsed"}`}>
                        <p>
                            Možná si říkáte, proč vznikl další web s písničkami a básničkami? Protože hraní s přáteli u táboráku
                            nebo doma v obýváku má být hlavně o pohodě – ne o lovení akordů po všech čertech, zavírání otravných reklam
                            a věčném hádání, co se vlastně hraje ve třetí sloce, když někdo vypsal akordy jen u té první. A tak jsem
                            vzal věci do vlastních rukou a vytvořil čisté místo, kde jsou oblíbené písničky poctivě a přehledně
                            zpracované od prvního hrábnutí do strun až po poslední refrén. A pro chvíle, kdy si prsty potřebují
                            na moment odpočinout, tu najdete i sbírku básniček na rozesmání a dobrou náladu.
                        </p>

                        <p>
                            Aby šlo hraní úplně samo, přidal jsem pár vychytávek, které v praxi ušetří spoustu nervů. Automatické
                            rolování pohlídá text za vás, takže máte obě ruce volné na nástroj a nemusíte uprostřed nejlepšího sóla
                            na nikoho zoufale křičet: „posuň to dolů... a TEĎ!“. Jedním kliknutím si navíc každou píseň transponujete
                            do tóniny, která sedne vašim hlasivkám. A když se sejde celá parta, stačí zapnout <strong>Živé hraní</strong> –
                            ostatní načtou QR kód a na mobilu se jim zpěvník otáčí sám přesně podle toho, co zrovna hrajete.
                        </p>

                        <p>
                            Zpěvník navíc neustále žije a roste. U písniček si můžete hvězdičkami označit, jak dobře je máte v malíčku,
                            filtrovat si svůj repertoár nebo přes editor snadno přidat vlastní oblíbené kousky. A pokud náhodou
                            narazíte na zatoulaný akord či překlep, dejte mi vědět nebo ho rovnou opravte. Ať už jste ostřílení muzikanti,
                            nebo si prostě jen rádi zazpíváte v dobré společnosti, tenhle zpěvník je tu pro vás – bez reklam
                            a ve správné tónině!
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-subtle"
                        onClick={() => setShowIntro(!showIntro)}
                    >
                        {showIntro ? "Skrýt text" : "Číst dále..."}
                    </button>
                </div>

                <LiveHomeCard />

                {isLoading && <p className="loading-state">Hledám zatoulané trsátko a načítám písně...</p>}
                {error && <p className="error-state">Chyba načítání: {error.message}</p>}
                {songs && (
                    <SongTable songs={songs} />
                )}
            </div>
        </main>
    );
}
