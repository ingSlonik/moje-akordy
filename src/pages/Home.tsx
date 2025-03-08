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
    description: "Osobní zpěvník Fíly! Obsahuje jak písně s akordy tak proložní básničkama. Je úplně bez reklam! A má auto scroll!"
  });

  return (
    <main>
      <div className="content">
        <h1 className="hide">Fílův zpěvník</h1>

        <div style={{ overflow: "hidden", height: show ? "auto" : "100px" }}>
          <p>
            Možná si říkáte, proč další web s písničkami a básničkami? Inu, pravda je taková, že jsem trochu hudební
            tragéd. Ne, že bych neuměl hrát, ale moje paměť na akordy je... řekněme... selektivní. A upřímně, už mě
            nebavilo lovit akordy po celém internetu a doufat, že budou napsané ve všech slokách (kdo si pamatuje akordy
            napsané pouze v té první). Tak jsem se rozhodl vzít věci do vlastních rukou a vytvořit místo, kde najdu
            všechny své oblíbené písničky s akordy ke každé sloce. A aby toho nebylo málo, přidal jsem i pár svých
            oblíbených básniček, které mě vždycky dokážou rozesmát nebo pohladit po alkoholem povzbuzené duši.
          </p>

          <p>
            Takže jestli hledáte inspiraci pro táborák, párty nebo jen tak pro radost, jste na správném místě. Ať už
            jste ostřílení muzikanti, nebo jako já bojujete s amnézií, tady se nemusíte bát žádných reklamních triků ani
            záludných vyskakovacích okének. Jen čistá radost z hudby a poezie. Navíc s automatickým rolováním, takže se
            můžete soustředit na hraní a zpěv, místo abyste říklai {`"posuň to dolů .... teď!"`}.
          </p>

          <p>
            A pokud náhodou narazíte na chybu v akordech, neváhejte mi dát vědět. Všechno je to tady pro vás – a hlavně
            pro mě, abych se už konečně naučil ty akordy pořádně a lidi si mysleli, že dovedu zahrát všechno (ale je to
            jen tento zpěvník)!
          </p>
        </div>
        <button onClick={() => setShow(!show)}>{show ? "Raději to zase schovej" : "Zobrazit celý text"}</button>
        <br />
        <br />

        {isLoading && <p>Písně se načítají...</p>}
        {error && <p className="error">{error.message}</p>}
        {songs && !(songs instanceof Error) && <SongTable songs={songs} />}
      </div>
    </main>
  );
}
