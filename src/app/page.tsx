import { location } from "@/services/common";

import { Song } from "../../types";
import SongTable from "@/components/SongTable";

export default async function Home() {
  const res = await fetch(location + '/api/song', { cache: "no-store" });
  const songs = await res.json() as Song[];

  return <main>
    <h1 className="hide">Moje akordy</h1>

    <p>
      Možná si říkáte, proč další web s písničkami a básničkami? Inu, pravda je taková, že jsem trochu hudební tragéd.
      Ne, že bych neuměl hrát, ale moje paměť na akordy je... řekněme... selektivní.
      A upřímně, už mě nebavilo lovit akordy po celém internetu a doufat, že budou správně ve všech slokách.
      Tak jsem se rozhodl vzít věci do vlastních rukou a vytvořit místo, kde najdu všechny své oblíbené
      písničky s akordy ke každé sloce. A aby toho nebylo málo, přidal jsem i pár svých oblíbených básniček,
      které mě vždycky dokážou rozesmát nebo pohladit po duši.
    </p>

    <p>
      Takže jestli hledáte inspiraci pro táborák, párty nebo jen tak pro radost, jste na správném místě.
      A pokud náhodou narazíte na chybu v akordech, neváhejte mi dát vědět.
      Všechno je to tady pro vás – a hlavně pro mě, abych se už konečně naučil ty akordy pořádně!
    </p>

    <SongTable songs={songs} />
  </main>;
}
