import { cn } from "@/lib/utils";

export type BrandIconName = "buddy" | "gruppi" | "scuole" | "spot";
export type BrandIconVariant = "color" | "white";

const ICON_PATHS: Record<BrandIconName, Record<BrandIconVariant, string>> = {
  buddy: {
    color: "/assets/icons/buddy.png",
    white: "/assets/icons/buddy_bianco.png",
  },
  gruppi: {
    color: "/assets/icons/gruppi.png",
    white: "/assets/icons/gruppi_bianco.png",
  },
  scuole: {
    color: "/assets/icons/scuole.png",
    white: "/assets/icons/scuole_bianco.png",
  },
  spot: {
    color: "/assets/icons/spot.png",
    white: "/assets/icons/spot_bianco.png",
  },
};

const ALT: Record<BrandIconName, string> = {
  buddy: "Buddy",
  gruppi: "Gruppo",
  scuole: "Scuola",
  spot: "Spot",
};

interface BrandIconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  name: BrandIconName;
  variant?: BrandIconVariant;
  size?: number;
}

/**
 * Brand icon component. Renders one of the four Apnea Mate brand marks
 * (buddy / gruppi / scuole / spot) in either full-color or white variant.
 * Never apply CSS filters or recoloring — pick the correct variant instead.
 */
export const BrandIcon = ({
  name,
  variant = "color",
  size = 24,
  alt,
  className,
  style,
  ...props
}: BrandIconProps) => {
  return (
    <img
      src={ICON_PATHS[name][variant]}
      alt={alt ?? ALT[name]}
      width={size}
      height={size}
      className={cn("object-contain inline-block", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  );
};

export default BrandIcon;