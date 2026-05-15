import horizontal from "@/assets/logos/apnea_mate_logo_orizzontale.png";
import horizontalWhite from "@/assets/logos/apnea_mate_logo_orizzontale_white.png";
import horizontalMonoBlack from "@/assets/logos/apnea_mate_logo_orizzontale_mono_black.png";
import horizontalMonoWhite from "@/assets/logos/apnea_mate_logo_orizzontale_mono_white.png";
import app from "@/assets/logos/apnea_mate_logo_app.png";
import appWhite from "@/assets/logos/apnea_mate_logo_app_white.png";
import symbol from "@/assets/logos/apnea_mate_pittogramma.png";
import symbolWhite from "@/assets/logos/apnea_mate_pittogramma_white.png";
import symbolBlack from "@/assets/logos/apnea_mate_pittogramma_black.png";

export type LogoVariant =
  | "horizontal"
  | "horizontal-white"
  | "horizontal-mono-black"
  | "horizontal-mono-white"
  | "app"
  | "app-white"
  | "symbol"
  | "symbol-white"
  | "symbol-black";

const SOURCES: Record<LogoVariant, string> = {
  horizontal,
  "horizontal-white": horizontalWhite,
  "horizontal-mono-black": horizontalMonoBlack,
  "horizontal-mono-white": horizontalMonoWhite,
  app,
  "app-white": appWhite,
  symbol,
  "symbol-white": symbolWhite,
  "symbol-black": symbolBlack,
};

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: LogoVariant;
}

export const Logo = ({ variant = "horizontal", alt = "Apnea Mate", ...props }: LogoProps) => {
  return <img src={SOURCES[variant]} alt={alt} {...props} />;
};

export default Logo;