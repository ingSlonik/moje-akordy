import { useEffect, useState } from "react";

const fontSize = 12;
// const frameRate = 60;

/**
 * @param speed Speed in ms for one text line.
 * @returns
 */
export default function AutoScroll(
  { speed = 1000, refScroll }: { speed: number; refScroll: React.RefObject<null | HTMLDivElement> },
) {
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const element = refScroll.current;
    if (scroll || !element) return;

    // const shift = Math.ceil(frameRate * fontSize / speed);
    const frameRate = speed / fontSize;
    const shift = 1;
    const int = setInterval(() => {
      element.scrollTo(0, element.scrollTop + shift);
    }, frameRate);
    return () => clearInterval(int);
  }, [scroll, speed]);

  return (
    <div className="auto-scroll">
      <button onClick={() => setScroll(!scroll)}>Auto scroll ({scroll ? "off" : "on"})</button>
    </div>
  );
}
