import { useState } from "react";
import { useSSRHook } from "ssr-hook";
import { useTitle } from "easy-page-router/react";

import SongTable from "../components/SongTable";
import { useHead } from "../../services/common";
import { Song } from "../../types";

export default function HomePage() {
  const [show, setShow] = useState(false);

  const [songs, error, isLoading, reload] = useSSRHook<Song[]>(`/api/songs`);

  useTitle(`Fílův zpěvník`);

  useHead({
    title: "Fílův zpěvník",
    description: "Osobní zpěvník Fíly! Obsahuje jak písně s akordy, tak proložení básničkami. Je úplně bez reklam a má i boží auto scroll!"
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
          <div
            className="intro-wrapper"
            style={{ maxHeight: show ? "1000px" : "110px" }}
          >
            <p>
              Možná si říkáte, proč další web s písničkami a básničkami? Inu, pravda je taková, že jsem tak trochu hudební
              tragéd. Ne že bych vyloženě neuměl hrát, ale moje paměť na akordy je... řekněme... silně selektivní. A upřímně, už mě
              nebavilo lovit akordy po všech čertech a doufat, že budou napsané u všech slok (kdo si má pamatovat akordy
              napsané jen u té první, že?). Tak jsem se rozhodl vzít věci do vlastních rukou a vytvořit místo, kde najdu
              všechny své oblíbené písničky s akordy hezky pohromadě. A aby toho nebylo málo, přihodil jsem i pár svých
              oblíbených básniček, které mě vždycky dokážou rozesmát – nebo alespoň pohladit po alkoholem povzbuzené duši.
            </p>

            <p>
              Takže jestli hledáte inspiraci na táborák, párty nebo jen tak pro radost, jste tu správně. Ať už
              jste ostřílení muzikanti, nebo jako já bojujete s lehkou amnézií, tady se nemusíte bát žádných reklamních triků ani
              záludných vyskakovacích okének. Jen čistá radost z hudby, poezie a mých překlepů. A navíc s automatickým rolováním!
              Můžete se tak na 100 % soustředit na hraní a zpěv, místo abyste na někoho pořád řvali: {"„posuň to dolů... a TEĎ!“"}.
            </p>

            <p>
              A pokud náhodou narazíte na chybu v akordech, neváhejte mi dát vědět. Všechno je to tady pro vás – a hlavně
              pro mě, abych se už konečně naučil ty akordy pořádně a lidi si pak mysleli, že dovedu zahrát úplně všechno (ve
              skutečnosti ale zahraju jen to, co je v tomhle zpěvníku)!
            </p>
          </div>
          <button
            className="btn-subtle"
            style={{ marginTop: "8px" }}
            onClick={() => setShow(!show)}
          >
            {show ? "Skrýt text" : "Číst dále..."}
          </button>
        </div>

        {isLoading && <p>Hledám zatoulané trsátko a načítám písně...</p>}
        {error && <p className="error">{error.message}</p>}
        {songs && !(songs instanceof Error) && (
          <div className="song-table-container">
            <SongTable songs={songs} />
          </div>
        )}
      </div>
    </main>
  );
}
