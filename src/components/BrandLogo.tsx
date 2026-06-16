import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

export const BRAND_ASSETS = {
  logo: "/SvaraRx-Logo-Transparent.png",
  logoWhiteBg: "/SvaraRx-Logo-white-bg.png",
  icon: "/SvaraRx-Icon.png",
} as const;

export const BRAND_TAGLINE = "Doctor speaks. Prescription prints.";

type BrandLogoProps = {
  variant?: "sidebar" | "mobile" | "auth";
  href?: string;
  onClick?: () => void;
  className?: string;
  showTagline?: boolean;
};

export function BrandLogo({
  variant = "sidebar",
  href = "/",
  onClick,
  className,
  showTagline = variant !== "mobile",
}: BrandLogoProps) {
  const isMobile = variant === "mobile";
  const isAuth = variant === "auth";

  const image = (
    <Image
      src={isMobile ? BRAND_ASSETS.icon : BRAND_ASSETS.logo}
      alt="SvaraRx"
      width={isMobile ? 32 : isAuth ? 220 : 168}
      height={isMobile ? 32 : isAuth ? 48 : 40}
      style={isMobile ? undefined : { width: "auto" }}
      className={clsx(
        "object-contain",
        isMobile ? "h-8 w-8" : isAuth ? "h-12 mx-auto" : "h-9"
      )}
      priority={isAuth}
    />
  );

  const content = (
    <div className={clsx("min-w-0", className)}>
      {image}
      {showTagline && !isMobile && (
        <p className="text-xs text-mute mt-1.5">{BRAND_TAGLINE}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
