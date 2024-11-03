import { useState } from "react";
import { useSongs } from "../../services/hooks.ts";

import SongTable from "../components/SongTable.tsx";

/* TODO
export const metadata: Metadata = {
    title: "Fílův zpěvník",
    description: "Osobní zpěvník Fíly! Obsahuje jak písně s akordy tak proložní básničkama. Je úplně bez reklam! A má auto scroll!",
};
*/

export default function HomePage() {
  const songs = useSongs();

  const [show, setShow] = useState(false);
  return (
    <main>
      <div className="content">
        <div className="scroll">
          <h1 className="hide">Fílův zpěvník</h1>

          <div style={{ overflow: "hidden", height: show ? "auto" : "100px" }}>
            <p>
              Možná si říkáte, proč další web s písničkami a básničkami? Inu, pravda je taková, že jsem trochu hudební
              tragéd. Ne, že bych neuměl hrát, ale moje paměť na akordy je... řekněme... selektivní. A upřímně, už mě
              nebavilo lovit akordy po celém internetu a doufat, že budou napsané ve všech slokách (kdo si pamatuje
              akordy napsané pouze v té první). Tak jsem se rozhodl vzít věci do vlastních rukou a vytvořit místo, kde
              najdu všechny své oblíbené písničky s akordy ke každé sloce. A aby toho nebylo málo, přidal jsem i pár
              svých oblíbených básniček, které mě vždycky dokážou rozesmát nebo pohladit po alkoholem povzbuzené duši.
            </p>

            <p>
              Takže jestli hledáte inspiraci pro táborák, párty nebo jen tak pro radost, jste na správném místě. Ať už
              jste ostřílení muzikanti, nebo jako já bojujete s amnézií, tady se nemusíte bát žádných reklamních triků
              ani záludných vyskakovacích okének. Jen čistá radost z hudby a poezie. Navíc s automatickým rolováním,
              takže se můžete soustředit na hraní a zpěv, místo abyste říklai {`"posuň to dolů .... teď!"`}.
            </p>

            <p>
              A pokud náhodou narazíte na chybu v akordech, neváhejte mi dát vědět. Všechno je to tady pro vás – a
              hlavně pro mě, abych se už konečně naučil ty akordy pořádně a lidi si mysleli, že dovedu zahrát všechno
              (ale je to jen tento zpěvník)!
            </p>
          </div>
          <button onClick={() => setShow(!show)}>{show ? "Raději to zase schovej" : "Zobrazit celý text"}</button>
          <br />
          <br />

          {songs === null && <p>Písně se načítají...</p>}
          {songs instanceof Error && <p className="error">{songs.message}</p>}
          {songs && !(songs instanceof Error) && <SongTable songs={songs} />}
        </div>
      </div>
    </main>
  );
}
