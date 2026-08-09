import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onDecoded: (text: string) => void;
  onError?: (err: string) => void;
  paused?: boolean;
  className?: string;
}

const REGION_ID = "qr-scanner-region";

export const QrScanner = ({ onDecoded, onError, paused, className }: Props) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    const start = async () => {
      try {
        const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => {
            if (decodedRef.current || cancelled) return;
            decodedRef.current = true;
            onDecoded(text);
          },
          () => {},
        );
      } catch (e) {
        onError?.(e instanceof Error ? e.message : String(e));
      }
    };
    start();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && s.getState && s.getState() !== 1) {
        s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch {} });
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return <div id={REGION_ID} className={className} />;
};
