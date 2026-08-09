import { useEffect, useState } from "react";

/**
 * Returns a pixel height that tracks the *visual* viewport when available.
 * On Android the on-screen keyboard often resizes the visual viewport without
 * updating `100dvh`, which pushes fixed-height layouts (and their bottom bars)
 * off screen. Falls back to `window.innerHeight`, and to a CSS value while SSR.
 */
export const useViewportHeight = (): number | undefined => {
  const [height, setHeight] = useState<number | undefined>(() =>
    typeof window === "undefined"
      ? undefined
      : window.visualViewport?.height ?? window.innerHeight
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const vv = window.visualViewport;
      setHeight(vv ? vv.height : window.innerHeight);
    };

    update();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return height;
};
